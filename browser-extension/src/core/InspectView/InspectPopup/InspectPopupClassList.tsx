import { useEffect, useRef, useState } from "react";
//import InspectPopupClassListInput from "./InspectPopupClassListInput";
import "./../../../popup.css";
import {
	getCssSelectorShort,
	isUtilityClassForLargerBreakpoint,
	tailwindCSSUtilityMappings,
} from "./utils";
import InspectPopupClassListInput from "./InspectPopupClassListInput";

type ClassChange = {
	type: 'regular' | 'additional';
	old: string;
	new: string;
};

const getSizeVariants = (className: string) => {
	const prefix = className.split("-")[0];
	return tailwindCSSUtilityMappings[prefix] || [];
};

const formatClassName = (className: string) => {
	const parts = className.split('-');
	if (parts.length > 1 && ['p', 'pt', 'pb', 'pl', 'pr', 'px', 'py', 'tracking', 'font', 'text'].includes(parts[0])) {
		return parts.slice(1).join('-');
	}
	return className;
};

const internalClassList = new Map<string, string>();

export default function InspectPopupClassList({
	target,
	classes = "",
	setClasses,
	setAdditionalClasses,
	additionalClasses = "",
	setShowSelectBox,
}: {
	target: HTMLElement | SVGElement;
	classes: string;
	setClasses: (classNames: string) => void;
	setAdditionalClasses: (classNames: string) => void;
	additionalClasses: string;
	setShowSelectBox: (show: boolean) => void;
}) {
	console.log({classes});
	const prevTargetRef = useRef<HTMLElement | SVGElement | null>(null);
	const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
	const [undoStack, setUndoStack] = useState<ClassChange[]>([]);
	const popupRef = useRef<HTMLDivElement>(null);

	// Add a new effect to handle popup repositioning
	useEffect(() => {
		const updatePopupPosition = () => {
			const event = new CustomEvent('updatePopupPosition');
			document.dispatchEvent(event);
		};

		// Update position whenever classes change
		updatePopupPosition();
	}, [classes, additionalClasses]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (activeDropdown && !(event.target as Element).closest('.cursor-pointer')) {
				setActiveDropdown(null);
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key === 'z' && !event.shiftKey) {
				event.preventDefault();
				if (undoStack.length > 0) {
					const lastChange = undoStack[undoStack.length - 1];
					if (lastChange.type === 'regular') {
						setClasses(lastChange.old);
					} else {
						setAdditionalClasses(lastChange.old);
					}
					target.classList.remove(...lastChange.new.split(' '));
					target.classList.add(...lastChange.old.split(' '));
					setUndoStack(prev => prev.slice(0, -1));
					setShowSelectBox(false);
					setTimeout(() => setShowSelectBox(true), 1000);
				}
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [activeDropdown, undoStack, target, setClasses, setAdditionalClasses, setShowSelectBox]);

	internalClassList.set(
		getCssSelectorShort(target),
		Array.from(target.classList).join(" "),
	);

	useEffect(() => {
		if (target !== prevTargetRef.current) {
			setAdditionalClasses("");
			prevTargetRef.current = target;
			return;
		}

		if (!additionalClasses) return;

		const internalClasses = internalClassList.get(getCssSelectorShort(target));

		target.classList.remove(...target.classList.values());

		target.classList.add(
			...additionalClasses.split(" ").filter((className) => className),
		);
		target.classList.add(
			...(classes || "").split(" ").filter((className) => className),
		);
	}, [additionalClasses, target, classes]);

	const handleDeleteClass = (classToDelete: string) => {
		const oldClasses = classes || "";
		const updatedClasses = oldClasses
			.split(" ")
			.filter(c => c !== classToDelete)
			.join(" ");
		setClasses(updatedClasses);
		target.classList.remove(classToDelete);
		setUndoStack(prev => [...prev, { type: 'regular', old: oldClasses, new: updatedClasses }]);
		// Ensure visual update with a single toggle
		setShowSelectBox(false);
		setTimeout(() => setShowSelectBox(true), 1000);
	};

	const handleDeleteAdditionalClass = (classToDelete: string) => {
		const oldClasses = additionalClasses || "";
		const updatedClasses = oldClasses
			.split(" ")
			.filter(c => c !== classToDelete)
			.join(" ");
		setAdditionalClasses(updatedClasses);
		target.classList.remove(classToDelete);
		setUndoStack(prev => [...prev, { type: 'additional', old: oldClasses, new: updatedClasses }]);
		// Ensure visual update with a single toggle
		setShowSelectBox(false);
		setTimeout(() => setShowSelectBox(true), 1000);
	};


	return (
		<div ref={popupRef} className="flex flex-col gap-2 relative z-[1000]">
			<div className="flex relative flex-wrap gap-1">
				{(classes || "").split?.(" ").filter(Boolean).map((className) => (
					<ClassItem
						key={className}
						elementClass={className}
						displayClass={formatClassName(className)}
						onDelete={() => handleDeleteClass(className)}
						onVariantSelect={(variant) => {
							const currentClasses = (classes || "").split(" ");
							const updatedClasses = currentClasses
								.map(c => c === className ? variant : c)
								.join(" ");

							target.classList.remove(className);
							target.classList.add(variant);
							setClasses(updatedClasses);
							setUndoStack(prev => [...prev, { type: 'regular', old: classes || "", new: updatedClasses }]);

							// Ensure visual update
							setShowSelectBox(false);
							setTimeout(() => setShowSelectBox(true), 2000);
						}}
						active={activeDropdown === className}
						setActive={(active) => setActiveDropdown(active ? className : null)}
					/>
				))}
			</div>
			<div className="flex relative flex-wrap gap-1">
				{(additionalClasses || "").split(" ").filter(Boolean).map((className) => (
					<ClassItem
						key={className}
						elementClass={className}
						displayClass={formatClassName(className)}
						onDelete={() => handleDeleteAdditionalClass(className)}
						onVariantSelect={(variant) => {
							const currentClasses = (additionalClasses || "").split(" ");
							const updatedClasses = currentClasses
								.map(c => c === className ? variant : c)
								.join(" ");

							target.classList.remove(className);
							target.classList.add(variant);
							setAdditionalClasses(updatedClasses);

							// Ensure visual update
							setShowSelectBox(false);
							requestAnimationFrame(() => setShowSelectBox(true));
						}}
						active={activeDropdown === className}
						setActive={(active) => setActiveDropdown(active ? className : null)}
					/>
				))}
			</div>
			<InspectPopupClassListInput onChangeClasses={setAdditionalClasses} />
		</div>
	);
}

const ClassItem = ({
	elementClass,
	displayClass,
	onDelete,
	onVariantSelect,
	active,
	setActive,
}: {
	elementClass: string;
	displayClass: string;
	onDelete: () => void;
	onVariantSelect?: (variant: string) => void;
	active: boolean;
	setActive: (active: boolean) => void;
}) => {
	console.log(elementClass);
	return (
		<div className="flex items-center gap-1 bg-white dark:bg-[#202124] text-gray-500 dark:text-[#9ba0a5] px-2 py-1 rounded-sm text-[13px] font-mono relative group hover:bg-gray-100 dark:hover:bg-[#292a2d] border border-gray-200 dark:border-[#3c4043]">
			<button
				className="cursor-pointer relative hover:text-[#e8eaed] transition-colors focus-visible:outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:rounded-sm"
				tabIndex={0}
				onClick={(e) => {
					e.stopPropagation();
					setActive(!active);
				}}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						e.stopPropagation();
						setActive(!active);
					}
				}}
			>
				{elementClass}
				{onVariantSelect && getSizeVariants(elementClass).length > 0 && (
					<div
						className={`absolute ${active ? 'block' : 'hidden'} top-full left-0 mt-1 bg-white dark:bg-[#202124] border border-gray-200 dark:border-[#3c4043] rounded-sm py-1 max-h-48 overflow-y-auto min-w-[140px] shadow-lg z-50`}
					>
						{getSizeVariants(elementClass).map((variant) => (
							<button
								key={variant}
								className="block w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-[#292a2d] text-gray-500 dark:text-[#9ba0a5] hover:text-gray-700 dark:hover:text-[#e8eaed] transition-colors font-mono text-[13px]"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									onVariantSelect(variant);
									setActive(false);
								}}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === '') {
										e.preventDefault();
										e.stopPropagation();
										onVariantSelect(variant);
										setActive(false);
									}
								}}
							>
								{formatClassName(variant)}
							</button>
						))}
					</div>
				)}
			</button>
			<button
				onClick={(e) => {
					e.stopPropagation();
					onDelete();
				}}
				className="text-[#9ba0a5] hover:text-[#f28b82] transition-colors relative z-10 opacity-100 group-hover:opacity-100  focus-visible:outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:rounded-sm"
			>
				<svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
					<path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
				</svg>
			</button>
		</div>
	);
};
