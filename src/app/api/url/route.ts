import { expandUrl } from '@/common/expand-url';
import { checkRequestRateLimit } from '@/common/rate-limit';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
	const url = new URL(request.url).searchParams.get('url');

	// Get the shortened URL
	if (!url) {
		return new Response('Missing URL parameter', { status: 400 });
	}

	// Ratelimit this endpoint
	const rateLimitOk = await checkRequestRateLimit(request);
	if (!rateLimitOk) {
		return new Response('Rate limit exceeded', { status: 429 });
	}

	// Check if we have this cached
	const env = getRequestContext().env;
	const cache = await env.CACHE.get(`expand:${url}`);
	if (cache) {
		return new Response(cache, {
			headers: {
				'content-type': 'text/plain',
			},
		});
	}

	// Expand the shortened URL
	const expandedUrl = await expandUrl(url);

	// Cache the expanded URL forever
	await env.CACHE.put(`expand:${url}`, expandedUrl);

	// Return the expanded URL
	return new Response(expandedUrl);
}
