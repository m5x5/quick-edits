import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InspectPopupClassListInput, { getClassInfo, injectClassCSS } from "./InspectPopupClassListInput";
import {
  getCompletions,
  getCssSelectorShort
} from "./utils";

type ClassChange = {
  type: 'regular' | 'additional';
  old: string;
  new: string;
};

/** Standard Tailwind spacing scale values */
const SPACING_SCALE = [
  '0', 'px', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '14', '16', '20', '24', '28', '32', '36', '40', '44', '48', '52', '56', '60', '64', '72', '80', '96',
];

/** Variant lists keyed by CSS property */
const PROPERTY_VARIANTS: Record<string, { variants: string[]; display: 'slider' | 'dropdown' }> = {
  // Spacing-based (use prefix + scale)
  'padding': { variants: SPACING_SCALE, display: 'slider' },
  'padding-top': { variants: SPACING_SCALE, display: 'slider' },
  'padding-right': { variants: SPACING_SCALE, display: 'slider' },
  'padding-bottom': { variants: SPACING_SCALE, display: 'slider' },
  'padding-left': { variants: SPACING_SCALE, display: 'slider' },
  'padding-inline': { variants: SPACING_SCALE, display: 'slider' },
  'padding-block': { variants: SPACING_SCALE, display: 'slider' },
  'margin': { variants: SPACING_SCALE, display: 'slider' },
  'margin-top': { variants: SPACING_SCALE, display: 'slider' },
  'margin-right': { variants: SPACING_SCALE, display: 'slider' },
  'margin-bottom': { variants: SPACING_SCALE, display: 'slider' },
  'margin-left': { variants: SPACING_SCALE, display: 'slider' },
  'margin-inline': { variants: SPACING_SCALE, display: 'slider' },
  'margin-block': { variants: SPACING_SCALE, display: 'slider' },
  'gap': { variants: SPACING_SCALE, display: 'slider' },
  'column-gap': { variants: SPACING_SCALE, display: 'slider' },
  'row-gap': { variants: SPACING_SCALE, display: 'slider' },
  'width': { variants: SPACING_SCALE, display: 'slider' },
  'height': { variants: SPACING_SCALE, display: 'slider' },
  'min-width': { variants: SPACING_SCALE, display: 'slider' },
  'min-height': { variants: SPACING_SCALE, display: 'slider' },
  'max-width': { variants: SPACING_SCALE, display: 'slider' },
  'max-height': { variants: SPACING_SCALE, display: 'slider' },
  'inset': { variants: SPACING_SCALE, display: 'slider' },
  'top': { variants: SPACING_SCALE, display: 'slider' },
  'right': { variants: SPACING_SCALE, display: 'slider' },
  'bottom': { variants: SPACING_SCALE, display: 'slider' },
  'left': { variants: SPACING_SCALE, display: 'slider' },
  // Named scales
  'font-size': { variants: ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl', 'text-9xl'], display: 'slider' },
  'font-weight': { variants: ['font-thin', 'font-extralight', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black'], display: 'slider' },
  'letter-spacing': { variants: ['tracking-tighter', 'tracking-tight', 'tracking-normal', 'tracking-wide', 'tracking-wider', 'tracking-widest'], display: 'slider' },
  'line-height': { variants: ['leading-none', 'leading-tight', 'leading-snug', 'leading-normal', 'leading-relaxed', 'leading-loose'], display: 'slider' },
  'border-radius': { variants: ['rounded-none', 'rounded-xs', 'rounded-sm', 'rounded', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-3xl', 'rounded-full'], display: 'slider' },
  'border-width': { variants: ['border-0', 'border', 'border-2', 'border-4', 'border-8'], display: 'slider' },
  // Enum properties — dropdown
  'text-align': { variants: ['text-left', 'text-center', 'text-right', 'text-justify', 'text-start', 'text-end'], display: 'dropdown' },
  'text-wrap': { variants: ['text-wrap', 'text-nowrap', 'text-balance', 'text-pretty'], display: 'dropdown' },
  'text-overflow': { variants: ['truncate', 'text-ellipsis', 'text-clip'], display: 'dropdown' },
  'display': { variants: ['block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid', 'hidden'], display: 'dropdown' },
  'position': { variants: ['static', 'fixed', 'absolute', 'relative', 'sticky'], display: 'dropdown' },
  'overflow': { variants: ['overflow-auto', 'overflow-hidden', 'overflow-visible', 'overflow-scroll', 'overflow-clip'], display: 'dropdown' },
};

type VariantInfo = {
  variants: string[];
  display: 'slider' | 'dropdown' | 'none';
};

const getSizeVariants = async (className: string): Promise<VariantInfo> => {
  const prefix = getClassPrefix(className);

  // Compile the class to determine what CSS property it actually sets
  const info = await getClassInfo(className);
  if (!info) return { variants: [], display: 'none' };

  const propertyConfig = PROPERTY_VARIANTS[info.property];
  if (!propertyConfig) {
    // Unknown property — color, custom, etc. No variants
    return { variants: [], display: 'none' };
  }

  // For spacing-scale properties, the variants array is just scale values — prefix them
  if (propertyConfig.display === 'slider' && propertyConfig.variants === SPACING_SCALE) {
    return {
      variants: SPACING_SCALE.map(v => `${prefix}-${v}`),
      display: 'slider',
    };
  }

  // For named scales (font-size, font-weight, etc.) and dropdowns, variants are already full class names
  return {
    variants: propertyConfig.variants,
    display: propertyConfig.display,
  };
};

const formatClassName = (className: string) => {
  const parts = className.split('-');
  if (parts.length > 1 && ['p', 'pt', 'pb', 'pl', 'pr', 'px', 'py', 'tracking', 'font', 'text'].includes(parts[0])) {
    return parts.slice(1).join('-');
  }
  return className;
};

/** Multi-segment prefixes that should be treated as a single prefix */
const MULTI_SEGMENT_PREFIXES = new Set([
  'gap-x', 'gap-y',
  'min-w', 'min-h', 'max-w', 'max-h',
  'space-x', 'space-y',
  'rounded-t', 'rounded-r', 'rounded-b', 'rounded-l',
  'border-t', 'border-r', 'border-b', 'border-l',
]);

const getClassPrefix = (className: string): string => {
  const parts = className.split('-');
  if (parts.length >= 3) {
    const twoPartPrefix = `${parts[0]}-${parts[1]}`;
    if (MULTI_SEGMENT_PREFIXES.has(twoPartPrefix)) return twoPartPrefix;
  }
  return parts[0];
};

/** Collect all classes with the same prefix used across the page */
const getUsedVariantsOnPage = (prefix: string): Set<string> => {
  const used = new Set<string>();
  const allElements = document.querySelectorAll('[class]');
  for (const el of allElements) {
    for (const cls of el.classList) {
      if (cls.startsWith(`${prefix}-`) || cls === prefix) {
        used.add(cls);
      }
    }
  }
  return used;
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
      if (activeDropdown && popupRef.current && !popupRef.current.contains(event.target as Node)) {
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
            target.classList.remove(...target.classList.values());
            target.classList.add(...lastChange.old.split(' ').filter(Boolean));
            if (additionalClasses) {
              target.classList.add(...additionalClasses.split(' ').filter(Boolean));
            }
          } else {
            setAdditionalClasses(lastChange.old);
            target.classList.remove(...target.classList.values());
            if (classes) {
              target.classList.add(...classes.split(' ').filter(Boolean));
            }
            target.classList.add(...lastChange.old.split(' ').filter(Boolean));
          }
          setUndoStack(prev => prev.slice(0, -1));
          setShowSelectBox(false);
          setTimeout(() => setShowSelectBox(true), 1000);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown, true);
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
    // Send message to DevTools panel
    chrome.runtime.sendMessage({
      type: "class_change",
      element: target.tagName.toLowerCase(),
      oldClasses,
      newClasses: updatedClasses
    });
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
    // Send message to DevTools panel
    chrome.runtime.sendMessage({
      type: "class_change",
      element: target.tagName.toLowerCase(),
      oldClasses,
      newClasses: updatedClasses
    });
    // Ensure visual update with a single toggle
    setShowSelectBox(false);
    setTimeout(() => setShowSelectBox(true), 1000);
  };


  return (
    <div ref={popupRef} className="flex flex-col gap-2 relative z-[1000]">
      <div className="flex relative flex-wrap gap-1">
        {(classes || "").split?.(" ").filter(Boolean).map((className, idx) => {
          const dropdownKey = `regular-${idx}`;
          return (
            <ClassItem
              key={dropdownKey}
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

                // Generate CSS for the new class combination
                const allClasses = [...updatedClasses.split(" "), ...(additionalClasses || "").split(" ")].filter(Boolean);
                injectClassCSS(allClasses);

                // Send message to DevTools panel
                chrome.runtime.sendMessage({
                  type: "class_change",
                  element: target.tagName.toLowerCase(),
                  oldClasses: classes || "",
                  newClasses: updatedClasses
                });

                // Ensure visual update
                setShowSelectBox(false);
                setTimeout(() => setShowSelectBox(true), 2000);
              }}
              active={activeDropdown === dropdownKey}
              setActive={(active) => setActiveDropdown(active ? dropdownKey : null)}
            />
          );
        })}
      </div>
      <div className="flex relative flex-wrap gap-1">
        {(additionalClasses || "").split(" ").filter(Boolean).map((className, idx) => {
          const dropdownKey = `additional-${idx}`;
          return (
            <ClassItem
              key={dropdownKey}
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

                // Generate CSS for the new class combination
                const allClasses = [...(classes || "").split(" "), ...updatedClasses.split(" ")].filter(Boolean);
                injectClassCSS(allClasses);

                // Ensure visual update
                setShowSelectBox(false);
                requestAnimationFrame(() => setShowSelectBox(true));
              }}
              active={activeDropdown === dropdownKey}
              setActive={(active) => setActiveDropdown(active ? dropdownKey : null)}
            />
          );
        })}
      </div>
      <InspectPopupClassListInput onChangeClasses={setAdditionalClasses} />
    </div>
  );
}

