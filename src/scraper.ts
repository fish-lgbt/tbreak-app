import { Scraper } from '@the-convocation/twitter-scraper';

// Create a new instance of the scraper
export const scraper = new Scraper({
	fetch: fetch,
});
