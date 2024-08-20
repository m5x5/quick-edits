import type React from "react";

export default function Section({
	children,
	className,
}: { children: React.ReactNode | React.ReactNode[]; className?: string }) {
	return (
		<div
			className={`bg-blue-50 dark:bg-[#3c3c3c] text-xs text-blue-700 dark:text-white border-y border-y-blue-200 dark:border-y-[#474747] py-1 px-3 ${className}`}
		>
			{children}
		</div>
	);
}

export function SectionBody({
	children,
	className,
}: { children: React.ReactNode | React.ReactNode[]; className?: string }) {
	return (
		<div className={`${className} py-2 px-3 text-blue-700 flex flex-col gap-4`}>
			{children}
		</div>
	);
}

export function SectionAction({
	icon,
	children,
	onClick,
}: {
	icon: React.ReactNode;
	children: React.ReactNode | React.ReactNode[];
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			className={
				"dark:bg-[#3c3c3c] text-xs dark:text-white border-y border-y-blue-200 dark:border-y-[#474747] py-1 px-3 bg-white border-t-0 text-gray-700 w-full"
			}
			onMouseDown={onClick}
		>
			<div className={"flex gap-1.5 items-center cursor-default"}>
				{icon}
				{children}
			</div>
		</button>
	);
}
