/* eslint-disable @next/next/no-img-element */
'use client';

import { formatNumberToHumanReadable } from '@/common/format-number';
import { getStats } from '@/common/get-stats';
import { Box } from '@/components/box';
import { StatsBox } from '@/components/stats-box';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@/navigation';

type PageProps = {
	params: {
		username: string;
	};
};

export const runtime = 'edge';
import { useTranslations } from 'next-intl';

const Bio = ({ bio }: { bio: string }) => (
	<div className="p-2">
		<p>
			{bio.split(/(\s+|\n)/).map((string) => {
				// Hashtag
				if (string.startsWith('#')) {
					return (
						<Link
							href={`https://twitter.com/hashtag/${string.slice(1)}`}
							className="text-blue-500 hover:underline"
							key={string}
							target="_blank"
							rel="noopener noreferrer"
							prefetch={false}
						>
							{string}{' '}
						</Link>
					);
				}

				// Link
				if (string.startsWith('http')) {
					const url = new URL(string);
					return (
						<>
							<Link
								href={string}
								className="text-blue-500 hover:underline"
								key={string}
								target="_blank"
								rel="noopener noreferrer"
								prefetch={false}
							>
								{url.hostname}
								{url.pathname === '/' ? '' : url.pathname}
							</Link>{' '}
						</>
					);
				}

				// Mention
				if (string.startsWith('@')) {
					return (
						<Link href={`https://twitter.com/${string}`} className="text-blue-500 hover:underline" key={string} prefetch={false}>
							{string}{' '}
						</Link>
					);
				}

				// Everything else
				return string + ' ';
			})}
		</p>
	</div>
);

export default function Page({ params: { username } }: PageProps) {
	const queryClient = useQueryClient();
	const t = useTranslations();
	const { isLoading, data } = useQuery({
		queryKey: ['users', username],
		queryFn: async () => {
			const response = await fetch(`/api/users/${username}`);
			if (!response.ok) {
				throw new Error('An error occurred while fetching the data.');
			}
			return response.json() as Promise<ReturnType<typeof getStats>>;
		},
	});

	const {
		mutate: addUser,
		isPending,
		error,
	} = useMutation({
		mutationKey: ['users', username, 'add'],
		mutationFn: async () => {
			const response = await fetch(`/api/users/${username}`, {
				method: 'POST',
			});
			if (!response.ok) {
				throw new Error('An error occurred while adding the user.');
			}

			// Clear the cache for the user since they should now exist
			queryClient.invalidateQueries({ queryKey: ['users', username] });
		},
	});

	// Loading
	if (isLoading)
		return (
			<main className="text-xs font-mono flex items-center justify-center h-screen">
				<div>{t('common.loading-indicator')}</div>
			</main>
		);

	// User's profile data
	const user = data?.profile;

	// No user found
	if (!user) {
		return (
			<main className="text-xs font-mono flex items-center justify-center h-screen">
				<div className="flex flex-col gap-2 text-center items-center">
					<h1 className="text-2xl font-bold">User not found</h1>
					<div>
						<p>Would you like to add this user?</p>
						<input type="text" placeholder="username" hidden />
					</div>
					{isPending && <div>Adding user...</div>}
					{error && <div>{error.message}</div>}
					<div className="flex flex-row gap-2 justify-center text-white w-1/2">
						<button
							className="p-1 w-1/2 border hover:scale-95 active:scale-95 bg-green-500"
							disabled={isPending || !!error}
							onClick={() => {
								// Add user
								addUser();
							}}
						>
							yes
						</button>
						<button
							className="p-1 w-1/2 border hover:scale-95 active:scale-95 bg-red-500"
							disabled={isPending || !!error}
							onClick={() => {
								// Goto homepage
								window.location.href = '/';
							}}
						>
							no
						</button>
					</div>
				</div>
			</main>
		);
	}

	// Generate 280 days and get total gained that day from the stats array
	const stats = Array.from({ length: 280 }, (_, i) => {
		const date = new Date();
		date.setDate(date.getDate() - i);
		const todayStats = data.stats.filter((stat) => {
			const statDate = new Date(stat.date);
			return (
				statDate.getDate() === date.getDate() && statDate.getMonth() === date.getMonth() && statDate.getFullYear() === date.getFullYear()
			);
		});
		const latestStatsToday = todayStats.find((stat) => stat);

		return {
			date: date,
			followers: latestStatsToday?.followers,
			following: latestStatsToday?.following,
			tweets: latestStatsToday?.tweets,
			diff: {
				followers: todayStats.reduce((acc, stat) => acc + stat.diff.followers, 0),
				following: todayStats.reduce((acc, stat) => acc + stat.diff.following, 0),
				tweets: todayStats.reduce((acc, stat) => acc + stat.diff.tweets, 0),
			},
		};
	});
	// Get the last stat that has data
	const latestStats = data.stats.toReversed().find((stat) => stat);

	// Generate months for the stats box
	const currentMonthIndex = new Date().getMonth() + 1;
	const months = Array.from({ length: 12 }, (_, i) => {
		const month = (i + currentMonthIndex + 1) % 12;
		return new Date(`2000/${month === 0 ? 12 : month}/01`).toLocaleDateString(navigator.language, { month: 'short' });
	});

	return (
		<main className="text-xs font-mono p-10 justify-center flex">
			<div className="w-[650px]">
				<Box className="h-[235px] p-1 border border-[#EBEDF0] dark:border-[#161B22]">
					<div
						className="flex h-40 bg-center bg-cover bg-no-repeat relative"
						style={{
							backgroundImage: `url(${user?.banner})`,
						}}
					>
						<div className="w-fit h-fit absolute -bottom-[40%] left-5">
							<img src={user.avatar} alt={user.username} className="size-20 rounded-full border-2 border-black" />
							<h1 className="text-xl font-bold hover:underline">
								<Link href={`https://twitter.com/${user.username}`}>@{user.username}</Link>
							</h1>
						</div>
						<div className="w-fit h-fit absolute -bottom-[40%] right-5 flex flex-row gap-2 font-normal text-center">
							<Box inverted className="p-2 flex flex-col gap-1">
								<span className="uppercase">{t('common.followers')}</span>
								<span>{latestStats?.followers ? formatNumberToHumanReadable(latestStats.followers) : '-'}</span>
							</Box>
							<Box inverted className="p-2 flex flex-col gap-1">
								<span className="uppercase">{t('common.following')}</span>
								<span>{latestStats?.following ? formatNumberToHumanReadable(latestStats.following) : '-'}</span>
							</Box>
						</div>
					</div>
				</Box>
				<Box className="p-2">
					<Bio bio={user?.bio} />
				</Box>
				<div className="flex flex-col gap-2 pt-2">
					<div>
						<h1 className="text-lg font-bold">{t('common.followers')}</h1>
						<div className="flex justify-center p-2">
							<StatsBox
								stats={stats}
								period="year"
								type="followers"
								lables={{
									left: [],
									top: months,
								}}
							/>
						</div>
					</div>
					<div>
						<h1 className="text-lg font-bold">{t('common.following')}</h1>
						<div className="flex justify-center p-2">
							<StatsBox
								stats={stats}
								period="year"
								type="following"
								lables={{
									left: [],
									top: months,
								}}
							/>
						</div>
					</div>
					<div>
						<h1 className="text-lg font-bold">{t('common.tweets')}</h1>
						<div className="flex justify-center p-2">
							<StatsBox
								stats={stats}
								period="year"
								type="tweets"
								lables={{
									left: [],
									top: months,
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
