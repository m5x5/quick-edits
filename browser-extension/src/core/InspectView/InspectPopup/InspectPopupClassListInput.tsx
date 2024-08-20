import React, { useEffect, useState } from "react";
import type { ChangeEventHandler } from "react";
import { useDebounce } from "use-debounce";
import { compile } from "tailwindcss";
// @ts-ignore
import defaultTheme from "tailwindcss/theme.css?inline";

const css = `${defaultTheme} @tailwind base;@tailwind components;@tailwind utilities;`;
const compiled = compile(css);

const parseInput = (input: string) => {
	return compiled.build([...input.split(" ")]);
};

export default function InspectPopupClassListInput({
	onChangeClasses,
}: { onChangeClasses: (classNames: string) => void }) {
	const [input, setInput] = useState("");
	const [debouncedInput] = useDebounce(input, 300);

	/**
	 * Parse the input and update the css
	 * @param debouncedInput
	 */
	const updateCSS = (debouncedInput: string) => {
		let element = document.querySelector(
			"[data-inspect-popup-class-style-list]",
		) as HTMLElement;
		onChangeClasses(debouncedInput);
		const parsed = parseInput(debouncedInput);

		if (!element) {
			element = document.createElement("style");
			element.setAttribute("data-inspect-popup-class-style-list", "");
			document.head.appendChild(element);
		}
		element.innerHTML = parsed;
	};

	useEffect(() => {
		if (debouncedInput) updateCSS(debouncedInput);
	}, [debouncedInput, updateCSS]);

	const setText: ChangeEventHandler<HTMLInputElement> = (e) => {
		const value = e.target.value;
		setInput(value);
	};

	const copy = () => {
		return navigator.clipboard.writeText(debouncedInput);
	};

	return (
		<div className={"flex gap-1 py-1"}>
			<input
				onChange={setText}
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
				}}
				onKeyDown={(e) => e.stopPropagation()}
				className={
					"border rounded-[2px] border-solid border-gray-400 placeholder:font-normal placeholder:text-gray-400 px-1"
				}
				placeholder="Add classes"
			/>
			<button
				onMouseDown={copy}
				type={"button"}
				className={"inline"}
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
				}}
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 20 20"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<path
						d="M4.5 18C4.08333 18 3.72933 17.854 3.438 17.562C3.146 17.2707 3 16.9167 3 16.5V5H4.5V16.5H14V18H4.5ZM7.5 15C7.08333 15 6.72933 14.854 6.438 14.562C6.146 14.2707 6 13.9167 6 13.5V3.5C6 3.08333 6.146 2.72933 6.438 2.438C6.72933 2.146 7.08333 2 7.5 2H15.5C15.9167 2 16.2707 2.146 16.562 2.438C16.854 2.72933 17 3.08333 17 3.5V13.5C17 13.9167 16.854 14.2707 16.562 14.562C16.2707 14.854 15.9167 15 15.5 15H7.5ZM7.5 13.5H15.5V3.5H7.5V13.5Z"
						fill="#474747"
					/>
				</svg>
			</button>
		</div>
	);
}
