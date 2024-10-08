import { useEffect, useRef, useState } from "react";
import InspectPopupClassListInput from "./InspectPopupClassListInput";
import {
	getCssSelectorShort,
	isUtilityClassForLargerBreakpoint,
	tailwindCSSUtilityMappings,
} from "./utils";
import { twMerge as cn } from "tailwind-merge";

const getUtilityClassesForGroup = (group: string) => {
	const utilityClasses = [];

	for (let i = 0; i < document.styleSheets.length; i++) {
		const styleSheet = document.styleSheets[i] as CSSStyleSheet;

		try {
			for (let j = 0; j < styleSheet.cssRules.length; j++) {
				const cssRule = styleSheet.cssRules[j] as CSSStyleRule;

				if (cssRule.selectorText?.startsWith(`.${group}`)) {
					utilityClasses.push(cssRule.selectorText.replace(".", ""));
				}
			}
		} catch {}
	}

	return utilityClasses;
};

const internalClassList = new Map<string, string>();

export default function InspectPopupClassList({
	target,
	classes = "",
	setClasses,
	setAdditionalClasses,
	additionalClasses,
}: {
	target: HTMLElement | SVGElement;
	classes: string;
	setClasses: (classNames: string) => void;
	setAdditionalClasses: (classNames: string) => void;
	additionalClasses: string;
}) {
	const prevTargetRef = useRef<HTMLElement | SVGElement | null>(null);
	useEffect(() => {
		internalClassList.set(
			getCssSelectorShort(target),
			Array.from(target.classList).join(" "),
		);
	}, [target]);

	useEffect(() => {
		if (target !== prevTargetRef.current) {
			// Target has changed, reset additionalClasses
			setAdditionalClasses("");
			prevTargetRef.current = target;
			// No need to apply previous classes to new element
			return;
		}

		if (!additionalClasses) return;

		const internalClasses = internalClassList.get(getCssSelectorShort(target));

		target.classList.remove(...target.classList.values());

		target.classList.add(
			...additionalClasses.split(" ").filter((className) => className),
		);
		target.classList.add(
			...classes.split(" ").filter((className) => className),
		);
	}, [additionalClasses, target, classes]);

	const addArrowSwitch = (event: React.MouseEvent<HTMLElement>) => {
		const classElement = event.target as HTMLElement;

		classElement.addEventListener("keydown", (event: KeyboardEvent) => {
			event.preventDefault();
			const targetUtilityClass = (event.target as HTMLElement).textContent;

			if (!targetUtilityClass) return;

			if (["ArrowDown", "ArrowUp"].includes(event.key)) {
				event.preventDefault();
				event.stopPropagation();
			}

			const getGroup = () => {
				const groups: string[] = Object.keys(tailwindCSSUtilityMappings);
				return groups.find((group) => targetUtilityClass?.startsWith(group));
			};

			const group = getGroup() as keyof typeof tailwindCSSUtilityMappings;

			if (!group) return;

			const groupUtilityClasses = getUtilityClassesForGroup(group);
			const currentIndex = groupUtilityClasses.indexOf(targetUtilityClass);

			if (event.key === "ArrowDown") {
				const newUtilityClass =
					groupUtilityClasses[currentIndex - 1] || groupUtilityClasses[0];
				target.classList.replace(targetUtilityClass, newUtilityClass);
				setClasses(target.classList.toString());
			}

			if (event.key === "ArrowUp") {
				const newUtilityClass =
					groupUtilityClasses[currentIndex + 1] ||
					groupUtilityClasses[groupUtilityClasses.length - 1];
				target.classList.replace(targetUtilityClass, newUtilityClass);
				setClasses(target.classList.toString());
			}
		});
	};

	return (
		<span className="text-[#2211AA] font-bold pt-[0.25rem]">
			{(classes?.trim?.() || "").split(" ").map((elementClass: string) => {
				const isNotGray = isUtilityClassForLargerBreakpoint(elementClass);

				return (
					<ClassItem
						key={elementClass}
						addArrowSwitch={addArrowSwitch}
						elementClass={elementClass}
						isGray={!isNotGray}
					/>
				);
			})}

			<InspectPopupClassListInput onChangeClasses={setAdditionalClasses} />
		</span>
	);
}

const ClassItem = ({
	addArrowSwitch,
	elementClass,
	isGray,
}: {
	addArrowSwitch: React.FocusEventHandler<HTMLButtonElement>;
	elementClass: string;
	isGray: boolean;
}) => {
	const [active, setActive] = useState(false);
	return (
		<>
			&nbsp;
			<button
				style={{ color: isGray ? "#AAA" : undefined }}
				type="button"
				className={cn("focus:outline-none", active ? "bg-[#f0f0f0]" : "")}
				onFocus={(event: React.FocusEvent<HTMLButtonElement>) => {
					addArrowSwitch(event);
					setActive(true);
				}}
				onBlur={() => setActive(false)}
			>
				{elementClass}
			</button>
		</>
	);
};
