import type {
  ExtractedColor,
  ExtractedSpacing,
  ExtractedTextStyle,
  ExtractedTokens,
  FigmaColor,
  FigmaFileInfo,
  FigmaFrame,
  FigmaStyleRef,
  FigmaVariable,
  FigmaVariableCollection,
} from "./types";

function figmaColorToHex(c: FigmaColor): string {
  const r = Math.round(c.r * 255);
  const g = Math.round(c.g * 255);
  const b = Math.round(c.b * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

async function apiFetch(path: string, token: string): Promise<Record<string, unknown>> {
  const res = await fetch(path, {
    headers: { "x-figma-token": token },
  });
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("retry-after") || "30", 10);
    throw Object.assign(
      new Error(`Rate limited by Figma API. Retry in ${retryAfter} seconds.`),
      { status: 429, retryAfter }
    );
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw Object.assign(
      new Error(data?.error || `Figma API error (${res.status})`),
      { status: res.status, needsFallback: data?.needsFallback }
    );
  }
  return res.json();
}

export function parseFileKeyFromUrl(url: string): string | null {
  // Handles: figma.com/design/:fileKey/... or figma.com/file/:fileKey/...
  const match = url.match(
    /figma\.com\/(?:design|file)\/([a-zA-Z0-9]+)/
  );
  if (match) return match[1];
  // Also accept raw file key
  if (/^[a-zA-Z0-9]{10,}$/.test(url.trim())) return url.trim();
  return null;
}

export async function fetchFile(
  token: string,
  fileKey: string
): Promise<FigmaFileInfo> {
  const data = await apiFetch(
    `/api/figma/file?fileKey=${encodeURIComponent(fileKey)}`,
    token
  );

  const doc = data.document as { children?: FigmaFrame[] } | undefined;
  const pages = (doc?.children || []).map(
    (page: { id: string; name: string; children?: FigmaFrame[] }) => ({
      id: page.id,
      name: page.name,
      children: (page.children || [])
        .filter(
          (c: FigmaFrame) => c.type === "FRAME" || c.type === "COMPONENT" || c.type === "COMPONENT_SET"
        )
        .map((c: FigmaFrame) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          absoluteBoundingBox: c.absoluteBoundingBox,
        })),
    })
  );

  // Extract file-level styles map (contains named text styles like "Desktop/Headline/XL")
  const styles: Record<string, FigmaStyleRef> = {};
  if (data.styles && typeof data.styles === "object") {
    for (const [id, s] of Object.entries(data.styles)) {
      const style = s as FigmaStyleRef;
      styles[id] = {
        key: style.key,
        name: style.name,
        styleType: style.styleType,
        description: style.description || "",
      };
    }
  }

  // Fetch fill style nodes to build hex→name map for named colors
  let fillStyleColors: Record<string, string> | undefined;
  const fillStyleIds = Object.entries(styles)
    .filter(([, s]) => s.styleType === "FILL")
    .map(([id]) => id);
  if (fillStyleIds.length > 0) {
    try {
      const styleNodes = await fetchSelectedNodes(token, fileKey, fillStyleIds);
      fillStyleColors = {};
      for (const [id, node] of Object.entries(styleNodes)) {
        const fills = node.fills as Array<{ type: string; color?: FigmaColor; visible?: boolean }> | undefined;
        if (fills) {
          for (const fill of fills) {
            if (fill.type === "SOLID" && fill.color && fill.visible !== false) {
              const hex = figmaColorToHex(fill.color);
              const styleName = styles[id]?.name;
              if (styleName) fillStyleColors[hex] = styleName;
            }
          }
        }
      }
    } catch {
      // Fill style fetching is optional
    }
  }

  return {
    name: data.name as string,
    lastModified: data.lastModified as string,
    pages,
    styles,
    fillStyleColors,
  };
}

export type ExtractionResult = {
  tokens: ExtractedTokens;
  rawNodes: Record<string, unknown>[];
};

// Fetch full node trees for specific frame IDs via the /nodes API
export async function fetchSelectedNodes(
  token: string,
  fileKey: string,
  nodeIds: string[]
): Promise<Record<string, Record<string, unknown>>> {
  if (nodeIds.length === 0) return {};
  const data = await apiFetch(
    `/api/figma/styles?fileKey=${encodeURIComponent(fileKey)}&ids=${encodeURIComponent(nodeIds.join(","))}`,
    token
  );
  // data.nodes is keyed by node ID, each has { document: {...}, styles: {...} }
  const result: Record<string, Record<string, unknown>> = {};
  for (const [id, nodeData] of Object.entries(data.nodes || {})) {
    const nd = nodeData as { document?: Record<string, unknown> };
    if (nd.document) result[id] = nd.document;
  }
  return result;
}