/** Extract the numeric value and unit from an arbitrary value class like `text-[1.5rem]` */
const parseArbitraryValue = (className: string): { prefix: string; value: number; unit: string } | null => {
  const match = className.match(/^(.+?)-\[([0-9.]+)(rem|px|em|%|vw|vh)?\]$/);
  if (!match) return null;
  return { prefix: match[1], value: parseFloat(match[2]), unit: match[3] || '' };
};

/** Build an arbitrary value class like `pt-[1.5rem]` */
const buildArbitraryClass = (prefix: string, value: number, unit: string) =>
  `${prefix}-[${value}${unit}]`;

const PRECISION_UNITS = ['rem', 'px', 'em', '%', 'vw', 'vh'] as const;
const DECIMAL_OPTIONS = [0, 1, 2] as const;

const VariantSlider = ({
  variants,
  currentClass,
  usedOnPage,
  onSelect,
}: {
  variants: string[];
  currentClass: string;
  usedOnPage: Set<string>;
  onSelect: (variant: string) => void;
}) => {
  const currentIndex = variants.indexOf(currentClass);
  const sliderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [precisionMode, setPrecisionMode] = useState(false);
  const [precisionUnit, setPrecisionUnit] = useState<string>('rem');
  const [precisionDecimals, setPrecisionDecimals] = useState<number>(1);
  const [precisionValue, setPrecisionValue] = useState<number>(0);
  const precisionSliderRef = useRef<HTMLDivElement>(null);
  const [precisionDragging, setPrecisionDragging] = useState(false);

  // Determine sensible range for precision mode based on CSS property
  const precisionRange = useMemo(() => {
    const unit = precisionUnit;
    if (unit === 'px') return { min: 0, max: 200, step: 1 };
    if (unit === '%' || unit === 'vw' || unit === 'vh') return { min: 0, max: 100, step: 1 };
    // rem/em
    return { min: 0, max: 20, step: 0.1 };
  }, [precisionUnit]);

  // Initialize precision value from current class
  useEffect(() => {
    const parsed = parseArbitraryValue(currentClass);
    if (parsed) {
      setPrecisionValue(parsed.value);
      setPrecisionUnit(parsed.unit || 'rem');
    }
  }, [currentClass]);

  // Focus the container on mount so arrow keys work immediately
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const selectByIndex = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(variants.length - 1, idx));
    if (variants[clamped] && variants[clamped] !== currentClass) {
      onSelect(variants[clamped]);
    }
  }, [variants, currentClass, onSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      if (precisionMode) {
        const step = 1 / Math.pow(10, precisionDecimals);
        const newVal = Math.min(precisionRange.max, +(precisionValue + step).toFixed(precisionDecimals));
        setPrecisionValue(newVal);
        const prefix = getClassPrefix(currentClass);
        onSelect(buildArbitraryClass(prefix, newVal, precisionUnit));
      } else {
        selectByIndex(currentIndex + 1);
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      if (precisionMode) {
        const step = 1 / Math.pow(10, precisionDecimals);
        const newVal = Math.max(precisionRange.min, +(precisionValue - step).toFixed(precisionDecimals));
        setPrecisionValue(newVal);
        const prefix = getClassPrefix(currentClass);
        onSelect(buildArbitraryClass(prefix, newVal, precisionUnit));
      } else {
        selectByIndex(currentIndex - 1);
      }
    }
  }, [currentIndex, selectByIndex, precisionMode, precisionValue, precisionDecimals, precisionUnit, precisionRange, currentClass, onSelect]);

  const getIndexFromPointer = useCallback((clientX: number) => {
    const el = sliderRef.current;
    if (!el) return currentIndex;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * (variants.length - 1));
  }, [currentIndex, variants.length]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    selectByIndex(getIndexFromPointer(e.clientX));
  }, [getIndexFromPointer, selectByIndex]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    selectByIndex(getIndexFromPointer(e.clientX));
  }, [dragging, getIndexFromPointer, selectByIndex]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Precision slider handlers
  const getPrecisionValueFromPointer = useCallback((clientX: number) => {
    const el = precisionSliderRef.current;
    if (!el) return precisionValue;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = precisionRange.min + ratio * (precisionRange.max - precisionRange.min);
    return +raw.toFixed(precisionDecimals);
  }, [precisionValue, precisionRange, precisionDecimals]);

  const handlePrecisionPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPrecisionDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const val = getPrecisionValueFromPointer(e.clientX);
    setPrecisionValue(val);
    const prefix = getClassPrefix(currentClass);
    onSelect(buildArbitraryClass(prefix, val, precisionUnit));
  }, [getPrecisionValueFromPointer, currentClass, onSelect, precisionUnit]);

  const handlePrecisionPointerMove = useCallback((e: React.PointerEvent) => {
    if (!precisionDragging) return;
    const val = getPrecisionValueFromPointer(e.clientX);
    setPrecisionValue(val);
    const prefix = getClassPrefix(currentClass);
    onSelect(buildArbitraryClass(prefix, val, precisionUnit));
  }, [precisionDragging, getPrecisionValueFromPointer, currentClass, onSelect, precisionUnit]);

  const handlePrecisionPointerUp = useCallback(() => {
    setPrecisionDragging(false);
  }, []);

  const precisionFillPercent = ((precisionValue - precisionRange.min) / (precisionRange.max - precisionRange.min)) * 100;

  return (
    <div
      ref={containerRef}
      className="mt-1 pt-2 border-t border-gray-100 dark:border-[#3c4043] outline-none"
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {!precisionMode && (
        <>
          {/* Slider track */}
          <div
            ref={sliderRef}
            className="relative h-5 flex items-center cursor-pointer select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Track background */}
            <div className="absolute inset-x-0 h-1 bg-gray-200 dark:bg-[#3c4043] rounded-full" />

            {/* Fill up to current value */}
            {currentIndex >= 0 && (
              <div
                className="absolute h-1 bg-blue-400 rounded-full"
                style={{ width: `${(currentIndex / (variants.length - 1)) * 100}%` }}
              />
            )}

            {/* Tick marks for each variant */}
            {variants.map((variant, i) => {
              const isUsed = usedOnPage.has(variant);
              const isCurrent = variant === currentClass;
              const left = `${(i / (variants.length - 1)) * 100}%`;

              return (
                <div
                  key={variant}
                  className="absolute -translate-x-1/2"
                  style={{ left }}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCurrent
                        ? 'w-3 h-3 bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                        : isUsed
                          ? 'w-2 h-2 bg-amber-400 dark:bg-amber-500'
                          : 'bg-gray-300 dark:bg-[#5f6368]'
                    }`}
                    title={variant}
                  />
                </div>
              );
            })}
          </div>

          {/* Labels row */}
          <div className="flex justify-between mt-1 text-[10px] font-mono text-gray-400 dark:text-[#9ba0a5]">
            <span>{formatClassName(variants[0])}</span>
            <span className="text-[12px] font-semibold text-gray-600 dark:text-[#e8eaed]">
              {formatClassName(currentClass)}
            </span>
            <span>{formatClassName(variants[variants.length - 1])}</span>
          </div>
        </>
      )}

      {precisionMode && (
        <>
          {/* Precision controls row */}
          <div className="flex items-center gap-2 mb-2">
            {/* Decimals selector */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 dark:text-[#9ba0a5]">.</span>
              {DECIMAL_OPTIONS.map(d => (
                <button
                  key={d}
                  type="button"
                  className={`w-5 h-5 text-[10px] font-mono rounded border-0 cursor-pointer transition-colors ${
                    precisionDecimals === d
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-[#3c4043] text-gray-500 dark:text-[#9ba0a5] hover:bg-gray-200 dark:hover:bg-[#4c4d50]'
                  }`}
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setPrecisionDecimals(d); }}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Unit selector */}
            <div className="flex items-center gap-0.5">
              {PRECISION_UNITS.map(u => (
                <button
                  key={u}
                  type="button"
                  className={`px-1 h-5 text-[10px] font-mono rounded border-0 cursor-pointer transition-colors ${
                    precisionUnit === u
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-[#3c4043] text-gray-500 dark:text-[#9ba0a5] hover:bg-gray-200 dark:hover:bg-[#4c4d50]'
                  }`}
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setPrecisionUnit(u); }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Precision slider track */}
          <div
            ref={precisionSliderRef}
            className="relative h-5 flex items-center cursor-pointer select-none"
            onPointerDown={handlePrecisionPointerDown}
            onPointerMove={handlePrecisionPointerMove}
            onPointerUp={handlePrecisionPointerUp}
          >
            <div className="absolute inset-x-0 h-1 bg-gray-200 dark:bg-[#3c4043] rounded-full" />
            <div
              className="absolute h-1 bg-blue-400 rounded-full"
              style={{ width: `${precisionFillPercent}%` }}
            />
            <div
              className="absolute -translate-x-1/2"
              style={{ left: `${precisionFillPercent}%` }}
            >
              <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-800" />
            </div>
          </div>

          {/* Precision labels */}
          <div className="flex justify-between mt-1 text-[10px] font-mono text-gray-400 dark:text-[#9ba0a5]">
            <span>{precisionRange.min}{precisionUnit}</span>
            <span className="text-[12px] font-semibold text-gray-600 dark:text-[#e8eaed]">
              {precisionValue.toFixed(precisionDecimals)}{precisionUnit}
            </span>
            <span>{precisionRange.max}{precisionUnit}</span>
          </div>
        </>
      )}

      {/* Precision toggle */}
      <div className="flex items-center justify-between mt-2">
        <button
          type="button"
          className={`flex items-center gap-1.5 text-[10px] font-mono border-0 cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
            precisionMode
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-[#3c4043] text-gray-500 dark:text-[#9ba0a5] hover:bg-gray-200 dark:hover:bg-[#4c4d50]'
          }`}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setPrecisionMode(!precisionMode);
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 6h10M6 1v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="3" cy="6" r="1" fill="currentColor" />
            <circle cx="9" cy="6" r="1" fill="currentColor" />
          </svg>
          Precision
        </button>

        {/* Used-on-page count badge (when not expanded) */}
        {!precisionMode && Array.from(usedOnPage).length > 1 && (
          <span className="text-[10px] text-amber-500 dark:text-amber-400 font-mono">
            {Array.from(usedOnPage).length} used
          </span>
        )}
      </div>

      {/* Used-on-page legend */}
      {!precisionMode && Array.from(usedOnPage).length > 1 && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-[#3c4043]">
          <div className="text-[10px] text-gray-400 dark:text-[#9ba0a5] mb-1">Used in page</div>
          <div className="flex flex-wrap gap-1">
            {variants.filter(v => usedOnPage.has(v)).map(v => (
              <button
                key={v}
                type="button"
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono border-0 cursor-pointer transition-colors ${
                  v === currentClass
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(v);
                }}
              >
                {formatClassName(v)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { formatClassName };

export const ClassItem = ({
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
  const [variants, setVariants] = useState<string[]>([]);
  const [displayMode, setDisplayMode] = useState<'slider' | 'dropdown' | 'none'>('none');
  const [usedOnPage, setUsedOnPage] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadVariants = async () => {
      if (active && onVariantSelect) {
        setIsLoading(true);
        try {
          const result = await getSizeVariants(elementClass);
          if (mounted) {
            setVariants(result.variants);
            setDisplayMode(result.display);
            if (result.display === 'slider') {
              const prefix = getClassPrefix(elementClass);
              setUsedOnPage(getUsedVariantsOnPage(prefix));
            }
          }
        } catch (error) {
          console.error('Error loading variants:', error);
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
    };

    loadVariants();

    return () => {
      mounted = false;
    };
  }, [elementClass, active, onVariantSelect]);

  const slidable = displayMode === 'slider';

  return (
    <div className={active && slidable ? "flex flex-col w-full" : ""}>
      <div className="flex items-center gap-1 bg-white dark:bg-[#202124] text-gray-500 dark:text-[#9ba0a5] rounded-sm text-[13px] font-mono relative group hover:bg-gray-100 dark:hover:bg-[#292a2d] border border-gray-200 dark:border-[#3c4043]">
        <button
          className="py-1 pl-2 cursor-pointer relative hover:text-gray-500 transition-colors focus-visible:outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:rounded-sm border-0 bg-transparent p-0"
          tabIndex={0}
          onMouseDown={(e) => {
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
          type="button"
        >
          {elementClass}
          {onVariantSelect && active && displayMode === 'dropdown' && (
            <div
              className="absolute block top-full left-0 mt-1 bg-white dark:bg-[#202124] border border-gray-200 dark:border-[#3c4043] rounded-sm py-1 max-h-48 overflow-y-auto min-w-35 shadow-lg z-50"
            >
              {isLoading ? (
                <div className="px-3 py-1.5 text-gray-500 dark:text-[#9ba0a5]">Loading...</div>
              ) : variants.length > 0 ? (
                variants.map((variant) => (
                  <div
                    key={variant}
                    className="block w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-[#292a2d] text-gray-500 dark:text-[#9ba0a5] hover:text-gray-700 dark:hover:text-[#e8eaed] transition-colors font-mono text-[13px] cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onVariantSelect(variant);
                      setActive(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        onVariantSelect(variant);
                        setActive(false);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    {formatClassName(variant)}
                  </div>
                ))
              ) : (
                <div className="px-3 py-1.5 text-gray-500 dark:text-[#9ba0a5]">No variants available</div>
              )}
            </div>
          )}
        </button>

        <button
          onMouseDown={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          type="button"
          className="text-[#9ba0a5] py-1 bg-transparent border-0 hover:text-[#f28b82] transition-colors relative z-10 opacity-100 group-hover:opacity-100  focus-visible:outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:rounded-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
            <title>Delete</title>
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Inline slider for slidable classes */}
      {onVariantSelect && active && slidable && (
        isLoading ? (
          <div className="py-2 text-[12px] text-gray-500 dark:text-[#9ba0a5]">Loading...</div>
        ) : variants.length > 0 ? (
          <VariantSlider
            variants={variants}
            currentClass={elementClass}
            usedOnPage={usedOnPage}
            onSelect={(variant) => onVariantSelect(variant)}
          />
        ) : null
      )}
    </div>
  );
};
