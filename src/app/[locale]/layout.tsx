import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import Providers from '../providers';
import { NextIntlClientProvider, useMessages } from 'next-intl';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Bird stats',
	description: 'Have a tea break with some bird stats.',
	metadataBase: new URL('http://localhost:3000'),
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const messages = useMessages();

	return (
		<html>
			<body className={inter.className}>
				<NextIntlClientProvider messages={messages}>
					<Providers>{children}</Providers>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
