import { getRequestContext } from '@cloudflare/next-on-pages';
import { RateLimit } from '@rlimit/http';
import { NextRequest } from 'next/server';

const createRateLimitKey = (meta: Record<string, string | number>) => {
	return Object.entries(meta)
		.map(([key, value]) => `[${key}:${value}]`)
		.join(' ');
};

/**
 * Check if the request is within the rate limit.
 *
 * @param request The incoming request.
 * @returns Whether the request is within the rate limit.
 */
export const checkRequestRateLimit = async (request: NextRequest) => {
	const env = getRequestContext().env;
	const ipAddress = request.headers.get('cf-connecting-ip') ?? 'localhost';
	const requestRateLimiter = new RateLimit({
		namespace: env.RLIMIT_NAMESPACE,
		maximum: 100,
		interval: '1m',
	});
	const limit = await requestRateLimiter.check(
		createRateLimitKey({
			ip: ipAddress,
			path: request.nextUrl.pathname,
		})
	);
	return limit.ok;
};

/**
 * Check if the request to add a user is within the rate limit.
 *
 * @param request The incoming request.
 * @returns Whether the request is within the rate limit.
 */
export const checkAddUserRateLimit = async (request: NextRequest) => {
	const env = getRequestContext().env;
	const ipAddress = request.headers.get('cf-connecting-ip') ?? 'localhost';
	const checkAddUserRateLimiter = new RateLimit({
		namespace: env.RLIMIT_NAMESPACE,
		maximum: 10,
		interval: '1m',
	});
	const limit = await checkAddUserRateLimiter.check(
		createRateLimitKey({
			ip: ipAddress,
			function: 'add-user',
		})
	);
	return limit.ok;
};
