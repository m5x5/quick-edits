"use client";
import MobileNavigationLinks from "@/components/navbar/MobileNavigationLinks";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Logo from "../Logo";
import NavigationLinks from "./NavigationLinks";

export default function NavigationBar() {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		if (open) {
			ref.current?.showModal();
		} else {
			ref.current?.close();
		}
	}, [open]);

	const handleClick = () => {
		setOpen(!open);
	};

	const closeDialog = (e: React.MouseEvent<HTMLElement>) => {
		const target = e.target as HTMLElement;
		if (target.tagName === "DIALOG" || target.tagName === "A") {
			setOpen(false);
		}
	};

	return (
		<>
			<header className="fixed top-0 z-20 w-full bg-white shadow">
				<div className={"container"}>
					<div className="flex justify-between items-center px-4 mx-auto">
						<div className="flex gap-5 items-center">
							<Link href="/" aria-label={"Homepage öffnen"}>
								<Logo />
							</Link>
						</div>
						<NavigationLinks />
						<dialog
							ref={ref}
							className="fixed inset-0 z-10 w-full backdrop:cursor-pointer backdrop:opacity-0"
							onClick={closeDialog}
							onClose={() => setOpen(false)}
							onKeyDown={(e) => {
								if (e.key === "Escape") {
									setOpen(false);
								}
							}}
						>
							<div
								className={`flex flex-col w-full top-14 fixed bg-gradient-light inset-0 navigation--mobile ${
									open ? "active" : ""}`}
							>
								<MobileNavigationLinks />
							</div>
						</dialog>

						<button
							type="button"
							className="hidden col-span-2 col-start-10 menu cross"
							aria-label={open ? "Close Menu" : "Open Menu"}
							aria-expanded={open}
							aria-haspopup="true"
							onMouseDown={handleClick}
							onClick={handleClick}
						>
							<label>
								<svg
									viewBox="10 15 70 70"
									xmlns="http://www.w3.org/2000/svg"
									className={open ? "checked" : ""}
								>
									<title>Open Menu</title>
									<path className="line--1" d="M0 70l28-28c2-2 2-2 7-2h64" />
									<path className="line--2" d="M0 50h99" />
									<path className="line--3" d="M0 30l28 28c2 2 2 2 7 2h64" />
								</svg>
							</label>
						</button>
					</div>
				</div>
			</header>
			<div className="mb-14 h-16" />
		</>
	);
}