export async function fetchVariables(
  token: string,
  fileKey: string,
  selectedFrameIds: string[],
  fileStyles?: Record<string, FigmaStyleRef>,
  fillStyleColors?: Record<string, string>
): Promise<ExtractionResult> {
  // Try the variables API first (requires file_variables:read scope)
  let variablesTokens: ExtractedTokens | null = null;
  try {
    const data = await apiFetch(
      `/api/figma/variables?fileKey=${encodeURIComponent(fileKey)}`,
      token
    );

    const meta = data.meta as { variables?: Record<string, FigmaVariable>; variableCollections?: Record<string, FigmaVariableCollection> } | undefined;
    const variables: Record<string, FigmaVariable> = meta?.variables || {};
    const collections: Record<string, FigmaVariableCollection> =
      meta?.variableCollections || {};

    const colors: ExtractedColor[] = [];
    const spacing: ExtractedSpacing[] = [];
    const radii: ExtractedSpacing[] = [];

    for (const v of Object.values(variables)) {
      const collection = collections[v.variableCollectionId];
      const collectionName = collection?.name || "unknown";
      const defaultModeId = collection?.defaultModeId || Object.keys(v.valuesByMode)[0];
      const value = v.valuesByMode[defaultModeId];

      if (v.resolvedType === "COLOR" && typeof value === "object" && value !== null && "r" in value) {
        const c = value as FigmaColor;
        colors.push({
          name: v.name,
          hex: figmaColorToHex(c),
          rgba: { r: c.r, g: c.g, b: c.b, a: c.a },
          collection: collectionName,
        });
      } else if (v.resolvedType === "FLOAT" && typeof value === "number") {
        const nameLower = v.name.toLowerCase();
        if (nameLower.includes("radius") || nameLower.includes("radii") || nameLower.includes("corner")) {
          radii.push({ name: v.name, value });
        } else if (
          nameLower.includes("space") ||
          nameLower.includes("spacing") ||
          nameLower.includes("gap") ||
          nameLower.includes("padding") ||
          nameLower.includes("margin")
        ) {
          spacing.push({ name: v.name, value });
        }
      }
    }

    variablesTokens = { colors, textStyles: [], spacing, radii };
  } catch (err) {
    console.warn("Variables API unavailable, will extract from nodes:", (err as Error).message);
  }

  // Always fetch the selected frame nodes to extract text styles + scoped colors
  const nodes = await fetchSelectedNodes(token, fileKey, selectedFrameIds);
  const rawNodes = Object.values(nodes);
  const nodeTokens = extractTokensFromNodes(rawNodes, fileStyles);

  // Apply fill style names to extracted colors using pre-built hex→name map from fetchFile
  if (fillStyleColors) {
    for (const color of nodeTokens.colors) {
      const styleName = fillStyleColors[color.hex];
      if (styleName && !color.figmaStyleName) {
        color.name = styleName;
        color.figmaStyleName = styleName;
        color.collection = "styles";
      }
    }
  }

  // Merge: use variables API colors if available, otherwise use node-extracted colors
  const tokens: ExtractedTokens = {
    colors: variablesTokens?.colors.length ? variablesTokens.colors : nodeTokens.colors,
    textStyles: nodeTokens.textStyles,
    spacing: variablesTokens?.spacing.length ? variablesTokens.spacing : nodeTokens.spacing,
    radii: variablesTokens?.radii.length ? variablesTokens.radii : nodeTokens.radii,
  };

  return { tokens, rawNodes };
}

