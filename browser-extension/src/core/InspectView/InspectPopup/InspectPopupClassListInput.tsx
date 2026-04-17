import { useEffect, useState } from "react";
import { compile } from "tailwindcss";
import { useDebounce } from "use-debounce";
import Input from "../../Input";
import defaultTheme from "./theme.css?inline";

const css = `${defaultTheme} @tailwind utilities;`;
let compiledPromise: ReturnType<typeof compile> | null = null;
const getCompiled = () => {
  if (!compiledPromise) {
    try {
      compiledPromise = compile(css);
    } catch {
      // In non-extension contexts (e.g. Next.js website), the ?inline import
      // may return a module hash instead of raw CSS, causing compile() to fail.
      // Return a stub that produces empty CSS.
      compiledPromise = Promise.resolve({ build: () => "" }) as ReturnType<typeof compile>;
    }
  }
  return compiledPromise;
};

/** Strip font variables from :root to avoid overriding page fonts, keep everything else
 * (spacing, colors, etc. are needed as fallbacks for pages without Tailwind v4) */
const stripFontVars = (css: string) =>
  css.replace(
    /--font-sans:[^;]*;|--font-serif:[^;]*;|--font-mono:[^;]*;|--default-font-family:[^;]*;|--default-font-feature-settings:[^;]*;|--default-font-variation-settings:[^;]*;|--default-mono-font-family:[^;]*;|--default-mono-font-feature-settings:[^;]*;|--default-mono-font-variation-settings:[^;]*;/g,
    ""
  );

const parseInput = async (input: string) => {
  const css = (await getCompiled()).build([...input.split(" ")]);
  return stripFontVars(css);
};

/** Compile a single class and return its CSS property and value */
export const getClassInfo = async (className: string): Promise<{ property: string; value: string } | null> => {
  const result = (await getCompiled()).build([className]);
  // Find the specific class rule by name (not just any rule in the cumulative output)
  const cssClassName = className.replace(/\./g, '\\.').replace(/\//g, '\\/').replace(/:/g, '\\:');
  const ruleStart = result.indexOf(`.${cssClassName} {`);
  if (ruleStart === -1) return null;
  const ruleEnd = result.indexOf('}', ruleStart);
  if (ruleEnd === -1) return null;
  const ruleBody = result.slice(ruleStart, ruleEnd);
  // Match standard CSS properties, skipping custom properties (--tw-*) and setup properties
  const skipProps = new Set(['border-style']); // setup-only, not the meaningful property
  const propRegex = /^\s*([a-z][a-z-]*)\s*:\s*([^;\n]+)/gm;
  let match;
  while ((match = propRegex.exec(ruleBody)) !== null) {
    if (!skipProps.has(match[1])) {
      return { property: match[1], value: match[2].trim() };
    }
  }
  return null;
};

/** Generate and inject CSS for the given class names into the page */
export const injectClassCSS = async (classNames: string[]) => {
  const css = (await getCompiled()).build(classNames);
  const stripped = stripFontVars(css);

  let element = document.querySelector(
    "[data-inspect-popup-class-style-list]",
  ) as HTMLElement;

  if (!element) {
    element = document.createElement("style");
    element.setAttribute("data-inspect-popup-class-style-list", "");
    document.head.appendChild(element);
  }
  element.innerHTML = stripped;
};

export default function InspectPopupClassListInput({
  onChangeClasses,
  debounce = 100
}: {
  onChangeClasses: (classNames: string) => void;
  debounce?: number
}) {
  const [input, setInput] = useState("");
  const [debouncedInput] = useDebounce(input, debounce);

  useEffect(() => {
    const updateCSS = async (debouncedInput: string) => {
      let element = document.querySelector(
        "[data-inspect-popup-class-style-list]",
      ) as HTMLElement;
      onChangeClasses(debouncedInput);
      const parsed = await parseInput(debouncedInput);

      if (!element) {
        element = document.createElement("style");
        element.setAttribute("data-inspect-popup-class-style-list", "");
        document.head.appendChild(element);
      }
      element.innerHTML = parsed;
    };

    updateCSS(debouncedInput);
  }, [debouncedInput, onChangeClasses]);

  const copy = () => navigator.clipboard.writeText(debouncedInput);

  return (
    <div className={"flex gap-2 pb-3"}>
      <Input
        onChange={(e) => setInput(e.target.value)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
        className={
          "w-full bg-blue-200 rounded-full dark:bg-[#202124] p-0 text-gray-700 dark:text-[#e8eaed] placeholder:text-gray-700 dark:placeholder:text-[#9ba0a5] px-2! py-1/2! text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-[#8ab4f8] focus:border-blue-400 dark:focus:border-[#8ab4f8] transition-all duration-200"
        }
        placeholder="Add classes"
      />
      <button
        onMouseDown={copy}
        type={"button"}
        className={"inline text-gray-400 hover:text-gray-600 dark:text-[#9ba0a5] dark:hover:text-[#e8eaed] transition-colors bg-transparent border-0"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M4.5 18C4.08333 18 3.72933 17.854 3.438 17.562C3.146 17.2707 3 16.9167 3 16.5V5H4.5V16.5H14V18H4.5ZM7.5 15C7.08333 15 6.72933 14.854 6.438 14.562C6.146 14.2707 6 13.9167 6 13.5V3.5C6 3.08333 6.146 2.72933 6.438 2.438C6.72933 2.146 7.08333 2 7.5 2H15.5C15.9167 2 16.2707 2.146 16.562 2.438C16.854 2.72933 17 3.08333 17 3.5V13.5C17 13.9167 16.854 14.2707 16.562 14.562C16.2707 14.854 15.9167 15 15.5 15H7.5ZM7.5 13.5H15.5V3.5H7.5V13.5Z"
            fill="#474747"
          />
        </svg>
      </button>
    </div>
  );
}
