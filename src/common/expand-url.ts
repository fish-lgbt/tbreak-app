import { getRequestContext } from '@cloudflare/next-on-pages';

export const expandUrl = async (shortenedUrl: string) => {
	console.info(`Expanding URL: ${shortenedUrl}`);

	const env = getRequestContext().env;
	try {
		// Check if we have this cached
		const cache = await env.CACHE.get(`expand:${shortenedUrl}`);
		if (cache) {
			console.info(`Found expanded URL in cache: ${cache}`);
			return cache;
		}

		// Expand the shortened URL
		const response = await fetch(shortenedUrl, {
			method: 'GET',
			redirect: 'follow',
		});

		// Check if the URL was successfully expanded
		if (!response.ok) {
			console.error(`Failed to expand URL: ${shortenedUrl}`);
			throw new Error(`Failed to expand URL: ${shortenedUrl}`);
		}

		console.info('Cahing expanded URL:', response.url);

		// Cache the expanded URL forever
		await env.CACHE.put(`expand:${shortenedUrl}`, response.url);

		// Return the expanded URL
		return response.url;
	} catch (error) {
		console.error('Failed to expand URL:', error);
		throw error;
	}
};
