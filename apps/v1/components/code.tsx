import { PropsWithChildren } from 'react';

export default function Code({ children }: PropsWithChildren) {
	return (
		<code className="bg-gray-100 dark:bg-neutral-950 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md text-sm font-mono border border-gray-200 dark:border-neutral-800">
			{children}
		</code>
	);
}
