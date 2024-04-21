export const getStats = async (env: CloudflareEnv, username: string) => {
	const result = await env.DATABASE.prepare('SELECT user_id FROM users WHERE username = ?').bind(username).first<{
		user_id: number;
	}>();
	const userId = result?.user_id;
	if (!userId) {
		return null;
	}

	const profile = await env.DATABASE.prepare('SELECT * FROM users WHERE user_id = ?').bind(userId).first<{
		username: string;
		avatar: string;
		banner: string;
		bio: string;
		location: string;
		website: string;
		joined_at: string;
	}>();

	const rows = await env.DATABASE.prepare('SELECT * FROM stats WHERE user_id = ?').bind(userId).all<{
		followers: number;
		following: number;
		tweets: number;
		created_at: string;
	}>();

	// Dedeplicate the stats so we only have one record per hour
	const stats = rows.results.reduce((acc, row) => {
		const date = new Date(row.created_at);
		const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}`;

		if (!acc[key]) {
			acc[key] = {
				followers: row.followers,
				following: row.following,
				tweets: row.tweets,
				date,
			};
		}

		return acc;
	}, {} as Record<string, { followers: number; following: number; tweets: number; date: Date }>);

	const statsWithDiff = Object.entries(stats).map(([key, stat], i) => {
		const prevStat = stats[Object.keys(stats)[i - 1]];

		// First stat, has a diff of 0
		if (i === 0) {
			return {
				...stat,
				diff: {
					followers: 0,
					following: 0,
					tweets: 0,
				},
			};
		}

		return {
			...stat,
			diff: {
				followers: stat.followers - (prevStat?.followers ?? 0),
				following: stat.following - (prevStat?.following ?? 0),
				tweets: stat.tweets - (prevStat?.tweets ?? 0),
			},
		};
	});

	return { profile, stats: statsWithDiff };
};
