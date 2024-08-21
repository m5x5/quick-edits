import type React from "react";
import { useEffect } from "react";
import InspectPopupClassListInput from "./InspectPopupClassListInput";
import {
	isUtilityClassForLargerBreakpoint,
	tailwindCSSUtilityMappings,
} from "./utils";

const getUtilityClassesForGroup = (group: string) => {
	const utilityClasses = [];

	for (let i = 0; i < document.styleSheets.length; i++) {
		const styleSheet = document.styleSheets[i] as CSSStyleSheet;

		for (let j = 0; j < styleSheet.cssRules.length; j++) {
			const cssRule = styleSheet.cssRules[j] as CSSStyleRule;

			if (cssRule.selectorText?.startsWith(`.${group}`)) {
				utilityClasses.push(cssRule.selectorText.replace(".", ""));
			}
		}
	}

	return utilityClasses;
};

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
	useEffect(() => {
		if (!additionalClasses) return;

		target.classList.remove(...target.classList.values());
		target.classList.add(
			...additionalClasses.split(" ").filter((className) => className),
		);
		target.classList.add(
			...classes.split(" ").filter((className) => className),
		);
	}, [additionalClasses]);

	const addArrowSwitch = (event: any) => {
		const classElement = event.target;

		classElement.addEventListener("keydown", (event: any) => {
			const targetUtilityClass = event.target.textContent;

			if (["ArrowDown", "ArrowUp"].includes(event.key)) {
				event.preventDefault();
				event.stopPropagation();
			}

			const getGroup = () => {
				const groups: string[] = Object.keys(tailwindCSSUtilityMappings);
				return groups.find((group) => targetUtilityClass.startsWith(group));
			};

			const group = getGroup() as keyof typeof tailwindCSSUtilityMappings;

			if (!group) return;

			const groupUtilityClasses = getUtilityClassesForGroup(group);
			console.log(groupUtilityClasses);
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
	return (
		<>
			&nbsp;
			<button
				style={{ color: isGray ? "#AAA" : undefined }}
				type="button"
				className={"focus:outline-none"}
				onFocus={addArrowSwitch}
			>
				{elementClass}
			</button>
		</>
	);
};