// Walk specific node trees to extract colors, text styles, spacing, and radii
// Tracks source Figma node IDs for every token
// When fileStyles is provided, uses Figma's named text styles (e.g. "Desktop/Headline/XL")
// as grouping keys instead of generic fontFamily+fontWeight+fontStyle
function extractTokensFromNodes(
  nodes: Record<string, unknown>[],
  fileStyles?: Record<string, FigmaStyleRef>
): ExtractedTokens {
  const colorMap = new Map<string, ExtractedColor>();
  const textStyleMap = new Map<string, ExtractedTextStyle>();
  const spacingMap = new Map<number, ExtractedSpacing>();
  const radiiMap = new Map<number, ExtractedSpacing>();

  function nodeId(node: Record<string, unknown>): string {
    return (node.id as string) || "";
  }

  function walkNode(node: Record<string, unknown>) {
    const nid = nodeId(node);

    // Extract fills (colors)
    // Look up Figma named fill style (e.g. "Sunshine Burst", "Powerful Purple")
    const nodeStyles = node.styles as Record<string, string> | undefined;
    const fillStyleId = nodeStyles?.fill || nodeStyles?.fills;
    const figmaFillStyleName = fillStyleId && fileStyles?.[fillStyleId]?.name;

    const fills = node.fills as Array<{ type: string; color?: FigmaColor; visible?: boolean }> | undefined;
    if (fills && Array.isArray(fills)) {
      for (const fill of fills) {
        if (fill.type === "SOLID" && fill.color && fill.visible !== false) {
          const hex = figmaColorToHex(fill.color);
          const existing = colorMap.get(hex);
          if (existing) {
            // Upgrade name if we found a Figma style name and the existing one is generic
            if (figmaFillStyleName && !existing.figmaStyleName) {
              existing.name = figmaFillStyleName;
              existing.figmaStyleName = figmaFillStyleName;
            }
            if (nid && !existing.sourceNodeIds?.includes(nid)) {
              existing.sourceNodeIds?.push(nid);
            }
          } else {
            const nodeName = (node.name as string) || "";
            colorMap.set(hex, {
              name: figmaFillStyleName || nodeName || hex,
              figmaStyleName: figmaFillStyleName || undefined,
              hex,
              rgba: { r: fill.color.r, g: fill.color.g, b: fill.color.b, a: fill.color.a },
              collection: figmaFillStyleName ? "styles" : "fills",
              sourceNodeIds: nid ? [nid] : [],
            });
          }
        }
      }
    }

    // Extract text styles — group by Figma style name when available, else fontFamily+weight+style
    if (node.type === "TEXT" && node.style) {
      const s = node.style as Record<string, unknown>;
      const fontFamily = (s.fontFamily as string) || "unknown";
      const fontSize = (s.fontSize as number) || 0;
      const fontWeight = (s.fontWeight as number) || 400;
      const fontStyle = (s.italic as boolean) ? "italic" : "normal";
      const lineHeight = typeof s.lineHeightPx === "number" && fontSize > 0
        ? Math.round((s.lineHeightPx as number / fontSize) * 100) / 100
        : 1.2;
      const letterSpacing = (s.letterSpacing as number) || 0;
      const text = ((node.characters as string) || "").slice(0, 60);

      // Look up Figma named text style (e.g. "Desktop/Headline/XL")
      const textStyleId = nodeStyles?.text;
      const figmaStyleName = textStyleId && fileStyles?.[textStyleId]?.name;

      // Use Figma style name as key when available — this groups by semantic name
      // (e.g. all nodes using "Desktop/Headline/XL" go together regardless of overrides)
      // Fall back to fontFamily-fontWeight-fontStyle grouping
      const key = figmaStyleName || `${fontFamily}-${fontWeight}-${fontStyle}`;
      const existing = textStyleMap.get(key);

      if (existing) {
        if (fontSize > 0 && !existing.fontSize.includes(fontSize)) existing.fontSize.push(fontSize);
        if (lineHeight > 0 && !existing.lineHeight.includes(lineHeight)) existing.lineHeight.push(lineHeight);
        if (letterSpacing !== 0 && !existing.letterSpacing.includes(letterSpacing)) existing.letterSpacing.push(letterSpacing);
        if (nid && !existing.sourceNodeIds.includes(nid)) existing.sourceNodeIds.push(nid);
        if (text && existing.examples.length < 5) existing.examples.push(text);
      } else {
        const weightName = fontWeight <= 300 ? "Light" : fontWeight <= 400 ? "Regular" : fontWeight <= 500 ? "Medium" : fontWeight <= 600 ? "SemiBold" : fontWeight <= 700 ? "Bold" : "ExtraBold";
        const styleSuffix = fontStyle === "italic" ? " Italic" : "";
        textStyleMap.set(key, {
          name: figmaStyleName || `${fontFamily} ${weightName}${styleSuffix}`,
          figmaStyleName: figmaStyleName || undefined,
          fontFamily,
          fontSize: fontSize > 0 ? [fontSize] : [],
          fontWeight,
          fontStyle,
          lineHeight: lineHeight > 0 ? [lineHeight] : [],
          letterSpacing: letterSpacing !== 0 ? [letterSpacing] : [],
          sourceNodeIds: nid ? [nid] : [],
          examples: text ? [text] : [],
        });
      }
    }

    // Extract corner radii
    const cornerRadius = node.cornerRadius as number | undefined;
    if (typeof cornerRadius === "number" && cornerRadius > 0) {
      const existing = radiiMap.get(cornerRadius);
      if (existing) {
        if (nid && !existing.sourceNodeIds?.includes(nid)) existing.sourceNodeIds?.push(nid);
      } else {
        radiiMap.set(cornerRadius, {
          name: `radius-${cornerRadius}`,
          value: cornerRadius,
          sourceNodeIds: nid ? [nid] : [],
        });
      }
    }

    // Extract spacing from auto-layout
    for (const [prop, prefix] of [["itemSpacing", "space"], ["paddingTop", "padding"], ["paddingLeft", "padding"], ["paddingRight", "padding"], ["paddingBottom", "padding"]] as const) {
      const val = node[prop] as number | undefined;
      if (typeof val === "number" && val > 0) {
        const existing = spacingMap.get(val);
        if (existing) {
          if (nid && !existing.sourceNodeIds?.includes(nid)) existing.sourceNodeIds?.push(nid);
        } else {
          spacingMap.set(val, {
            name: `${prefix}-${val}`,
            value: val,
            sourceNodeIds: nid ? [nid] : [],
          });
        }
      }
    }

    // Recurse
    const children = node.children as Record<string, unknown>[] | undefined;
    if (children && Array.isArray(children)) {
      for (const child of children) walkNode(child);
    }
  }

  for (const node of nodes) walkNode(node);

  const colors = Array.from(colorMap.values());
  const spacing = Array.from(spacingMap.values()).sort((a, b) => a.value - b.value);
  const radii = Array.from(radiiMap.values()).sort((a, b) => a.value - b.value);
  const textStyles = Array.from(textStyleMap.values());

  // Sort font sizes within each style descending, sort styles by family then weight
  for (const ts of textStyles) {
    ts.fontSize.sort((a, b) => b - a);
    ts.lineHeight.sort((a, b) => b - a);
  }
  textStyles.sort((a, b) => {
    if (a.fontFamily !== b.fontFamily) return a.fontFamily.localeCompare(b.fontFamily);
    return b.fontWeight - a.fontWeight;
  });

  return { colors, textStyles, spacing, radii };
}

