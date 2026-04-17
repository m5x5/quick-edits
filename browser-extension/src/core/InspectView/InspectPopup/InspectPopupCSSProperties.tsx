import { useEffect, useState } from "react";

/** CSS property groups with the properties to display for each */
const PROPERTY_GROUPS: Record<string, string[]> = {
  Typography: [
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "line-height",
    "letter-spacing",
    "text-align",
    "text-decoration",
    "text-transform",
    "color",
  ],
  Spacing: [
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
  ],
  Size: [
    "width",
    "height",
    "min-width",
    "min-height",
    "max-width",
    "max-height",
  ],
  Layout: [
    "display",
    "position",
    "flex-direction",
    "justify-content",
    "align-items",
    "gap",
    "overflow",
  ],
  Background: [
    "background-color",
    "background-image",
  ],
  Border: [
    "border-width",
    "border-style",
    "border-color",
    "border-radius",
  ],
  Effects: [
    "opacity",
    "box-shadow",
    "z-index",
  ],
};

/** All property names we care about */
const ALL_PROPERTIES = Object.values(PROPERTY_GROUPS).flat();

/** Detect if a property value is the browser default / not explicitly set */
const isDefaultValue = (prop: string, value: string): boolean => {
  const defaults: Record<string, string[]> = {
    "margin-top": ["0px"],
    "margin-right": ["0px"],
    "margin-bottom": ["0px"],
    "margin-left": ["0px"],
    "padding-top": ["0px"],
    "padding-right": ["0px"],
    "padding-bottom": ["0px"],
    "padding-left": ["0px"],
    "border-width": ["0px"],
    "border-style": ["none"],
    "border-color": ["rgb(0, 0, 0)"],
    "border-radius": ["0px"],
    "letter-spacing": ["normal"],
    "text-align": ["start"],
    "text-decoration": ["none"],
    "text-transform": ["none"],
    "font-style": ["normal"],
    "background-image": ["none"],
    "box-shadow": ["none"],
    "min-width": ["auto"],
    "min-height": ["auto"],
    "max-width": ["none"],
    "max-height": ["none"],
    "flex-direction": ["row"],
    "justify-content": ["normal"],
    "align-items": ["normal"],
    "gap": ["normal"],
    "overflow": ["visible"],
    "opacity": ["1"],
    "z-index": ["auto"],
    "position": ["static"],
  };
  return defaults[prop]?.includes(value) ?? false;
};

/** Render a color swatch if the value looks like a color */
const ColorSwatch = ({ value }: { value: string }) => {
  if (!value.startsWith("rgb") && !value.startsWith("#")) return null;
  return (
    <span
      className="inline-block w-3 h-3 rounded-sm border border-gray-300 dark:border-[#5f6368] shrink-0"
      style={{ backgroundColor: value }}
    />
  );
};

type SourceInfo = {
  /** The full CSS selector that matched */
  selector: string;
  /** Stylesheet URL or null for <style> tags */
  href: string | null;
  /** Short display name */
  filename: string;
  /** If we could trace back to a class on the element, this is the class name */
  className: string | null;
};

type PropertySource = Record<string, SourceInfo | null>;

/** Get a short display name from a stylesheet source path */
const getFilename = (href: string | null): string => {
  if (!href) return "<style>";
  // Handle webpack:///./src/css/components/accordion.css style paths
  const cleaned = href
    .replace(/^webpack:\/\/\/\.?/, "")  // strip webpack:/// or webpack:///./
    .replace(/^\.\/?/, "");              // strip leading ./
  const parts = cleaned.split("/");
  return parts[parts.length - 1] || cleaned;
};

/**
 * Try to extract the original source filename from an inline base64 source map.
 * The source map JSON has a `sources` array like ["webpack:///./src/css/components/accordion.css"].
 */
const extractSourceFromDataUri = (dataUri: string): string | null => {
  try {
    // Format: data:application/json;base64,<base64data>
    const base64 = dataUri.split(",")[1];
    if (!base64) return null;
    const json = JSON.parse(atob(base64));
    const sources: string[] = json.sources;
    if (sources?.length > 0) {
      // Return the first (usually only) source, cleaned up
      return sources[0];
    }
  } catch {
    // Malformed source map
  }
  return null;
};

/** Cache source lookups per stylesheet to avoid repeated base64 decoding */
const sheetSourceCache = new WeakMap<CSSStyleSheet, string | null>();

/**
 * Try to extract a meaningful source identifier from a stylesheet.
 * For <link> tags this is the href. For <style> tags, we try:
 * 1. data-vite-dev-id (Vite injects the original file path)
 * 2. title attribute
 * 3. sourceMappingURL comment (including inline base64 source maps)
 * 4. sourceURL comment
 * 5. Fall back to null
 */
