import type { ExtractedTokens, TypographyClassDef } from "./types";
import {
  generateCSSFromTokens,
  generateTailwindConfigFromTokens,
  parseImportedTokens,
} from "./figma";

type Step = "connect" | "extracted" | "map_review" | "export";

type WebMCPInstance = { destroy?: () => void; registerResource: Function; registerTool: Function };

let mcpInstance: WebMCPInstance | null = null;

export async function initTokenToolWebMCP(
  getTokens: () => ExtractedTokens | null,
  getStep: () => Step,
  getRawNodes: () => Record<string, unknown>[],
  updateTokenName: (type: string, oldName: string, newName: string) => void,
  importTokens: (tokens: ExtractedTokens) => void,
  getSavedClasses: () => TypographyClassDef[],
  setSavedClasses: (classes: TypographyClassDef[]) => void
) {
  if (typeof window === "undefined") return;

  const w = window as Window & { WebMCP?: new (opts: Record<string, string>) => WebMCPInstance };

  if (!w.WebMCP) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/webmcp.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load WebMCP"));
      document.head.appendChild(script);
    });
  }

  const MCP = w.WebMCP;
  if (!MCP) {
    console.warn("WebMCP not available");
    return;
  }

  if (mcpInstance) return mcpInstance;

  const mcp = new MCP({
    position: "bottom-right",
    size: "24px",
    padding: "10px",
  });

  // Resource: all tokens
  mcp.registerResource("tokens://all", "All extracted design tokens", () => {
    const tokens = getTokens();
    return {
      contents: [
        {
          uri: "tokens://all",
          text: tokens ? JSON.stringify(tokens, null, 2) : "No tokens extracted yet",
          mimeType: "application/json",
        },
      ],
    };
  });

  // Resource: colors
  mcp.registerResource("tokens://colors", "Extracted color tokens", () => {
    const tokens = getTokens();
    return {
      contents: [
        {
          uri: "tokens://colors",
          text: tokens ? JSON.stringify(tokens.colors, null, 2) : "[]",
          mimeType: "application/json",
        },
      ],
    };
  });

  // Resource: text styles
  mcp.registerResource("tokens://text-styles", "Extracted text style tokens", () => {
    const tokens = getTokens();
    return {
      contents: [
        {
          uri: "tokens://text-styles",
          text: tokens ? JSON.stringify(tokens.textStyles, null, 2) : "[]",
          mimeType: "application/json",
        },
      ],
    };
  });

  // Resource: spacing
  mcp.registerResource("tokens://spacing", "Extracted spacing tokens", () => {
    const tokens = getTokens();
    return {
      contents: [
        {
          uri: "tokens://spacing",
          text: tokens ? JSON.stringify(tokens.spacing, null, 2) : "[]",
          mimeType: "application/json",
        },
      ],
    };
  });

  // Resource: raw Figma node tree for AI analysis
  mcp.registerResource(
    "figma://nodes",
    "Raw Figma node tree from selected frames — contains all text nodes, fills, styles, layout properties. Use this to analyze the full design structure.",
    () => {
      const nodes = getRawNodes();
      return {
        contents: [
          {
            uri: "figma://nodes",
            text: nodes.length > 0
              ? JSON.stringify(nodes, null, 2)
              : "No nodes loaded yet. User needs to select frames and extract first.",
            mimeType: "application/json",
          },
        ],
      };
    }
  );

  // Tool: get extracted tokens
  mcp.registerTool(
    "get_extracted_tokens",
    "Return all extracted design tokens from the connected Figma file",
    {},
    () => {
      const tokens = getTokens();
      return {
        content: [
          {
            type: "text",
            text: tokens
              ? JSON.stringify(tokens, null, 2)
              : "No tokens extracted yet. User needs to connect a Figma file first.",
          },
        ],
      };
    }
  );

  // Tool: get raw Figma nodes for AI analysis
  mcp.registerTool(
    "get_figma_nodes",
    "Return the raw Figma node tree from selected frames. Contains all text nodes with their font properties (fontFamily, fontWeight, fontSize, italic, lineHeight, letterSpacing), fills with colors, auto-layout spacing, corner radii, and the full hierarchy. Use this to analyze the design and discover text styles, color patterns, spacing scales, etc.",
    {},
    () => {
      const nodes = getRawNodes();
      if (nodes.length === 0) {
        return {
          content: [{ type: "text", text: "No nodes loaded. User needs to select frames and extract first." }],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(nodes, null, 2) }],
      };
    }
  );

  // Tool: analyze text styles in the design
  mcp.registerTool(
    "analyze_text_styles",
    "Walk the Figma node tree and return a summary of all unique text style combinations found (fontFamily + fontWeight + fontStyle). Includes usage count and example text for each style.",
    {},
    () => {
      const nodes = getRawNodes();
      if (nodes.length === 0) {
        return {
          content: [{ type: "text", text: "No nodes loaded." }],
        };
      }

      const styleMap = new Map<string, {
        fontFamily: string;
        fontWeight: number;
        fontStyle: string;
        fontSize: number[];
        lineHeights: number[];
        letterSpacing: number[];
        count: number;
        examples: string[];
      }>();

      function walk(node: Record<string, unknown>) {
        if (node.type === "TEXT" && node.style) {
          const s = node.style as Record<string, unknown>;
          const fontFamily = (s.fontFamily as string) || "unknown";
          const fontWeight = (s.fontWeight as number) || 400;
          const fontStyle = (s.italic as boolean) ? "italic" : "normal";
          const fontSize = (s.fontSize as number) || 0;
          const lineHeightPx = s.lineHeightPx as number | undefined;
          const lh = typeof lineHeightPx === "number" && fontSize > 0
            ? Math.round((lineHeightPx / fontSize) * 100) / 100 : 0;
          const ls = (s.letterSpacing as number) || 0;
          const key = `${fontFamily}-${fontWeight}-${fontStyle}`;
          const text = ((node.characters as string) || "").slice(0, 60);

          if (!styleMap.has(key)) {
            styleMap.set(key, {
              fontFamily, fontWeight, fontStyle,
              fontSize: [], lineHeights: [], letterSpacing: [],
              count: 0, examples: [],
            });
          }
          const entry = styleMap.get(key)!;
          entry.count++;
          if (!entry.fontSize.includes(fontSize)) entry.fontSize.push(fontSize);
          if (lh > 0 && !entry.lineHeights.includes(lh)) entry.lineHeights.push(lh);
          if (ls !== 0 && !entry.letterSpacing.includes(ls)) entry.letterSpacing.push(ls);
          if (text && entry.examples.length < 3) entry.examples.push(text);
        }

        const children = node.children as Record<string, unknown>[] | undefined;
        if (children) for (const c of children) walk(c);
      }

      for (const node of nodes) walk(node);

      const styles = Array.from(styleMap.values())
        .sort((a, b) => b.count - a.count)
        .map((s) => ({
          ...s,
          fontSize: s.fontSize.sort((a, b) => b - a),
          lineHeights: s.lineHeights.sort((a, b) => b - a),
        }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ totalUniqueStyles: styles.length, styles }, null, 2),
        }],
      };
    }
  );

  // Tool: map/rename a token
  mcp.registerTool(
    "map_token",
    "Rename or map a design token to a semantic name",
    {
      token_type: {
        type: "string",
        description: 'Type of token: "color", "textStyle", "spacing", or "radius"',
      },
      old_name: {
        type: "string",
        description: "Current token name",
      },
      new_name: {
        type: "string",
        description: "New semantic name for the token",
      },
    },
    (args: { token_type: string; old_name: string; new_name: string }) => {
      updateTokenName(args.token_type, args.old_name, args.new_name);
      return {
        content: [
          {
            type: "text",
            text: `Renamed ${args.token_type} token "${args.old_name}" to "${args.new_name}"`,
          },
        ],
      };
    }
  );

  // Tool: import tokens from JSON (MCP output, W3C DTCG, or Tokens Studio format)
  mcp.registerTool(
    "import_tokens",
    'Import design tokens from JSON. Accepts: (1) Figma MCP flat format like {"Sunshine Burst":"#ffdf00","Desktop/Headline/MD":"Font(family: \\"Rubik\\", style: Bold, size: 48, weight: 700, lineHeight: 1.2, letterSpacing: 0)"}, (2) W3C DTCG format with $type/$value, (3) Tokens Studio export. Colors are hex strings, text styles are Font() strings. This will replace current tokens and navigate to the extraction preview.',
    {
      json: {
        type: "string",
        description: "JSON string containing the token data to import",
      },
      fileKey: {
        type: "string",
        description: "Optional Figma file key for source references",
      },
      nodeId: {
        type: "string",
        description: "Optional Figma node ID for source references",
      },
    },
    (args: { json: string; fileKey?: string; nodeId?: string }) => {
      try {
        const source = args.fileKey ? { fileKey: args.fileKey, nodeId: args.nodeId } : undefined;
        const tokens = parseImportedTokens(args.json, source);
        const total = tokens.colors.length + tokens.textStyles.length + tokens.spacing.length + tokens.radii.length;
        if (total === 0) {
          return {
            content: [{ type: "text", text: "No tokens found in the provided JSON. Check the format." }],
          };
        }
        importTokens(tokens);
        return {
          content: [{
            type: "text",
            text: `Imported ${tokens.colors.length} colors, ${tokens.textStyles.length} text styles, ${tokens.spacing.length} spacing, ${tokens.radii.length} radii. Navigated to extraction preview.`,
          }],
        };
      } catch (e) {
        return {
          content: [{ type: "text", text: `Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}` }],
        };
      }
    }
  );

  // Tool: generate CSS
  mcp.registerTool(
    "generate_css",
    "Generate CSS custom properties from the extracted tokens",
    {},
    () => {
      const tokens = getTokens();
      if (!tokens) {
        return {
          content: [{ type: "text", text: "No tokens extracted yet." }],
        };
      }
      return {
        content: [{ type: "text", text: generateCSSFromTokens(tokens) }],
      };
    }
  );

  // Tool: generate Tailwind config
  mcp.registerTool(
    "generate_tailwind_config",
    "Generate a Tailwind CSS config from the extracted tokens",
    {},
    () => {
      const tokens = getTokens();
      if (!tokens) {
        return {
          content: [{ type: "text", text: "No tokens extracted yet." }],
        };
      }
      return {
        content: [
          { type: "text", text: generateTailwindConfigFromTokens(tokens) },
        ],
      };
    }
  );

  // Tool: get current step
  mcp.registerTool(
    "get_current_step",
    "Return the current step the user is on in the token tool wizard",
    {},
    () => {
      const tokens = getTokens();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              step: getStep(),
              hasTokens: !!tokens,
              hasRawNodes: getRawNodes().length > 0,
              tokenCounts: tokens
                ? {
                    colors: tokens.colors.length,
                    textStyles: tokens.textStyles.length,
                    spacing: tokens.spacing.length,
                    radii: tokens.radii.length,
                  }
                : null,
            }),
          },
        ],
      };
    }
  );

  // Tool: set typography classes for validation
  mcp.registerTool(
    "set_typography_classes",
    'Save typography class definitions for usage validation. Accepts an array of class objects. Each object has: name (string, the CSS class name e.g. "headline--l"), and optional fontWeight, fontSize, lineHeight, responsiveFontSize. Parses CSS class rules and saves them for the user to validate against their pages. Classes are persisted in localStorage.',
    {
      classes: {
        type: "string",
        description: 'JSON array of class definitions, e.g. [{"name":"headline--l","fontWeight":"700","fontSize":"32px","lineHeight":"1.2","responsiveFontSize":"56px"}]',
      },
    },
    (args: { classes: string }) => {
      try {
        const classes = JSON.parse(args.classes) as TypographyClassDef[];
        if (!Array.isArray(classes) || classes.some((c) => !c.name)) {
          return { content: [{ type: "text", text: "Invalid format. Provide a JSON array where each item has at least a 'name' field." }] };
        }
        setSavedClasses(classes);
        return {
          content: [{ type: "text", text: `Saved ${classes.length} typography classes: ${classes.map((c) => c.name).join(", ")}` }],
        };
      } catch (e) {
        return { content: [{ type: "text", text: `Failed to parse classes JSON: ${e instanceof Error ? e.message : String(e)}` }] };
      }
    }
  );

  // Tool: get saved typography classes
  mcp.registerTool(
    "get_typography_classes",
    "Return the currently saved typography class definitions used for usage validation.",
    {},
    () => {
      const classes = getSavedClasses();
      return {
        content: [{ type: "text", text: classes.length > 0 ? JSON.stringify(classes, null, 2) : "No typography classes configured yet." }],
      };
    }
  );

  // Tool: validate class usage in HTML
  mcp.registerTool(
    "validate_class_usage",
    "Check which of the saved typography classes appear in a given HTML string. Returns found/not-found for each class.",
    {
      html: {
        type: "string",
        description: "HTML source to search for class usage",
      },
    },
    (args: { html: string }) => {
      const classes = getSavedClasses();
      if (classes.length === 0) {
        return { content: [{ type: "text", text: "No typography classes configured. Use set_typography_classes first." }] };
      }
      const results = classes.map((cls) => ({
        name: cls.name,
        found: args.html.includes(cls.name),
      }));
      const found = results.filter((r) => r.found);
      const missing = results.filter((r) => !r.found);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            summary: `${found.length}/${results.length} classes found`,
            found: found.map((r) => r.name),
            missing: missing.map((r) => r.name),
          }, null, 2),
        }],
      };
    }
  );

  mcpInstance = mcp;
  return mcp;
}

export function destroyTokenToolWebMCP() {
  if (mcpInstance) {
    try {
      mcpInstance.destroy?.();
    } catch {
      // ignore
    }
    mcpInstance = null;
  }
}
