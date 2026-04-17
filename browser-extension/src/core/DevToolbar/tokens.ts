// Design token types and matching utilities

export interface ColorToken {
	name: string;
	hex: string;
	rgba: { r: number; g: number; b: number; a: number };
}

export interface TextStyleToken {
	name: string;
	fontFamily: string;
	fontSize: number[];
	fontWeight: number;
	fontStyle: string;
	lineHeight: number[];
}

export interface DesignTokens {
	colors: ColorToken[];
	textStyles: TextStyleToken[];
}

const STORAGE_KEY = "designTokens";

export function loadDesignTokens(): Promise<DesignTokens | null> {
	return new Promise((resolve) => {
		if (typeof chrome !== "undefined" && chrome.storage?.local) {
			chrome.storage.local
				.get([STORAGE_KEY])
				.then((data) => resolve(data[STORAGE_KEY] ?? null))
				.catch(() => resolve(null));
		} else {
			resolve(null);
		}
	});
}

export function saveDesignTokens(tokens: DesignTokens): Promise<void> {
	return new Promise((resolve) => {
		if (typeof chrome !== "undefined" && chrome.storage?.local) {
			chrome.storage.local
				.set({ [STORAGE_KEY]: tokens })
				.then(() => resolve())
				.catch(() => resolve());
		} else {
			resolve();
		}
	});
}

// Parse CSS color string (rgb/rgba) to {r, g, b} in 0-255 range
export function parseCSSColor(
	color: string,
): { r: number; g: number; b: number } | null {
	const rgb = color.match(
		/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/,
	);
	if (rgb) {
		return {
			r: Number.parseInt(rgb[1], 10),
			g: Number.parseInt(rgb[2], 10),
			b: Number.parseInt(rgb[3], 10),
		};
	}
	return null;
}

// Euclidean distance in RGB space
function colorDistance(
	a: { r: number; g: number; b: number },
	b: { r: number; g: number; b: number },
): number {
	return Math.sqrt(
		(a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2,
	);
}

export interface ColorMatch {
	token: ColorToken;
	distance: number;
	exact: boolean;
}

export function findClosestColor(
	cssColor: string,
	tokens: ColorToken[],
): ColorMatch | null {
	const parsed = parseCSSColor(cssColor);
	if (!parsed || tokens.length === 0) return null;

	let best: ColorMatch | null = null;
	for (const token of tokens) {
		const tr = Math.round(token.rgba.r * 255);
		const tg = Math.round(token.rgba.g * 255);
		const tb = Math.round(token.rgba.b * 255);
		const dist = colorDistance(parsed, { r: tr, g: tg, b: tb });
		if (!best || dist < best.distance) {
			best = { token, distance: dist, exact: dist === 0 };
		}
	}
	return best;
}

export interface TextStyleMatch {
	token: TextStyleToken;
	deviations: {
		fontSize?: { actual: number; expected: number };
		fontWeight?: { actual: number; expected: number };
		lineHeight?: { actual: number; expected: number };
		fontFamily?: { actual: string; expected: string };
	};
	score: number; // lower is better
	exact: boolean;
}

export function findClosestTextStyle(
	computed: {
		fontFamily: string;
		fontSize: string;
		fontWeight: string;
		lineHeight: string;
	},
	tokens: TextStyleToken[],
): TextStyleMatch | null {
	if (tokens.length === 0) return null;

	const actualSize = Number.parseFloat(computed.fontSize);
	const actualWeight = Number.parseInt(computed.fontWeight, 10);
	// lineHeight can be "normal" or a px value — normalize to a ratio
	const actualLineHeightPx = Number.parseFloat(computed.lineHeight);
	const actualLineHeightRatio =
		actualSize > 0 ? actualLineHeightPx / actualSize : 0;
	const actualFamily = computed.fontFamily.toLowerCase().replace(/['"]/g, "");

	let best: TextStyleMatch | null = null;

	for (const token of tokens) {
		const expectedSize = token.fontSize[0] ?? 0;
		const expectedWeight = token.fontWeight;
		const expectedLH = token.lineHeight[0] ?? 0;
		const expectedFamily = token.fontFamily.toLowerCase();

		// Score: weighted sum of deviations
		const sizeDiff = Math.abs(actualSize - expectedSize);
		const weightDiff = Math.abs(actualWeight - expectedWeight) / 100;
		const lhDiff = Math.abs(actualLineHeightRatio - expectedLH) * 10;
		const familyMatch = actualFamily.includes(expectedFamily) ? 0 : 5;

		const score = sizeDiff + weightDiff + lhDiff + familyMatch;

		const deviations: TextStyleMatch["deviations"] = {};
		if (sizeDiff > 0)
			deviations.fontSize = {
				actual: actualSize,
				expected: expectedSize,
			};
		if (Math.abs(actualWeight - expectedWeight) > 0)
			deviations.fontWeight = {
				actual: actualWeight,
				expected: expectedWeight,
			};
		if (Math.abs(actualLineHeightRatio - expectedLH) > 0.01)
			deviations.lineHeight = {
				actual: Math.round(actualLineHeightRatio * 100) / 100,
				expected: Math.round(expectedLH * 100) / 100,
			};
		if (!actualFamily.includes(expectedFamily))
			deviations.fontFamily = {
				actual: actualFamily.split(",")[0].trim(),
				expected: token.fontFamily,
			};

		const exact = Object.keys(deviations).length === 0;

		if (!best || score < best.score) {
			best = { token, deviations, score, exact };
		}
	}
	return best;
}
