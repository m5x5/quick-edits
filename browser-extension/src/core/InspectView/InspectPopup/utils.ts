export const getCssSelectorShort = (el: HTMLElement) => {
	const path = [];
	let parent: HTMLElement;

	let currentElement = el;

	while (currentElement.parentElement) {
		parent = currentElement.parentElement;
		const tag = currentElement.tagName;
		const siblings = parent.children;
		path.unshift(
			currentElement.id
				? `#${currentElement.id}`
				: [...siblings].filter((sibling) => sibling.tagName === tag).length ===
						1
					? tag
					: `${tag}:nth-child(${1 + [...siblings].indexOf(currentElement)})`,
		);

		currentElement = parent;
	}
	return `${path.join(" > ")}`.toLowerCase();
};

const getCurrentBreakpoint = () => {
	const breakpoints = {
		sm: 768,
		md: 1024,
		lg: 1280,
		xl: 1440,
		"2xl": 1536,
	};

	const width = window.innerWidth;

	if (width >= breakpoints["2xl"]) {
		return "2xl";
	}
	if (width >= breakpoints.xl) {
		return "xl";
	}
	if (width >= breakpoints.lg) {
		return "lg";
	}
	if (width >= breakpoints.md) {
		return "md";
	}
	if (width >= breakpoints.sm) {
		return "sm";
	}
	return "default";
};

export const isUtilityClassForLargerBreakpoint = (utilityClass: string) => {
	const currentBreakpoint = getCurrentBreakpoint();
	const breakpointOrder = ["sm", "md", "lg", "xl", "2xl"];
	const utilityClassBreakpoint = utilityClass.split(":").shift();

	if (!utilityClassBreakpoint) return false;

	if (
		breakpointOrder.indexOf(currentBreakpoint) >=
		breakpointOrder.indexOf(utilityClassBreakpoint)
	) {
		return true;
	}

	return false;
};

export const tailwindCSSUtilityMappings = {
	pt: [
		"pt-1",
		"pt-2",
		"pt-3",
		"pt-4",
		"pt-5",
		"pt-6",
		"pt-7",
		"pt-8",
		"pt-9",
		"pt-10",
	],
	pb: [
		"pb-1",
		"pb-2",
		"pb-3",
		"pb-4",
		"pb-5",
		"pb-6",
		"pb-7",
		"pb-8",
		"pb-9",
		"pb-10",
	],
	pl: [
		"pl-1",
		"pl-2",
		"pl-3",
		"pl-4",
		"pl-5",
		"pl-6",
		"pl-7",
		"pl-8",
		"pl-9",
		"pl-10",
	],
	pr: [
		"pr-1",
		"pr-2",
		"pr-3",
		"pr-4",
		"pr-5",
		"pr-6",
		"pr-7",
		"pr-8",
		"pr-9",
		"pr-10",
	],
	px: [
		"px-1",
		"px-2",
		"px-3",
		"px-4",
		"px-5",
		"px-6",
		"px-7",
		"px-8",
		"px-9",
		"px-10",
	],
	py: [
		"py-1",
		"py-2",
		"py-3",
		"py-4",
		"py-5",
		"py-6",
		"py-7",
		"py-8",
		"py-9",
		"py-10",
	],
	tracking: [
		"tracking-tighter",
		"tracking-tight",
		"tracking-normal",
		"tracking-wide",
		"tracking-wider",
		"tracking-widest",
	],
	font: [
		"font-thin",
		"font-extralight",
		"font-light",
		"font-normal",
		"font-medium",
		"font-semibold",
		"font-bold",
		"font-extrabold",
		"font-black",
	],
	text: [
		"text-xs",
		"text-sm",
		"text-base",
		"text-lg",
		"text-xl",
		"text-2xl",
		"text-3xl",
		"text-4xl",
		"text-5xl",
		"text-6xl",
	],
};
