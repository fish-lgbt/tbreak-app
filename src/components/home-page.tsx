import { cn } from '@/cn';
import { cachedFetch } from '@/common/cached-fetch';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { Link } from '@/navigation';
import { getRelativeTimeString } from '@/common/get-relative-time-string';
import { getTranslations } from 'next-intl/server';
import { ScaledNumber } from './scaled-number';
import { Tooltip } from './tooltip';

const formatNumberToHumanReadable = (number: number) => {
	const num = Math.abs(number);

	if (num < 1_000) {
		return num;
	}

	if (num < 1_000_000) {
		return `${(num / 1_000).toFixed(1)}K`;
	}

	return `${(num / 1_000_000).toFixed(1)}M`;
};

const getHomePageStats = async (env: CloudflareEnv) => {
	// Get user_id, username from users and then use the user_id to get the followers of each user from the stats table
	// The stats also needs to be the newest by created_at
	const rows = await env.DATABASE.prepare('SELECT user_id, username FROM users').all<{
		user_id: number;
		username: string;
		followers: number;
		following: number;
		tweets: number;
	}>();
	return await Promise.all(
		rows.results.map(async (row) => {
			// Get stats for the last 48 hours
			const { results } = await env.DATABASE.prepare(
				'SELECT followers, following, tweets, created_at FROM stats WHERE user_id = ? ORDER BY created_at DESC LIMIT 100'
			)
				.bind(row.user_id)
				.all<{ followers: number; following: number; tweets: number; created_at: string }>();

			if (results.length === 0) {
				return {
					username: row.username,
					followers: 0,
					following: 0,
					tweets: 0,
				};
			}

			// Get the newest entry for yesterday
			const yesterday = results.reduce((acc, row) => {
				const date = new Date(row.created_at);
				const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
				if (key === new Date().toISOString().split('T')[0]) {
					return acc;
				}
				return row;
			});

			// If there is no entry for yesterday, return 0
			if (!yesterday) {
				return {
					username: row.username,
					followers: 0,
					following: 0,
					tweets: 0,
				};
			}

			// Get the newest entry for today
			const today = results.reduce((acc, row) => {
				const date = new Date(row.created_at);
				const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
				if (key === new Date().toISOString().split('T')[0]) {
					return row;
				}
				return acc;
			});

			// Work out the difference between the two
			return {
				username: row.username,
				followers: today.followers - yesterday.followers,
				following: today.following - yesterday.following,
				tweets: today.tweets - yesterday.tweets,
			};
		})
	).then((results) => results.sort((a, b) => b.followers - a.followers));
};

type HomePageProps = {
	locale: string;
};

export const HomePage = async ({ locale }: HomePageProps) => {
	const env = getRequestContext().env;
	const t = await getTranslations();

	// Get the homepage stats
	// This will cache the result for 1 hour
	const stats = await cachedFetch('app/home', async () => getHomePageStats(env));

	// If we failed to get the stats, return a message
	if (!stats) {
		return <div>{t('errors.fetching-failed')}</div>;
	}

	// We scrape on the 0th minute of every hour
	const nextScrapeTime = new Date(new Date().setUTCHours(new Date().getUTCHours() + 1, 0, 0, 0));

	return (
		<div className="flex flex-row justify-between w-[500px]">
			<div className="flex flex-col gap-2">
				<h1 className="text-xl uppercase">{t('common.users')}</h1>
				<div className="p-2 flex flex-col gap-2">
					{stats.map((row) => (
						<User key={row.username} username={row.username} followers={row.followers} />
					))}
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<h1 className="text-xl uppercase">{t('common.info')}</h1>
				<div className="p-2 flex flex-col gap-2 w-max">
					<div>
						{t.rich('pages.home.total-users', {
							users: stats.length,
							ScaledNumber: (children) => <ScaledNumber>{children}</ScaledNumber>,
						})}
					</div>
					<div>
						{t.rich('pages.home.total-followers', {
							followers: stats.reduce((acc, row) => acc + row.followers, 0),
							ScaledNumber: (children) => <ScaledNumber>{children}</ScaledNumber>,
						})}
					</div>
					<div>
						{t.rich('pages.home.total-following', {
							following: stats.reduce((acc, row) => acc + row.following, 0),
							ScaledNumber: (children) => <ScaledNumber>{children}</ScaledNumber>,
						})}
					</div>
					<div>
						{t.rich('pages.home.total-tweets', {
							tweets: stats.reduce((acc, row) => acc + row.tweets, 0),
							ScaledNumber: (children) => <ScaledNumber>{children}</ScaledNumber>,
						})}
					</div>
					<div>
						The next scrape will be{' '}
						<span className="underline decoration-dotted" title={nextScrapeTime.toISOString()}>
							{getRelativeTimeString(nextScrapeTime, locale)}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

type UserProps = {
	username: string;
	followers: number;
};
const User = async ({ username, followers }: UserProps) => {
	const t = await getTranslations();
	const tooltip = t.rich('pages.home.user.tooltip', {
		username,
		followers,
	});

	return (
		<div className="w-fit flex flex-row gap-1">
			<Link className="hover:underline" href={`/users/${username}`} prefetch={false}>
				{username}
			</Link>
			<div>
				<Tooltip tooltip={tooltip}>
					[
					<span
						className={cn([
							// Lost followers
							'text-red-500',
							// No change
							followers === 0 && 'text-white',
							// Gained followers
							followers >= 1 && 'text-green-500',
						])}
					>
						{followers >= 1 ? '+' : followers === 0 ? '' : '-'}
						{formatNumberToHumanReadable(followers)}
					</span>
					]
				</Tooltip>
			</div>
		</div>
	);
};
