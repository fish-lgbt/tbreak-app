import { getRequestContext } from '@cloudflare/next-on-pages';

export const cachedFetch = async <T = unknown>(cacheKey: CacheKeys, func: () => Promise<T>): Promise<T | null> => {
	const env = getRequestContext().env;

	// Check if we have the result in cache
	const cached = await env.CACHE.get(cacheKey);
	if (cached) {
		return JSON.parse(cached);
	}

	// Get the result
	const result = await func();

	// If we dont have a result dont cache it
	if (!result) {
		return null;
	}

	// Cache this for 1 hour since the data only change hourly
	await env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 });

	// Return the cached result
	return result;
};