export async function fetchFrameImages(
  token: string,
  fileKey: string,
  nodeIds: string[]
): Promise<Record<string, string | null>> {
  if (nodeIds.length === 0) return {};

  const data = await apiFetch(
    `/api/figma/image?fileKey=${encodeURIComponent(fileKey)}&ids=${encodeURIComponent(nodeIds.join(","))}`,
    token
  );

  return (data.images || {}) as Record<string, string | null>;
}

// Merge Desktop/Mobile text style pairs into unified responsive entries
export type MergedTextStyle = {
  semanticName: string;
  fontFamily: string;
  fontWeight: number;
  fontStyle: string;
  lineHeight: number;
  desktop?: ExtractedTextStyle;
  mobile?: ExtractedTextStyle;
};

export function mergeTextStyles(textStyles: ExtractedTextStyle[]): MergedTextStyle[] {
  const map = new Map<string, MergedTextStyle>();

  for (const ts of textStyles) {
    const name = ts.figmaStyleName || ts.name;
    const isDesktop = /^Desktop\//i.test(name);
    const isMobile = /^Mobile\//i.test(name);
    const semantic = name
      .replace(/^(Desktop|Mobile)\//i, "")
      .replace(/\//g, "--")
      .toLowerCase();

    if (!map.has(semantic)) {
      map.set(semantic, {
        semanticName: semantic,
        fontFamily: ts.fontFamily,
        fontWeight: ts.fontWeight,
        fontStyle: ts.fontStyle,
        lineHeight: ts.lineHeight[0] || 1.2,
        desktop: isDesktop ? ts : (!isMobile ? ts : undefined),
        mobile: isMobile ? ts : undefined,
      });
    } else {
      const entry = map.get(semantic)!;
      if (isDesktop) entry.desktop = ts;
      else if (isMobile) entry.mobile = ts;
    }
  }

  // Second pass: fuzzy-match orphan Desktop/Mobile entries (e.g. "strong" vs "stronger")
  const entries = Array.from(map.entries());
  const desktopOnly = entries.filter(([, m]) => m.desktop && !m.mobile);
  const mobileOnly = entries.filter(([, m]) => !m.desktop && m.mobile);

  for (const [dKey, dEntry] of desktopOnly) {
    const dParts = dKey.split("--");
    const dBase = dParts.slice(0, -1).join("--");
    const dLast = dParts[dParts.length - 1];
    let bestMatch: [string, MergedTextStyle] | null = null;
    let bestScore = 0;

    for (const [mKey, mEntry] of mobileOnly) {
      const mParts = mKey.split("--");
      const mBase = mParts.slice(0, -1).join("--");
      const mLast = mParts[mParts.length - 1];
      if (dBase !== mBase) continue;
      if (dLast === mLast) continue;
      if (dLast.startsWith(mLast) || mLast.startsWith(dLast)) {
        const score = Math.min(dLast.length, mLast.length);
        if (score > bestScore) { bestScore = score; bestMatch = [mKey, mEntry]; }
      }
    }

    if (bestMatch) {
      const [mKey, mEntry] = bestMatch;
      dEntry.mobile = mEntry.mobile;
      map.delete(mKey);
      const idx = mobileOnly.findIndex(([k]) => k === mKey);
      if (idx >= 0) mobileOnly.splice(idx, 1);
    }
  }

  return Array.from(map.values());
}

function weightLabel(w: number): string {
  if (w <= 400) return "regular";
  if (w <= 500) return "medium";
  if (w <= 600) return "semibold";
  return "bold";
}

function fixed(n: number): string {
  return Number(n.toFixed(2)).toString();
}

export function generateCSSFromTokens(tokens: ExtractedTokens): string {
  const lines: string[] = [];

  // Colors as custom properties
  if (tokens.colors.length > 0) {
    lines.push(":root {");
    lines.push("  /* Colors */");
    for (const c of [...tokens.colors].sort((a, b) => a.name.localeCompare(b.name))) {
      const varName = c.name.replace(/[/ ]/g, "-").toLowerCase();
      lines.push(`  --color-${varName}: ${c.hex};`);
    }
    if (tokens.spacing.length > 0 || tokens.radii.length > 0) lines.push("");
    // Spacing
    if (tokens.spacing.length > 0) {
      lines.push("  /* Spacing */");
      for (const s of [...tokens.spacing].sort((a, b) => a.name.localeCompare(b.name))) {
        const varName = s.name.replace(/[/ ]/g, "-").toLowerCase();
        lines.push(`  --spacing-${varName}: ${fixed(s.value)}px;`);
      }
    }
    // Radii
    if (tokens.radii.length > 0) {
      if (tokens.spacing.length > 0) lines.push("");
      lines.push("  /* Radii */");
      for (const r of [...tokens.radii].sort((a, b) => a.name.localeCompare(b.name))) {
        const varName = r.name.replace(/[/ ]/g, "-").toLowerCase();
        lines.push(`  --radius-${varName}: ${fixed(r.value)}px;`);
      }
    }
    lines.push("}");
    lines.push("");
  }

  // Typography as BEM classes with nested media queries
  const merged = mergeTextStyles(tokens.textStyles);
  const sorted = [...merged].sort((a, b) => a.semanticName.localeCompare(b.semanticName));

  for (const m of sorted) {
    const dt = m.desktop;
    const mb = m.mobile;
    const primary = dt || mb;
    if (!primary) continue;

    const desktopSize = dt?.fontSize[0];
    const mobileSize = mb?.fontSize[0];
    const wl = weightLabel(m.fontWeight);

    lines.push(`.${m.semanticName} {`);
    lines.push(`  font-family: var(--font-primary);`);
    lines.push(`  font-weight: var(--font-weight-${wl});`);
    lines.push(`  font-size: ${fixed(mobileSize || desktopSize || 16)}px;`);
    lines.push(`  line-height: ${fixed(m.lineHeight)};`);
    if (m.fontStyle === "italic") {
      lines.push(`  font-style: italic;`);
    }

    if (desktopSize && mobileSize && desktopSize !== mobileSize) {
      lines.push("");
      lines.push(`  @media (min-width: 1024px) {`);
      lines.push(`    font-size: ${fixed(desktopSize)}px;`);
      lines.push(`  }`);
    }

    lines.push("}");
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

export function generateTailwindConfigFromTokens(tokens: ExtractedTokens): string {
  const colors: Record<string, string> = {};
  for (const c of tokens.colors) {
    const key = c.name.replace(/[/ ]/g, "-").toLowerCase();
    colors[key] = c.hex;
  }

  const spacing: Record<string, string> = {};
  for (const s of tokens.spacing) {
    const key = s.name.replace(/[/ ]/g, "-").toLowerCase();
    spacing[key] = `${s.value}px`;
  }

  const borderRadius: Record<string, string> = {};
  for (const r of tokens.radii) {
    const key = r.name.replace(/[/ ]/g, "-").toLowerCase();
    borderRadius[key] = `${r.value}px`;
  }

  const config = {
    theme: {
      extend: {
        colors,
        spacing,
        borderRadius,
      },
    },
  };

  return `/** @type {import('tailwindcss').Config} */\nmodule.exports = ${JSON.stringify(config, null, 2)}`;
}

export function generateJSONFromTokens(tokens: ExtractedTokens): string {
  return JSON.stringify(tokens, null, 2);
}

// Parse hex string to rgba
function hexToRgba(hex: string): { r: number; g: number; b: number; a: number } {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return { r, g, b, a: 1 };
}

// Parse Font(...) string from Figma MCP output
function parseFontString(str: string): ExtractedTextStyle | null {
  const m = str.match(
    /Font\(family:\s*"([^"]+)",\s*style:\s*(\w+),\s*size:\s*([\d.]+),\s*weight:\s*(\d+),\s*lineHeight:\s*([\d.]+),\s*letterSpacing:\s*([\d.]+)\)/
  );
  if (!m) return null;
  return {
    name: "",
    fontFamily: m[1],
    fontSize: [parseFloat(m[3])],
    fontWeight: parseInt(m[4]),
    fontStyle: m[2].toLowerCase() === "italic" ? "italic" : "normal",
    lineHeight: [parseFloat(m[5])],
    letterSpacing: parseFloat(m[6]) !== 0 ? [parseFloat(m[6])] : [],
    sourceNodeIds: [],
    examples: [],
  };
}

/**
 * Source reference for imported tokens — links back to the original Figma node/file.
 */
export type ImportSource = {
  fileKey?: string;
  nodeId?: string;
  nodeIdMap?: Record<string, string>; // per-token: style name → specific node ID
  url?: string;
};

/**
 * Parse imported JSON into ExtractedTokens.
 * Supports:
 * - Figma MCP format: { "Name": "#hex" | "Font(...)" }
 * - W3C DTCG format: { group: { token: { "$type": "color", "$value": "#hex" } } }
 * - Multiple MCP results merged (array of objects)
 *
 * When `source` is provided, attaches the Figma file/node reference to all extracted tokens.
 */
export function parseImportedTokens(input: string, source?: ImportSource): ExtractedTokens {
  const raw = JSON.parse(input);

  // Native ExtractedTokens format (e.g. re-importing a design-tokens.json)
  if (
    !Array.isArray(raw) &&
    typeof raw === "object" &&
    raw !== null &&
    Array.isArray(raw.colors) &&
    Array.isArray(raw.textStyles) &&
    Array.isArray(raw.spacing) &&
    Array.isArray(raw.radii)
  ) {
    return raw as ExtractedTokens;
  }

  // Build Figma deep link from source reference
  const fileKey = source?.fileKey;
  const nodeIdMap = source?.nodeIdMap || {};
  const fallbackUrl = fileKey && source?.nodeId
    ? `https://www.figma.com/design/${fileKey}/?node-id=${source.nodeId.replace(":", "-")}`
    : source?.url || undefined;
  const fallbackNodeId = source?.nodeId || undefined;

  // Helper: get per-token source URL and node ID
  function tokenSource(tokenName: string) {
    const nid = nodeIdMap[tokenName] || fallbackNodeId;
    const url = nid && fileKey
      ? `https://www.figma.com/design/${fileKey}/?node-id=${nid.replace(":", "-")}`
      : fallbackUrl;
    return { sourceNodeIds: nid ? [nid] : [], sourceUrl: url };
  }

  // Handle array of MCP results — merge into single object
  const entries: Record<string, string> = {};
  const dtcgTokens: { name: string; type: string; value: unknown }[] = [];

  function collectDTCG(obj: Record<string, unknown>, prefix: string) {
    for (const [key, val] of Object.entries(obj)) {
      if (key.startsWith("$")) continue;
      const v = val as Record<string, unknown>;
      if (v && typeof v === "object" && "$value" in v) {
        dtcgTokens.push({
          name: prefix ? `${prefix}/${key}` : key,
          type: (v.$type as string) || "unknown",
          value: v.$value,
        });
      } else if (v && typeof v === "object" && !Array.isArray(v)) {
        collectDTCG(v, prefix ? `${prefix}/${key}` : key);
      }
    }
  }

  // Detect format
  const items = Array.isArray(raw) ? raw : [raw];
  let isDTCG = false;

  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    for (const [key, val] of Object.entries(item)) {
      if (typeof val === "string") {
        // MCP flat format: "Name": "#hex" or "Name": "Font(...)"
        entries[key] = val;
      } else if (typeof val === "object" && val !== null) {
        isDTCG = true;
      }
    }
  }

  if (isDTCG) {
    for (const item of items) {
      collectDTCG(item as Record<string, unknown>, "");
    }
  }

  const colors: ExtractedColor[] = [];
  const textStyles: ExtractedTextStyle[] = [];
  const spacing: ExtractedSpacing[] = [];
  const radii: ExtractedSpacing[] = [];
  const seenHex = new Set<string>();

  if (isDTCG && dtcgTokens.length > 0) {
    // W3C DTCG format
    for (const t of dtcgTokens) {
      if (t.type === "color" && typeof t.value === "string") {
        const hex = t.value.startsWith("#") ? t.value.slice(0, 7).toLowerCase() : t.value;
        if (!seenHex.has(hex)) {
          seenHex.add(hex);
          const src = tokenSource(t.name);
          colors.push({
            name: t.name,
            figmaStyleName: t.name,
            hex,
            rgba: hexToRgba(hex),
            collection: "imported",
            ...src,
          });
        }
      } else if (t.type === "dimension" && typeof t.value === "string") {
        const num = parseFloat(t.value);
        if (!isNaN(num)) {
          const nameLower = t.name.toLowerCase();
          const src = tokenSource(t.name);
          if (nameLower.includes("radius") || nameLower.includes("corner")) {
            radii.push({ name: t.name, value: num, ...src });
          } else {
            spacing.push({ name: t.name, value: num, ...src });
          }
        }
      } else if (t.type === "fontFamily" || t.type === "typography") {
        // Typography composite tokens
        if (typeof t.value === "object" && t.value !== null) {
          const v = t.value as Record<string, unknown>;
          const src = tokenSource(t.name);
          textStyles.push({
            name: t.name,
            figmaStyleName: t.name,
            fontFamily: (v.fontFamily as string) || "unknown",
            fontSize: typeof v.fontSize === "number" ? [v.fontSize] : typeof v.fontSize === "string" ? [parseFloat(v.fontSize)] : [],
            fontWeight: typeof v.fontWeight === "number" ? v.fontWeight : 400,
            fontStyle: "normal",
            lineHeight: typeof v.lineHeight === "number" ? [v.lineHeight] : typeof v.lineHeight === "string" ? [parseFloat(v.lineHeight)] : [],
            letterSpacing: typeof v.letterSpacing === "number" && v.letterSpacing !== 0 ? [v.letterSpacing] : [],
            ...src,
            examples: [],
          });
        }
      }
    }
  } else {
    // MCP flat format
    for (const [name, value] of Object.entries(entries)) {
      if (value.startsWith("#")) {
        const hex = value.slice(0, 7).toLowerCase();
        if (!seenHex.has(hex)) {
          seenHex.add(hex);
          const src = tokenSource(name);
          colors.push({
            name,
            figmaStyleName: name,
            hex,
            rgba: hexToRgba(hex),
            collection: "imported",
            ...src,
          });
        }
      } else if (value.startsWith("Font(")) {
        const ts = parseFontString(value);
        if (ts) {
          ts.name = name;
          ts.figmaStyleName = name;
          const src = tokenSource(name);
          ts.sourceNodeIds = src.sourceNodeIds;
          ts.sourceUrl = src.sourceUrl;
          textStyles.push(ts);
        }
      }
    }
  }

  return { colors, textStyles, spacing, radii };
}
