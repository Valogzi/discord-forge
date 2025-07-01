import { buttonVariants } from '@/components/ui/button';
import { page_routes } from '@/lib/routes-config';
import Link from 'next/link';

export default function Home() {
	return (
		<div className="flex sm:min-h-[91vh] min-h-[88vh] flex-col items-center justify-center text-center px-2 py-8">
			<h1 className="text-5xl font-bold mb-4 sm:text-7xl">
				Discord <span className="text-primary">Forge</span> Doc
			</h1>
			<h1 className="text-3xl font-bold mb-4 sm:text-5xl">
				An advenced CLI tool
			</h1>
			<p className="mb-8 sm:text-md max-w-[800px] text-muted-foreground">
				Discord Forge is a powerful CLI tool designed to streamline the process
				of creating and managing Discord bots. With its advanced features and
				user-friendly interface, it simplifies bot development, enabling
				developers to focus on building engaging experiences for their
				communities.
			</p>
			<div>
				<Link
					href={`/docs${page_routes[0].href}`}
					className={buttonVariants({
						className: 'px-6 !font-medium',
						size: 'lg',
					})}
				>
					Get Stared
				</Link>
			</div>
		</div>
	);
}