const getSheetSource = (sheet: CSSStyleSheet): string | null => {
  if (sheet.href) return sheet.href;

  const cached = sheetSourceCache.get(sheet);
  if (cached !== undefined) return cached;

  let result: string | null = null;

  const owner = sheet.ownerNode;
  if (owner instanceof HTMLStyleElement) {
    // Vite dev mode adds this attribute with the original file path
    const viteId = owner.getAttribute("data-vite-dev-id");
    if (viteId) {
      result = viteId;
    } else if (owner.title) {
      // Some tools set a title
      result = owner.title;
    } else {
      // Look for a sourceMappingURL comment in the CSS text
      const text = owner.textContent;
      if (text) {
        const sourceMapMatch = text.match(/\/\*[#@]\s*sourceMappingURL=(\S+)\s*\*\//);
        if (sourceMapMatch?.[1]) {
          const mapUrl = sourceMapMatch[1];
          if (mapUrl.startsWith("data:")) {
            // Decode inline base64 source map to get original filename
            result = extractSourceFromDataUri(mapUrl);
          } else {
            result = mapUrl.replace(/\.map$/, "");
          }
        }
        if (!result) {
          const sourceUrlMatch = text.match(/\/\*[#@]\s*sourceURL=(\S+)\s*\*\//);
          if (sourceUrlMatch?.[1]) result = sourceUrlMatch[1];
        }
      }
    }
  }

  sheetSourceCache.set(sheet, result);
  return result;
};

/**
 * Try to extract a class name from a CSS selector that matches one of the
 * element's own classes. e.g. selector ".text-lg" → class "text-lg"
 * Handles Tailwind's escaped characters: `.text-\[14px\]`, `.hover\:bg-red-500`, `.w-1\/2`
 */
const matchSelectorToClass = (selector: string, elementClasses: Set<string>): string | null => {
  // Match class selectors including escaped characters (brackets, colons, slashes, dots, etc.)
  const classPattern = /\.((?:[a-zA-Z0-9_-]|\\[^\s])+)/g;
  let match: RegExpExecArray | null;
  while ((match = classPattern.exec(selector)) !== null) {
    // Unescape CSS class names (e.g. `.text-\[14px\]` → `text-[14px]`)
    const cls = match[1].replace(/\\(.)/g, "$1");
    if (elementClasses.has(cls)) return cls;
  }
  return null;
};

/**
 * Walk all stylesheets and find which rule sets each property on the target.
 * Returns the *winning* (last-matching) rule for each property.
 */
const getPropertySources = (target: Element): PropertySource => {
  const sources: PropertySource = {};
  const propsSet = new Set(ALL_PROPERTIES);
  const elementClasses = new Set(target.classList.values());

  for (const sheet of document.styleSheets) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      // Cross-origin stylesheet — can't read rules
      continue;
    }

    const href = getSheetSource(sheet);
    walkRules(rules, target, href, propsSet, elementClasses, sources);
  }

  // Check inline styles last (highest specificity)
  const inline = (target as HTMLElement).style;
  if (inline?.length) {
    for (let i = 0; i < inline.length; i++) {
      const prop = inline[i];
      if (propsSet.has(prop)) {
        sources[prop] = {
          selector: "element.style",
          href: null,
          filename: "inline style",
          className: null,
        };
      }
    }
  }

  return sources;
};

/** Recursively walk CSS rules including @media, @layer, @supports */
const walkRules = (
  rules: CSSRuleList,
  target: Element,
  href: string | null,
  propsSet: Set<string>,
  elementClasses: Set<string>,
  sources: PropertySource,
) => {
  for (const rule of rules) {
    if (rule instanceof CSSStyleRule) {
      let matches = false;
      try {
        matches = target.matches(rule.selectorText);
      } catch {
        continue;
      }
      if (!matches) continue;

      const className = matchSelectorToClass(rule.selectorText, elementClasses);

      for (let i = 0; i < rule.style.length; i++) {
        const prop = rule.style[i];
        if (propsSet.has(prop)) {
          sources[prop] = {
            selector: rule.selectorText,
            href,
            filename: getFilename(href),
            className,
          };
        }
      }
    } else if (
      rule instanceof CSSMediaRule ||
      rule instanceof CSSSupportsRule ||
      (rule as any).cssRules
    ) {
      if (rule instanceof CSSMediaRule && !window.matchMedia(rule.conditionText).matches) {
        continue;
      }
      walkRules((rule as CSSGroupingRule).cssRules, target, href, propsSet, elementClasses, sources);
    }
  }
};

type CollapsedGroups = Record<string, boolean>;

export default function InspectPopupCSSProperties({
  target,
}: {
  target: HTMLElement | SVGElement;
}) {
  const [properties, setProperties] = useState<Record<string, string>>({});
  const [sources, setSources] = useState<PropertySource>({});
  const [collapsed, setCollapsed] = useState<CollapsedGroups>({});
  const [showDefaults, setShowDefaults] = useState(false);

  useEffect(() => {
    const computed = getComputedStyle(target);
    const props: Record<string, string> = {};
    for (const prop of ALL_PROPERTIES) {
      props[prop] = computed.getPropertyValue(prop);
    }
    setProperties(props);
    setSources(getPropertySources(target));
  }, [target]);

  const toggleGroup = (group: string) => {
    setCollapsed((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <div className="flex flex-col gap-1 text-[12px] font-mono mt-2 pt-2 border-t border-gray-200 dark:border-[#3c4043]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-gray-400 dark:text-[#9ba0a5] font-sans">Computed Styles</span>
        <label className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-[#9ba0a5] font-sans cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showDefaults}
            onChange={(e) => setShowDefaults(e.target.checked)}
            className="w-3 h-3"
          />
          defaults
        </label>
      </div>

      {Object.entries(PROPERTY_GROUPS).map(([groupName, groupProps]) => {
        const visibleProps = groupProps.filter(
          (prop) => showDefaults || !isDefaultValue(prop, properties[prop] ?? "")
        );

        if (visibleProps.length === 0) return null;

        const isCollapsed = collapsed[groupName];

        return (
          <div key={groupName}>
            <button
              type="button"
              className="flex items-center gap-1 w-full text-left text-[11px] font-sans font-medium text-gray-500 dark:text-[#9ba0a5] bg-transparent border-0 p-0 cursor-pointer hover:text-gray-700 dark:hover:text-[#e8eaed] transition-colors"
              onClick={() => toggleGroup(groupName)}
            >
              <svg
                width="8"
                height="8"
                viewBox="0 0 8 8"
                fill="currentColor"
                className={`transition-transform ${isCollapsed ? "" : "rotate-90"}`}
              >
                <path d="M2 1l4 3-4 3z" />
              </svg>
              {groupName}
            </button>

            {!isCollapsed && (
              <div className="ml-2 mt-0.5 mb-1">
                {visibleProps.map((prop) => {
                  const value = properties[prop] ?? "";
                  const isDef = isDefaultValue(prop, value);
                  const source = sources[prop];

                  return (
                    <div
                      key={prop}
                      className={`py-0.5 ${isDef ? "opacity-40" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600 dark:text-purple-400 shrink-0 min-w-[120px]">
                          {prop}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-gray-700 dark:text-[#e8eaed] truncate flex items-center gap-1">
                            <ColorSwatch value={value} />
                            {value}
                          </span>
                          {source && (
                            <SourceLabel source={source} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Displays the source of a CSS property value */
function SourceLabel({ source }: { source: SourceInfo }) {
  // If we traced it to a class name, show that prominently
  if (source.className) {
    return (
      <div className="flex items-center gap-1 text-[10px]">
        <span className="text-blue-500 dark:text-blue-400">{source.className}</span>
        {source.href && (
          <span className="text-gray-400 dark:text-[#5f6368] truncate" title={source.href}>
            {source.filename}
          </span>
        )}
        {!source.href && (
          <span className="text-gray-400 dark:text-[#5f6368]">&lt;style&gt;</span>
        )}
      </div>
    );
  }

  // External stylesheet with a real file
  if (source.href) {
    return (
      <div className="flex items-center gap-1 text-[10px]">
        <span className="text-green-600 dark:text-green-500 truncate max-w-[120px]" title={source.selector}>
          {source.selector}
        </span>
        <span className="text-orange-500 dark:text-orange-400 truncate" title={source.href}>
          {source.filename}
        </span>
      </div>
    );
  }

  // Inline style attribute
  if (source.selector === "element.style") {
    return (
      <div className="text-[10px] text-gray-400 dark:text-[#5f6368]">
        style attribute
      </div>
    );
  }

  // <style> tag but couldn't match to a class — show selector
  return (
    <div className="flex items-center gap-1 text-[10px]">
      <span className="text-green-600 dark:text-green-500 truncate max-w-[140px]" title={source.selector}>
        {source.selector}
      </span>
      <span className="text-gray-400 dark:text-[#5f6368]">&lt;style&gt;</span>
    </div>
  );
}
