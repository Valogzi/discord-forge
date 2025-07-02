import Toc from '@/components/toc';
import { page_routes } from '@/lib/routes-config';
import { notFound } from 'next/navigation';
import { getDocsForSlug } from '@/lib/markdown';
import { Typography } from '@/components/typography';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type PageProps = {
	params: { slug: string[] };
};

export default async function DocsPage({ params: { slug = [] } }: PageProps) {
	const pathName = slug.join('/');
	const res = await getDocsForSlug(pathName);

	const resPrevious = res?.frontmatter.previous;
	const resNext = res?.frontmatter.next;

	const previousSource = resPrevious ? resPrevious.split('/')! : ['a'];
	const nextSource = resNext ? resNext.split('/')! : ['a'];

	const previous = previousSource[previousSource.length - 1];
	const next = nextSource[nextSource.length - 1];

	const finalPrevious = previous.split('')[0].toUpperCase() + previous.slice(1);
	const finalNext = next.split('')[0].toUpperCase() + next.slice(1);

	const previousHref = `/docs/${previousSource.join('/')}`;
	const nextHref = `/docs/${nextSource.join('/')}`;

	if (!res) notFound();
	return (
		<div className="flex items-start gap-14">
			<div className="flex-[3] py-10">
				<Typography>
					<h1 className="text-3xl -mt-2">{res.frontmatter.title}</h1>
					<p className="-mt-4 text-muted-foreground text-[16.5px]">
						{res.frontmatter.description}
					</p>
					<div>{res.content}</div>
					<div>
						<div
							data-c="card"
							className="flex justify-between items-center w-full"
						>
							{resPrevious ? (
								<Link
									href={`${previousHref}`}
									className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary no-underline transition-all"
								>
									<div className="p-3">
										<div className="text-sm text-muted-foreground font-semibold ml-7">
											Previous
										</div>
										<span className="flex items-center text-lg">
											<ChevronLeft className="inline mr-1" />
											{finalPrevious}.
										</span>
									</div>
								</Link>
							) : (
								<div></div>
							)}
							{resNext ? (
								<Link
									href={`${nextHref}`}
									className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary no-underline transition-all"
								>
									<div className="p-5">
										<div className="text-sm text-muted-foreground font-semibold">
											Next
										</div>
										<span className="flex items-center text-lg">
											{finalNext}
											<ChevronRight className="inline mr-1" />
										</span>
									</div>
								</Link>
							) : (
								<div></div>
							)}
						</div>
					</div>
				</Typography>
			</div>
			<Toc path={pathName} />
		</div>
	);
}

export async function generateMetadata({ params: { slug = [] } }: PageProps) {
	const pathName = slug.join('/');
	const res = await getDocsForSlug(pathName);
	if (!res) return null;
	const { frontmatter } = res;
	return {
		title: frontmatter.title,
		description: frontmatter.description,
	};
}

export function generateStaticParams() {
	return page_routes.map(item => ({
		slug: item.href.split('/').slice(1),
	}));
}
