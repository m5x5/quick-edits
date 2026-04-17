// @ts-nocheck
import WebMCP from "@jason.today/webmcp/src/webmcp.js";
import {
  type DesignTokens,
  findClosestColor,
  findClosestTextStyle,
  loadDesignTokens,
  saveDesignTokens,
} from "../core/DevToolbar/tokens";

export function initWebMCP() {
  const mcp = new WebMCP({
    position: "bottom-left",
    size: "24px",
    padding: "10px",
  });

  // Tool: select an element by CSS selector and open the inspect popup
  mcp.registerTool(
    "inspect_element",
    "Select a page element by CSS selector to inspect with quick-edits",
    {
      selector: {
        type: "string",
        description:
          "CSS selector for the element to inspect (e.g. 'h1', '.my-class', '#my-id')",
      },
    },
    (args: { selector: string }) => {
      const el = document.querySelector(args.selector);
      if (!el || !(el instanceof HTMLElement)) {
        return {
          content: [
            {
              type: "text",
              text: `No element found for selector: ${args.selector}`,
            },
          ],
        };
      }

      // Use postMessage to communicate with the InspectView (works across isolated worlds)
      window.postMessage({ type: "quick-edits:inspect", selector: args.selector }, "*");

      return {
        content: [
          {
            type: "text",
            text: `Selected element: <${el.tagName.toLowerCase()}> with classes "${el.className}"`,
          },
        ],
      };
    }
  );

  // Tool: edit a class on an element (replace one class with another variant)
  mcp.registerTool(
    "edit_class",
    "Replace a CSS class on an element with a different variant (e.g. change pt-4 to pt-8). First use inspect_element to select the element.",
    {
      selector: {
        type: "string",
        description: "CSS selector for the element to edit",
      },
      old_class: {
        type: "string",
        description: "The existing class to replace (e.g. 'pt-4')",
      },
      new_class: {
        type: "string",
        description: "The new class to apply (e.g. 'pt-8')",
      },
    },
    (args: { selector: string; old_class: string; new_class: string }) => {
      const el = document.querySelector(args.selector);
      if (!el || !(el instanceof HTMLElement)) {
        return {
          content: [{ type: "text", text: `No element found for selector: ${args.selector}` }],
        };
      }

      if (!el.classList.contains(args.old_class)) {
        return {
          content: [{ type: "text", text: `Element does not have class "${args.old_class}". Current classes: "${el.className}"` }],
        };
      }

      el.classList.remove(args.old_class);
      el.classList.add(args.new_class);

      // Notify the inspect view about the change
      window.postMessage({
        type: "quick-edits:class-change",
        selector: args.selector,
        oldClass: args.old_class,
        newClass: args.new_class,
      }, "*");

      return {
        content: [
          {
            type: "text",
            text: `Replaced "${args.old_class}" with "${args.new_class}" on <${el.tagName.toLowerCase()}>. Current classes: "${el.className}"`,
          },
        ],
      };
    }
  );

  // Tool: add a class to an element
  mcp.registerTool(
    "add_class",
    "Add a CSS class to an element (e.g. add 'bg-red-500' to a div)",
    {
      selector: {
        type: "string",
        description: "CSS selector for the element",
      },
      class_name: {
        type: "string",
        description: "The class to add (e.g. 'bg-red-500')",
      },
    },
    (args: { selector: string; class_name: string }) => {
      const el = document.querySelector(args.selector);
      if (!el || !(el instanceof HTMLElement)) {
        return {
          content: [{ type: "text", text: `No element found for selector: ${args.selector}` }],
        };
      }

      el.classList.add(args.class_name);

      return {
        content: [
          {
            type: "text",
            text: `Added "${args.class_name}" to <${el.tagName.toLowerCase()}>. Current classes: "${el.className}"`,
          },
        ],
      };
    }
  );

  // Tool: list pixel perfect overlay images
  mcp.registerTool(
    "pixel_perfect_list_images",
    "List all uploaded pixel perfect overlay images and the current page's overlay config",
    {},
    async () => {
      const data = await chrome.storage.local.get(["pixelPerfect"]);
      const storage = data.pixelPerfect || {};
      const global = storage.global || {};
      const pageKey = window.location.origin + window.location.pathname;
      const pageConfig = storage.pages?.[pageKey] || {};
      const images = (global.images || []).map((img: { id: string; name: string; naturalWidth: number; naturalHeight: number }) => ({
        id: img.id,
        name: img.name,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            images,
            pageKey,
            activeImageId: pageConfig.activeImageId || null,
            opacity: pageConfig.opacity ?? 0.5,
            inverted: pageConfig.inverted ?? false,
            overlayX: pageConfig.overlayX ?? 0,
            overlayY: pageConfig.overlayY ?? 0,
            overlayWidth: pageConfig.overlayWidth ?? 0,
          }, null, 2),
        }],
      };
    }
  );

  // Tool: configure pixel perfect overlay
  mcp.registerTool(
    "pixel_perfect_set_overlay",
    "Configure the pixel perfect overlay. Set which image to show, its opacity, position, width, and invert state. All parameters are optional — only provided values are changed.",
    {
      image_id: {
        type: "string",
        description: "ID of the image to show (from pixel_perfect_list_images), or empty string to hide overlay",
      },
      opacity: {
        type: "number",
        description: "Overlay opacity from 0 to 1 (e.g. 0.5 for 50%)",
      },
      inverted: {
        type: "boolean",
        description: "Whether to invert the overlay image colors",
      },
      x: {
        type: "number",
        description: "Overlay X position in pixels",
      },
      y: {
        type: "number",
        description: "Overlay Y position in pixels",
      },
      width: {
        type: "number",
        description: "Overlay width in pixels",
      },
    },
    (args: { image_id?: string; opacity?: number; inverted?: boolean; x?: number; y?: number; width?: number }) => {
      const msg: Record<string, unknown> = { type: "pixel-perfect:set-overlay" };
      if (args.image_id !== undefined) msg.imageId = args.image_id || null;
      if (args.opacity !== undefined) msg.opacity = args.opacity;
      if (args.inverted !== undefined) msg.inverted = args.inverted;
      if (args.x !== undefined) msg.x = args.x;
      if (args.y !== undefined) msg.y = args.y;
      if (args.width !== undefined) msg.width = args.width;

      window.postMessage(msg, "*");

      return {
        content: [{
          type: "text",
          text: `Pixel perfect overlay updated: ${JSON.stringify(args)}`,
        }],
      };
    }
  );

  // Tool: get page structure overview
  mcp.registerTool(
    "get_page_elements",
    "Get a list of notable elements on the page (headings, buttons, links, etc.)",
    {},
    () => {
      const selectors = "h1, h2, h3, h4, h5, h6, button, a, [class]";
      const elements = Array.from(document.querySelectorAll(selectors))
        .slice(0, 50)
        .map((el) => {
          const tag = el.tagName.toLowerCase();
          const id = el.id ? `#${el.id}` : "";
          const classes = el.className && typeof el.className === "string"
            ? `.${el.className.trim().split(/\s+/).join(".")}`
            : "";
          const text = el.textContent?.trim().substring(0, 50) || "";
          return `${tag}${id}${classes} → "${text}"`;
        });

      return {
        content: [
          {
            type: "text",
            text: elements.join("\n"),
          },
        ],
      };
    }
  );

  // Tool: compare element against design tokens
  mcp.registerTool(
    "compare_element_tokens",
    "Compare an element's computed styles against imported design tokens. Returns closest color and text style matches with deviations.",
    {
      selector: {
        type: "string",
        description: "CSS selector for the element to compare",
      },
    },
    async (args: { selector: string }) => {
      const tokens = await loadDesignTokens();
      if (!tokens) {
        return {
          content: [{ type: "text", text: "No design tokens imported. Use import_design_tokens first." }],
        };
      }

      const el = document.querySelector(args.selector);
      if (!el || !(el instanceof HTMLElement)) {
        return {
          content: [{ type: "text", text: `No element found for selector: ${args.selector}` }],
        };
      }

      const cs = window.getComputedStyle(el);
      const result: Record<string, unknown> = {
        element: `<${el.tagName.toLowerCase()}>`,
        classes: el.className,
      };

      const colorMatch = findClosestColor(cs.color, tokens.colors);
      if (colorMatch) {
        result.color = {
          actual: cs.color,
          closestToken: colorMatch.token.name,
          tokenHex: colorMatch.token.hex,
          exact: colorMatch.exact,
          distance: Math.round(colorMatch.distance),
        };
      }

      const bgMatch = findClosestColor(cs.backgroundColor, tokens.colors);
      if (bgMatch && cs.backgroundColor !== "rgba(0, 0, 0, 0)") {
        result.backgroundColor = {
          actual: cs.backgroundColor,
          closestToken: bgMatch.token.name,
          tokenHex: bgMatch.token.hex,
          exact: bgMatch.exact,
          distance: Math.round(bgMatch.distance),
        };
      }

      const borderMatch = findClosestColor(cs.borderTopColor, tokens.colors);
      if (borderMatch && cs.borderTopColor !== "rgba(0, 0, 0, 0)") {
        result.borderColor = {
          actual: cs.borderTopColor,
          closestToken: borderMatch.token.name,
          tokenHex: borderMatch.token.hex,
          exact: borderMatch.exact,
          distance: Math.round(borderMatch.distance),
        };
      }

      const textMatch = findClosestTextStyle(
        { fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight, lineHeight: cs.lineHeight },
        tokens.textStyles,
      );
      if (textMatch) {
        result.textStyle = {
          closestToken: textMatch.token.name,
          exact: textMatch.exact,
          deviations: textMatch.deviations,
          score: Math.round(textMatch.score * 100) / 100,
        };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // Tool: list imported design tokens
  mcp.registerTool(
    "list_design_tokens",
    "List all imported design tokens (colors and text styles)",
    {},
    async () => {
      const tokens = await loadDesignTokens();
      if (!tokens) {
        return {
          content: [{ type: "text", text: "No design tokens imported." }],
        };
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            colors: tokens.colors.map(c => ({ name: c.name, hex: c.hex })),
            textStyles: tokens.textStyles.map(t => ({
              name: t.name,
              fontSize: t.fontSize[0],
              fontWeight: t.fontWeight,
              fontFamily: t.fontFamily,
            })),
          }, null, 2),
        }],
      };
    }
  );

  // Tool: set typography classes for validation
  mcp.registerTool(
    "set_typography_classes",
    'Save typography class definitions for usage validation. Accepts a JSON array of class objects with: name (CSS class name), and optional fontWeight, fontSize, lineHeight, responsiveFontSize. Classes are persisted in localStorage.',
    {
      classes: {
        type: "string",
        description: 'JSON array of class definitions, e.g. [{"name":"headline--l","fontWeight":"700","fontSize":"32px","lineHeight":"1.2","responsiveFontSize":"56px"}]',
      },
    },
    (args: { classes: string }) => {
      try {
        const classes = JSON.parse(args.classes);
        if (!Array.isArray(classes) || classes.some((c: any) => !c.name)) {
          return { content: [{ type: "text", text: "Invalid format. Provide a JSON array where each item has at least a 'name' field." }] };
        }
        localStorage.setItem("token-tool-typography-classes", JSON.stringify(classes));
        return {
          content: [{ type: "text", text: `Saved ${classes.length} typography classes: ${classes.map((c: any) => c.name).join(", ")}` }],
        };
      } catch (e: any) {
        return { content: [{ type: "text", text: `Failed to parse classes JSON: ${e.message}` }] };
      }
    }
  );

  // Tool: get saved typography classes
  mcp.registerTool(
    "get_typography_classes",
    "Return the currently saved typography class definitions used for usage validation.",
    {},
    () => {
      try {
        const classes = JSON.parse(localStorage.getItem("token-tool-typography-classes") || "[]");
        return {
          content: [{ type: "text", text: classes.length > 0 ? JSON.stringify(classes, null, 2) : "No typography classes configured yet." }],
        };
      } catch {
        return { content: [{ type: "text", text: "No typography classes configured yet." }] };
      }
    }
  );

  // Tool: validate which typography classes are used on the current page
  mcp.registerTool(
    "validate_class_usage",
    "Check which of the saved typography classes are used on the current page by scanning the DOM. Returns found/not-found for each class with element counts.",
    {},
    () => {
      let classes: any[];
      try {
        classes = JSON.parse(localStorage.getItem("token-tool-typography-classes") || "[]");
      } catch {
        return { content: [{ type: "text", text: "No typography classes configured. Use set_typography_classes first." }] };
      }
      if (classes.length === 0) {
        return { content: [{ type: "text", text: "No typography classes configured. Use set_typography_classes first." }] };
      }
      const results = classes.map((cls: any) => {
        const elements = document.querySelectorAll("." + CSS.escape(cls.name));
        return { name: cls.name, found: elements.length > 0, count: elements.length };
      });
      const found = results.filter((r) => r.found);
      const missing = results.filter((r) => !r.found);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            summary: `${found.length}/${results.length} classes found on page`,
            found: found.map((r) => ({ name: r.name, count: r.count })),
            missing: missing.map((r) => r.name),
          }, null, 2),
        }],
      };
    }
  );

  // Tool: import design tokens from JSON
  mcp.registerTool(
    "import_design_tokens",
    "Import design tokens JSON (with colors and textStyles arrays). Persists to chrome storage for use in token comparison.",
    {
      json: {
        type: "string",
        description: "JSON string with { colors: [...], textStyles: [...] } structure",
      },
    },
    async (args: { json: string }) => {
      try {
        const data = JSON.parse(args.json);
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
        return {
          content: [{
            type: "text",
            text: `Imported ${parsed.colors.length} colors and ${parsed.textStyles.length} text styles.`,
          }],
        };
      } catch {
        return {
          content: [{ type: "text", text: "Failed to parse tokens JSON. Expected { colors: [...], textStyles: [...] }" }],
        };
      }
    }
  );
}
