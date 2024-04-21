import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const locales = ['de', 'en', 'es', 'fi', 'fr', 'he', 'it', 'sv'] as const;
export const localePrefix = 'never'; // Do not add the locale prefix to the URL

export const { Link, redirect, usePathname, useRouter } = createSharedPathnamesNavigation({ locales, localePrefix });
