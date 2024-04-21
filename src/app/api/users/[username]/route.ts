import type { NextRequest } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { checkAddUserRateLimit, checkRequestRateLimit } from '@/common/rate-limit';
import { getStats } from '@/common/get-stats';
import { cachedFetch } from '@/common/cached-fetch';
import { getProfile } from '@/common/get-profile';

export const runtime = 'edge';

export async function GET(request: NextRequest, context: { params: { username: string } }) {
	const username = context.params.username.toLowerCase();
	const env = getRequestContext().env;

	// Ratelimit this endpoint
	const rateLimitOk = await checkRequestRateLimit(request);
	if (!rateLimitOk) {
		return new Response('Rate limit exceeded', { status: 429 });
	}

	// Get the user stats
	// This will cache the result for 1 hour
	const response = await cachedFetch(`api/users/${username}`, async () => getStats(env, username));

	// Return the user
	return new Response(JSON.stringify(response), {
		headers: {
			'content-type': 'application/json',
		},
	});
}

// If a user is found throw an error otherwise queue a job to fetch the user from twitter
export async function POST(request: NextRequest, context: { params: { username: string } }) {
	const username = context.params.username.toLowerCase();
	const env = getRequestContext().env;

	// Ratelimit this endpoint
	const rateLimitOk = await checkAddUserRateLimit(request);
	if (!rateLimitOk) {
		return new Response('Rate limit exceeded', { status: 429 });
	}

	// Fetch the user from twitter
	const profile = await getProfile(username);
	if (!profile) {
		return new Response('User not found', { status: 404 });
	}

	// Check if the user exists
	const userExists = await env.DATABASE.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<{
		user_id: string;
		avatar: string;
		banner: string;
		bio: string;
		location: string;
		website: string;
		joined_at: string;
	}>();

	// Update the user if they already exist
	if (userExists) {
		console.info('User already exists, updating', [
			profile.avatar ?? userExists.avatar ?? '',
			profile.banner ?? userExists.banner ?? '',
			profile.biography ?? userExists.bio ?? '',
			profile.location ?? userExists.location ?? '',
			profile.website ?? userExists.website ?? '',
			profile.joined ? profile.joined.toISOString() : userExists.joined_at,
			profile.userId,
		]);

		// Update the user
		await env.DATABASE.prepare(
			'UPDATE users SET avatar = ?, banner = ?, bio = ?, location = ?, website = ?, joined_at = ? WHERE user_id = ?'
		)
			.bind(
				profile.avatar ?? userExists.avatar ?? '',
				profile.banner ?? userExists.banner ?? '',
				profile.biography ?? userExists.bio ?? '',
				profile.location ?? userExists.location ?? '',
				profile.website ?? userExists.website ?? '',
				profile.joined ? profile.joined.toISOString() : userExists.joined_at,
				profile.userId
			)
			.run();

		// Clear cache
		await env.CACHE.delete(`api/users/${username}`);

		// Return success
		return new Response('User updated', { status: 200 });
	}

	// Add the user to the database
	console.info('Adding user to the database');
	await env.DATABASE.prepare(
		'INSERT INTO users (user_id, username, avatar, banner, bio, location, website, joined_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
	)
		.bind(
			profile.userId,
			profile.username.toLowerCase(),
			profile.avatar ?? '',
			profile.banner ?? '',
			profile.biography ?? '',
			profile.location ?? '',
			profile.website ?? '',
			profile.joined?.toISOString()
		)
		.run();

	return new Response('User added', { status: 201 });
}
