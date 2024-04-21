import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { locales } from './navigation';

export default async function middleware(request: NextRequest) {
	const handleI18nRouting = createIntlMiddleware({
		locales: locales,
		defaultLocale: 'en',
		localePrefix: 'never',
	});
	const response = handleI18nRouting(request);

	if (response.cookies.get('NEXT_LOCALE')) {
		response.cookies.delete('NEXT_LOCALE');
	}

	return response;
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
