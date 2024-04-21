import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { locales } from './navigation';
import deepmerge from 'deepmerge';
import en from '../messages/en.json';

export default getRequestConfig(async ({ locale }) => {
	// Validate that the incoming `locale` parameter is valid
	if (!locales.includes(locale as any)) {
		notFound();
	}

	const localeMessages = (await import(`../messages/${locale}.json`)).default;
	const messages = deepmerge(en, localeMessages);

	return {
		messages,
	};
});
