export type ExtractedColor = {
  name: string;
  figmaStyleName?: string;
  hex: string;
  rgba: { r: number; g: number; b: number; a: number };
  collection: string;
  sourceNodeIds?: string[];
  sourceUrl?: string; // Figma deep link to the source node
};

export type ExtractedTextStyle = {
  name: string;
  figmaStyleName?: string;
  fontFamily: string;
  fontSize: number[];
  fontWeight: number;
  fontStyle: string;
  lineHeight: number[];
  letterSpacing: number[];
  sourceNodeIds: string[];
  sourceUrl?: string; // Figma deep link to the source node
  examples: string[];
};

// Figma file-level style reference (from GET /v1/files/:key → data.styles)
export type FigmaStyleRef = {
  key: string;
  name: string;
  styleType: "FILL" | "TEXT" | "EFFECT" | "GRID";
  description: string;
};

export type ExtractedSpacing = {
  name: string;
  value: number;
  sourceNodeIds?: string[];
  sourceUrl?: string; // Figma deep link to the source node
};

export type ExtractedTokens = {
  colors: ExtractedColor[];
  textStyles: ExtractedTextStyle[];
  spacing: ExtractedSpacing[];
  radii: ExtractedSpacing[];
};

export type FigmaPage = {
  id: string;
  name: string;
  children: FigmaFrame[];
};

export type FigmaFrame = {
  id: string;
  name: string;
  type: string;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
};

export type FigmaFileInfo = {
  name: string;
  lastModified: string;
  pages: FigmaPage[];
  styles: Record<string, FigmaStyleRef>;
  fillStyleColors?: Record<string, string>; // hex → style name map from FILL styles
};

// Saved typography class for validation
export type TypographyClassDef = {
  name: string; // CSS class name, e.g. "headline--l"
  fontWeight?: string;
  fontSize?: string;
  lineHeight?: string;
  responsiveFontSize?: string; // desktop size at breakpoint
};

// Figma API variable types
export type FigmaColor = { r: number; g: number; b: number; a: number };

export type FigmaVariable = {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";
  valuesByMode: Record<string, FigmaColor | number | string | boolean>;
  description: string;
};

export type FigmaVariableCollection = {
  id: string;
  name: string;
  modes: { modeId: string; name: string }[];
  defaultModeId: string;
  variableIds: string[];
};
