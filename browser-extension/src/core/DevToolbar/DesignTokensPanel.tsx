import React, { useCallback, useEffect, useRef, useState } from "react";
import {
	type ColorMatch,
	type ColorToken,
	type DesignTokens,
	type TextStyleMatch,
	type TextStyleToken,
	findClosestColor,
	findClosestTextStyle,
	loadDesignTokens,
	saveDesignTokens,
} from "./tokens";

interface ElementStyles {
	color: string;
	backgroundColor: string;
	borderColor: string;
	fontFamily: string;
	fontSize: string;
	fontWeight: string;
	lineHeight: string;
	tagName: string;
	textContent: string;
}

function getElementStyles(el: HTMLElement): ElementStyles {
	const cs = window.getComputedStyle(el);
	return {
		color: cs.color,
		backgroundColor: cs.backgroundColor,
		borderColor: cs.borderTopColor,
		fontFamily: cs.fontFamily,
		fontSize: cs.fontSize,
		fontWeight: cs.fontWeight,
		lineHeight: cs.lineHeight,
		tagName: el.tagName.toLowerCase(),
		textContent: el.textContent?.trim().slice(0, 40) || "",
	};
}

function DeviationBadge({
	label,
	actual,
	expected,
	unit,
}: {
	label: string;
	actual: string | number;
	expected: string | number;
	unit?: string;
}) {
	const diff =
		typeof actual === "number" && typeof expected === "number"
			? actual - expected
			: null;
	return (
		<div className="flex items-center gap-2 text-[11px]">
			<span className="text-[#71717a] w-20 shrink-0">{label}</span>
			<span className="text-[#ef4444] line-through tabular-nums">
				{actual}
				{unit}
			</span>
			<span className="text-[#a1a1aa]">&rarr;</span>
			<span className="text-[#22c55e] tabular-nums">
				{expected}
				{unit}
			</span>
			{diff !== null && diff !== 0 && (
				<span className="text-[#71717a] tabular-nums">
					({diff > 0 ? "+" : ""}
					{Math.round(diff * 100) / 100}
					{unit})
				</span>
			)}
		</div>
	);
}

