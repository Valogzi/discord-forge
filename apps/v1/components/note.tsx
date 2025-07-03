import { cn } from '@/lib/utils';
import clsx from 'clsx';
import {
	Check,
	Info,
	NotepadTextIcon,
	OctagonAlert,
	TriangleAlert,
} from 'lucide-react';
import { PropsWithChildren } from 'react';

type NoteProps = PropsWithChildren & {
	title?: string;
	type?: 'note' | 'danger' | 'warning' | 'success' | 'info';
};

export default function Note({
	children,
	title = 'Note',
	type = 'note',
}: NoteProps) {
	const noteClassNames = clsx({
		'dark:bg-neutral-900 bg-neutral-100': type == 'note',
		'dark:bg-red-950 bg-red-100 border-red-200 dark:border-red-900':
			type === 'danger',
		'dark:bg-orange-950 bg-orange-100 border-orange-200 dark:border-orange-900':
			type === 'warning',
		'dark:bg-green-950 bg-green-100 border-green-200 dark:border-green-900':
			type === 'success',
		'dark:bg-blue-950 bg-blue-100 border-blue-200 dark:border-blue-900':
			type === 'info',
	});

	return (
		<div
			className={cn(
				'flex border rounded-md py-0.5 px-3.5 text-sm tracking-wide',
				noteClassNames,
			)}
		>
			<div className="flex items-center mr-2">
				{type === 'note' ? (
					<NotepadTextIcon className="inline mr-1.5 text-neutral-500 dark:text-neutral-400" />
				) : type === 'danger' ? (
					<OctagonAlert className="inline mr-1.5 text-red-500 dark:text-red-400" />
				) : type === 'warning' ? (
					<TriangleAlert className="inline mr-1.5 text-orange-500 dark:text-orange-400" />
				) : type === 'success' ? (
					<Check className="inline mr-1.5 text-green-500 dark:text-green-400" />
				) : type === 'info' ? (
					<Info className="inline mr-1.5 text-blue-500 dark:text-blue-400" />
				) : null}
			</div>
			<div className="flex flex-col">
				<p className="font-semibold -mb-3">{title}:</p> {children}
			</div>
		</div>
	);
}
