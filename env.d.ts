type FetchStatsQueueMessage = {
	username: string;
};

type NewUserQueueMessage = {
	username: string;
};

type CacheKeys =
	// Expanded urls
	| `expand:${string}`
	// api route for user
	| `api/users/${string}`
	// stats for homepage
	| 'app/home';

interface CloudflareEnv {
	DATABASE: D1Database;
	QUEUE: Queue<FetchStatsQueueMessage>;
	CACHE: KVNamespace<CacheKeys>;

	RLIMIT_NAMESPACE: string;
}
