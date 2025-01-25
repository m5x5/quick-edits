import { useEffect, useRef, useState } from "react";
import InspectPopupClassListInput from "./InspectPopupClassListInput";
import {
	getCssSelectorShort,
	isUtilityClassForLargerBreakpoint,
	tailwindCSSUtilityMappings,
} from "./utils";
import { twMerge as cn } from "tailwind-merge";

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
			<div className="flex flex-wrap gap-1 relative">
				{(classes || "").split(" ").filter(Boolean).map((className) => (
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
			<div className="flex flex-wrap gap-1 relative">
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
	onDelete,
	onVariantSelect,
	active,
	setActive,
}: {
	elementClass: string;
	onDelete: () => void;
	onVariantSelect?: (variant: string) => void;
	active: boolean;
	setActive: (active: boolean) => void;
}) => {
	return (
		<div className="flex items-center gap-1 bg-[#383a3d] text-[#e8eaed] px-2 py-1 rounded text-xs relative group">
			<button
				className="cursor-pointer relative "
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
						className={`absolute ${active ? 'block' : 'hidden'} top-full left-0 mt-1 bg-[#383a3d] border border-gray-600 rounded-md py-1 max-h-48 overflow-y-auto min-w-[120px] shadow-lg z-50`}
					>
						{getSizeVariants(elementClass).map((variant) => (
							<button
								key={variant}
								className="block w-full text-left px-3 py-1 hover:bg-gray-700 text-[#e8eaed]"
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
				className="hover:text-red-500 transition-colors relative z-10"
			>
				<svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
					<path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
				</svg>
			</button>
		</div>
	);
};
