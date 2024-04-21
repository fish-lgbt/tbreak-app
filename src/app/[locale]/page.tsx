import { HomePage } from '@/components/home-page';

export const runtime = 'edge';

export default async function Home({ params: { locale } }: { params: { locale: string } }) {
	return (
		<main className="text-xs font-mono p-10">
			<HomePage locale={locale} />
		</main>
	);
}