function ColorMatchRow({
	label,
	cssColor,
	match,
	allTokens,
	onSelectToken,
}: {
	label: string;
	cssColor: string;
	match: ColorMatch | null;
	allTokens: ColorToken[];
	onSelectToken: (token: ColorToken) => void;
}) {
	const [showPicker, setShowPicker] = useState(false);

	if (!match) return null;

	// Don't show transparent/fully transparent
	if (cssColor.includes("rgba") && cssColor.endsWith(", 0)")) return null;
	if (cssColor === "rgba(0, 0, 0, 0)") return null;

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div
						className="w-4 h-4 rounded border border-[#3f3f46]"
						style={{ backgroundColor: cssColor }}
					/>
					<span className="text-xs text-[#a1a1aa]">{label}</span>
				</div>
				{match.exact ? (
					<span className="text-[10px] text-[#22c55e] font-medium px-1.5 py-0.5 rounded bg-[#22c55e]/10">
						{match.token.name}
					</span>
				) : (
					<button
						type="button"
						onClick={() => setShowPicker(!showPicker)}
						className="text-[10px] text-[#f59e0b] font-medium px-1.5 py-0.5 rounded bg-[#f59e0b]/10 border-0 cursor-pointer hover:bg-[#f59e0b]/20 transition-colors"
					>
						~{match.token.name} (
						{Math.round(match.distance)}
						)
					</button>
				)}
			</div>

			{!match.exact && (
				<div className="flex items-center gap-2 text-[11px] pl-6">
					<div
						className="w-3 h-3 rounded border border-[#3f3f46]"
						style={{ backgroundColor: cssColor }}
					/>
					<span className="text-[#ef4444] font-mono">
						{cssColor}
					</span>
					<span className="text-[#a1a1aa]">&rarr;</span>
					<div
						className="w-3 h-3 rounded border border-[#3f3f46]"
						style={{ backgroundColor: match.token.hex }}
					/>
					<span className="text-[#22c55e] font-mono">
						{match.token.hex}
					</span>
				</div>
			)}

			{showPicker && (
				<div className="pl-6 flex flex-wrap gap-1 py-1">
					{allTokens.map((t) => (
						<button
							key={t.hex}
							type="button"
							onClick={() => {
								onSelectToken(t);
								setShowPicker(false);
							}}
							className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[#27272a] border border-[#3f3f46] cursor-pointer hover:border-[#52525b] transition-colors"
							title={`${t.name} (${t.hex})`}
						>
							<div
								className="w-3 h-3 rounded-sm border border-[#52525b]"
								style={{ backgroundColor: t.hex }}
							/>
							<span className="text-[#a1a1aa] max-w-[100px] truncate">
								{t.name}
							</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}

function TextStyleMatchRow({
	match,
	allTokens,
	onSelectToken,
}: {
	match: TextStyleMatch | null;
	allTokens: TextStyleToken[];
	onSelectToken: (token: TextStyleToken) => void;
}) {
	const [showPicker, setShowPicker] = useState(false);

	if (!match) return null;

	const devs = match.deviations;
	const hasDeviations = Object.keys(devs).length > 0;

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between">
				<span className="text-xs text-[#a1a1aa]">Text Style</span>
				{match.exact ? (
					<span className="text-[10px] text-[#22c55e] font-medium px-1.5 py-0.5 rounded bg-[#22c55e]/10">
						{match.token.name}
					</span>
				) : (
					<button
						type="button"
						onClick={() => setShowPicker(!showPicker)}
						className="text-[10px] text-[#f59e0b] font-medium px-1.5 py-0.5 rounded bg-[#f59e0b]/10 border-0 cursor-pointer hover:bg-[#f59e0b]/20 transition-colors"
					>
						~{match.token.name}
					</button>
				)}
			</div>

			{hasDeviations && (
				<div className="pl-2 flex flex-col gap-0.5">
					{devs.fontSize && (
						<DeviationBadge
							label="font-size"
							actual={devs.fontSize.actual}
							expected={devs.fontSize.expected}
							unit="px"
						/>
					)}
					{devs.fontWeight && (
						<DeviationBadge
							label="font-weight"
							actual={devs.fontWeight.actual}
							expected={devs.fontWeight.expected}
						/>
					)}
					{devs.lineHeight && (
						<DeviationBadge
							label="line-height"
							actual={devs.lineHeight.actual}
							expected={devs.lineHeight.expected}
						/>
					)}
					{devs.fontFamily && (
						<DeviationBadge
							label="font-family"
							actual={devs.fontFamily.actual}
							expected={devs.fontFamily.expected}
						/>
					)}
				</div>
			)}

			{showPicker && (
				<div className="flex flex-col gap-0.5 py-1 max-h-[200px] overflow-y-auto">
					{allTokens.map((t) => (
						<button
							key={t.name}
							type="button"
							onClick={() => {
								onSelectToken(t);
								setShowPicker(false);
							}}
							className="flex items-center justify-between px-2 py-1 rounded text-[10px] bg-[#27272a] border border-[#3f3f46] cursor-pointer hover:border-[#52525b] transition-colors text-left"
							title={t.name}
						>
							<span className="text-[#a1a1aa] truncate">
								{t.name}
							</span>
							<span className="text-[#52525b] shrink-0 ml-2 tabular-nums">
								{t.fontSize[0]}px / {t.fontWeight}
							</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}

export default function DesignTokensPanel() {
	const [tokens, setTokens] = useState<DesignTokens | null>(null);
	const [elementStyles, setElementStyles] = useState<ElementStyles | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Load tokens on mount
	useEffect(() => {
		loadDesignTokens().then((t) => {
			setTokens(t);
			setLoading(false);
		});
	}, []);

	// Read the currently selected element on mount (if any)
	useEffect(() => {
		const selector = (window as any).__quickEditsCurrentSelector;
		if (selector) {
			const el = document.querySelector(selector);
			if (el instanceof HTMLElement) {
				setElementStyles(getElementStyles(el));
			}
		}
	}, []);

	// Listen for element selection changes from InspectView
	useEffect(() => {
		const handler = (e: MessageEvent) => {
			if (e.data?.type === "quick-edits:target-changed") {
				if (e.data.selector) {
					const el = document.querySelector(e.data.selector);
					if (el instanceof HTMLElement) {
						setElementStyles(getElementStyles(el));
					}
				} else {
					setElementStyles(null);
				}
			}
		};
		window.addEventListener("message", handler);
		return () => window.removeEventListener("message", handler);
	}, []);

	const parseAndSaveTokens = useCallback(async (jsonString: string) => {
		try {
			const data = JSON.parse(jsonString);
			const parsed: DesignTokens = {
				colors: (data.colors || []).map((c: any) => ({
					name: c.name,
					hex: c.hex,
					rgba: c.rgba,
				})),
				textStyles: (data.textStyles || []).map((t: any) => ({
					name: t.name,
					fontFamily: t.fontFamily,
					fontSize: t.fontSize,
					fontWeight: t.fontWeight,
					fontStyle: t.fontStyle,
					lineHeight: t.lineHeight,
				})),
			};
			await saveDesignTokens(parsed);
			setTokens(parsed);
			return true;
		} catch {
			return false;
		}
	}, []);

	const handleImportTokens = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = () => {
				parseAndSaveTokens(reader.result as string);
			};
			reader.readAsText(file);
			if (fileInputRef.current) fileInputRef.current.value = "";
		},
		[parseAndSaveTokens],
	);

	const handlePasteTokens = useCallback(async () => {
		try {
			const text = await navigator.clipboard.readText();
			await parseAndSaveTokens(text);
		} catch {
			// Clipboard API denied or invalid content
		}
	}, [parseAndSaveTokens]);

	const handleClearTokens = useCallback(async () => {
		if (typeof chrome !== "undefined" && chrome.storage?.local) {
			await chrome.storage.local.remove("designTokens");
		}
		setTokens(null);
	}, []);

	// Compute matches
	const colorMatch = elementStyles && tokens
		? findClosestColor(elementStyles.color, tokens.colors)
		: null;
	const bgMatch = elementStyles && tokens
		? findClosestColor(elementStyles.backgroundColor, tokens.colors)
		: null;
	const borderMatch = elementStyles && tokens
		? findClosestColor(elementStyles.borderColor, tokens.colors)
		: null;
	const textMatch = elementStyles && tokens
		? findClosestTextStyle(
				{
					fontFamily: elementStyles.fontFamily,
					fontSize: elementStyles.fontSize,
					fontWeight: elementStyles.fontWeight,
					lineHeight: elementStyles.lineHeight,
				},
				tokens.textStyles,
			)
		: null;

	if (loading) return null;

	// No tokens loaded — show import UI
	if (!tokens) {
		return (
			<div className="p-4 flex flex-col gap-3">
				<div className="text-sm font-semibold text-white">
					Design Tokens
				</div>
				<p className="text-xs text-[#71717a] leading-relaxed m-0">
					Import your design tokens JSON to compare inspected
					elements against your design system.
				</p>
				<div className="flex gap-2">
					<label className="flex-1 cursor-pointer">
						<input
							ref={fileInputRef}
							type="file"
							accept=".json"
							onChange={handleImportTokens}
							className="hidden"
						/>
						<span className="flex items-center justify-center text-xs font-medium py-2 px-3 bg-white text-[#09090b] rounded-lg cursor-pointer hover:bg-[#e4e4e7] transition-colors">
							Upload File
						</span>
					</label>
					<button
						type="button"
						onClick={handlePasteTokens}
						className="flex-1 flex items-center justify-center text-xs font-medium py-2 px-3 bg-transparent border border-[#27272a] text-[#a1a1aa] rounded-lg cursor-pointer hover:bg-[#27272a] hover:text-white transition-colors"
					>
						Paste JSON
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]">
				<div className="flex items-center gap-2">
					<span className="text-sm font-semibold text-white">
						Tokens
					</span>
					<span className="text-[10px] text-[#52525b]">
						{tokens.colors.length}c / {tokens.textStyles.length}
						t
					</span>
				</div>
				<div className="flex items-center gap-1">
					<label className="cursor-pointer">
						<input
							ref={fileInputRef}
							type="file"
							accept=".json"
							onChange={handleImportTokens}
							className="hidden"
						/>
						<span
							className="flex items-center justify-center w-7 h-7 rounded-md bg-transparent border-0 cursor-pointer text-[#71717a] hover:text-white hover:bg-[#27272a] transition-colors"
							title="Re-import tokens"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 14 14"
								fill="none"
							>
								<path
									d="M7 1v4l2-2M7 5L5 3M1 7a6 6 0 1 0 .87-3"
									stroke="currentColor"
									strokeWidth="1.2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</span>
					</label>
					<button
						type="button"
						onClick={handleClearTokens}
						className="flex items-center justify-center w-7 h-7 rounded-md bg-transparent border-0 cursor-pointer text-[#71717a] hover:text-[#ef4444] hover:bg-[#27272a] transition-colors"
						title="Remove tokens"
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 14 14"
							fill="none"
						>
							<path
								d="M3 4h8l-.5 8H3.5L3 4zm2-2h4m-6 2h8"
								stroke="currentColor"
								strokeWidth="1.2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</button>
				</div>
			</div>

			{/* Body */}
			<div className="p-4 flex flex-col gap-3">
				{!elementStyles ? (
					<p className="text-xs text-[#52525b] m-0">
						Select an element to compare against tokens.
					</p>
				) : (
					<>
						{/* Element info */}
						<div className="flex items-center gap-2 pb-2 border-b border-[#27272a]">
							<span className="text-xs font-mono text-[#818cf8]">
								{"<"}
								{elementStyles.tagName}
								{">"}
							</span>
							{elementStyles.textContent && (
								<span className="text-[11px] text-[#52525b] truncate max-w-[180px]">
									{elementStyles.textContent}
								</span>
							)}
						</div>

						{/* Color matches */}
						<ColorMatchRow
							label="color"
							cssColor={elementStyles.color}
							match={colorMatch}
							allTokens={tokens.colors}
							onSelectToken={() => {
								// TODO: apply token color
							}}
						/>
						<ColorMatchRow
							label="background"
							cssColor={elementStyles.backgroundColor}
							match={bgMatch}
							allTokens={tokens.colors}
							onSelectToken={() => {
								// TODO: apply token color
							}}
						/>
						<ColorMatchRow
							label="border"
							cssColor={elementStyles.borderColor}
							match={borderMatch}
							allTokens={tokens.colors}
							onSelectToken={() => {
								// TODO: apply token color
							}}
						/>

						{/* Text style match */}
						<div className="border-t border-[#27272a] pt-3">
							<TextStyleMatchRow
								match={textMatch}
								allTokens={tokens.textStyles}
								onSelectToken={() => {
									// TODO: apply token text style
								}}
							/>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
