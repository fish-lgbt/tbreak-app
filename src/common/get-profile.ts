import { scraper } from '@/scraper';
import { expandUrl } from './expand-url';

type Profile = Awaited<ReturnType<typeof scraper.getProfile>> & { username: string };

const getAllLinks = (text: string) => {
	const urls = text.matchAll(/(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/g) ?? [];
	return Array.from(urls).map(([url]) => url);
};

export const getProfile = async (username: string): Promise<Profile | null> => {
	console.info(`Fetching profile for ${username}`);

	// Fetch the user from twitter
	const profile = await scraper.getProfile(username);
	if (!profile || !profile.username) {
		console.error(`Failed to fetch profile for ${username}`);
		return null;
	}

	console.info(`Fetched profile for ${username}`);

	// Get all of the URLs in the bio
	const urls = profile.biography ? getAllLinks(profile.biography) : [];

	console.info(`Found ${urls.length} URLs in the bio`, urls);

	// Expand all of the URLs in the profile
	const expandedUrls = await Promise.all(
		urls.map(async (word) => {
			try {
				const url = new URL(word);
				return await expandUrl(url.href);
			} catch (error) {
				return word;
			}
		}) ?? []
	);

	// Replace the URLs in the bio with the expanded URLs
	const biography = profile.biography ? expandedUrls.reduce((acc, url, index) => acc.replaceAll(urls[index]!, url), profile.biography) : '';

	return {
		...profile,
		biography,
		username,
	};
};
