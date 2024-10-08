"use client";

import { IconBrandChrome } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NavigationLinks() {
	return (
		<>
			<nav className="">
				<LinkWithActiveState href="/roadmap">Roadmap</LinkWithActiveState>
				<LinkWithActiveState
					href="/docs"
					className={
						"text-white hover:text-white h-10 items-center justify-center gap-2 rounded-full bg-blue-500 px-8 font-medium text-gray-50 text-sm shadow transition-colors hover:bg-blue-600  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
					}
				>
					Get Started
				</LinkWithActiveState>
			</nav>
		</>
	);
}

function LinkWithActiveState(props: {
	href: string;
	className?: string;
	children: React.ReactNode;
}) {
	const [isActive, setActive] = useState(false);

	useEffect(() => {
		if (location.pathname === props.href) {
			setActive(true);
		} else {
			setActive(false);
		}
	}, [props.href]);

	let className = props.className;

	if (!className) className = "";

	if (isActive) {
		className += " border-b-2 border-b-blue-500";
	} else {
		className += " border-b-2 border-b-transparent hover:border-b-blue-200";
	}

	return (
		<Link
			className={`px-4 py-3 text-gray-900 hover:text-gray-900 ${className}`}
			href={props.href}
		>
			{props.children}
		</Link>
	);
}
