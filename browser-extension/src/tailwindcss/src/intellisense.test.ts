import { expect, test } from "vitest";
import { __unstable__loadDesignSystem } from ".";
import { buildDesignSystem } from "./design-system";
import plugin from "./plugin";
import { Theme } from "./theme";

const css = String.raw;

function loadDesignSystem() {
	const theme = new Theme();
	theme.add("--colors-red-500", "red");
	theme.add("--colors-blue-500", "blue");
	theme.add("--breakpoint-sm", "640px");
	theme.add("--aspect-video", "16 / 9");
	theme.add("--font-sans", "sans-serif");
	theme.add("--font-weight-superbold", "900");
	theme.add("--text-xs", "0.75rem");
	theme.add("--text-xs--line-height", "1rem");
	theme.add("--perspective-dramatic", "100px");
	theme.add("--perspective-normal", "500px");
	theme.add("--opacity-background", "0.3");
	theme.add("--drop-shadow-sm", "0 1px 1px rgb(0 0 0 / 0.05)");
	theme.add("--inset-shadow-sm", "inset 0 1px 1px rgb(0 0 0 / 0.05)");
	return buildDesignSystem(theme);
}

test("getClassList", () => {
	const design = loadDesignSystem();
	const classList = design.getClassList();
	const classNames = classList.flatMap(([name, meta]) => [
		name,
		...meta.modifiers.map((m) => `${name}/${m}`),
	]);

	expect(classNames).toMatchSnapshot();
});

test("Theme values with underscores are converted back to decimal points", () => {
	const design = loadDesignSystem();
	const classes = design.getClassList();

	expect(classes).toContainEqual(["inset-0.5", { modifiers: [] }]);
});

test("getVariants", () => {
	const design = loadDesignSystem();
	const variants = design.getVariants();

	expect(variants).toMatchSnapshot();
});

test("getVariants compound", () => {
	const design = loadDesignSystem();
	const variants = design.getVariants();
	const group = variants.find((v) => v.name === "group")!;

	const list = [
		// A selector-based variant
		group.selectors({ value: "hover" }),

		// A selector-based variant with a modifier
		group.selectors({ value: "hover", modifier: "sidebar" }),

		// A nested, compound, selector-based variant
		group.selectors({ value: "group-hover" }),

		// This variant produced an at rule
		group.selectors({ value: "sm" }),

		// This variant does not exist
		group.selectors({ value: "md" }),
	];

	expect(list).toEqual([
		["@media (hover: hover) { &:is(:where(.group):hover *) }"],
		["@media (hover: hover) { &:is(:where(.group\\/sidebar):hover *) }"],
		[
			"@media (hover: hover) { &:is(:where(.group):is(:where(.group):hover *) *) }",
		],
		[],
		[],
	]);
});

test("variant selectors are in the correct order", async () => {
	const input = css`
    @custom-variant overactive {
      &:hover {
        @media (hover: hover) {
          &:focus {
            &:active {
              @slot;
            }
          }
        }
      }
    }
  `;

	const design = await __unstable__loadDesignSystem(input);
	const variants = design.getVariants();
	const overactive = variants.find((v) => v.name === "overactive")!;

	expect(overactive).toBeTruthy();
	expect(overactive.selectors({})).toMatchInlineSnapshot(`
    [
      "@media (hover: hover) { &:hover { &:focus { &:active } } }",
    ]
  `);
});

test("The variant `has-force` does not crash", () => {
	const design = loadDesignSystem();
	const variants = design.getVariants();
	const has = variants.find((v) => v.name === "has")!;

	expect(has.selectors({ value: "force" })).toMatchInlineSnapshot(`[]`);
});

test("Can produce CSS per candidate using `candidatesToCss`", () => {
	const design = loadDesignSystem();
	design.invalidCandidates = new Set(["bg-[#fff]"]);

	expect(
		design.candidatesToCss([
			"underline",
			"i-dont-exist",
			"bg-[#fff]",
			"bg-[#000]",
			"text-xs",
		]),
	).toMatchInlineSnapshot(`
      [
        ".underline {
        text-decoration-line: underline;
      }
      ",
        null,
        null,
        ".bg-\\[\\#000\\] {
        background-color: #000;
      }
      ",
        ".text-xs {
        font-size: var(--text-xs);
        line-height: var(--tw-leading, var(--text-xs--line-height));
      }
      ",
      ]
    `);
});

test("Utilities do not show wrapping selector in intellisense", async () => {
	const input = css`
    @import 'tailwindcss/utilities';
    @config './config.js';
  `;

	const design = await __unstable__loadDesignSystem(input, {
		loadStylesheet: async (_, base) => ({
			base,
			content: "@tailwind utilities;",
		}),
		loadModule: async () => ({
			base: "",
			module: {
				important: "#app",
			},
		}),
	});

	expect(
		design.candidatesToCss(["underline", "hover:line-through"]),
	).toMatchInlineSnapshot(`
    [
      ".underline {
      text-decoration-line: underline;
    }
    ",
      ".hover\\:line-through {
      &:hover {
        @media (hover: hover) {
          text-decoration-line: line-through;
        }
      }
    }
    ",
    ]
  `);
});

test("Utilities, when marked as important, show as important in intellisense", async () => {
	const input = css`
    @import 'tailwindcss/utilities' important;
  `;

	const design = await __unstable__loadDesignSystem(input, {
		loadStylesheet: async (_, base) => ({
			base,
			content: "@tailwind utilities;",
		}),
	});

	expect(
		design.candidatesToCss(["underline", "hover:line-through"]),
	).toMatchInlineSnapshot(`
    [
      ".underline {
      text-decoration-line: underline !important;
    }
    ",
      ".hover\\:line-through {
      &:hover {
        @media (hover: hover) {
          text-decoration-line: line-through !important;
        }
      }
    }
    ",
    ]
  `);
});

test("Static utilities from plugins are listed in hovers and completions", async () => {
	const input = css`
    @import 'tailwindcss/utilities';
    @plugin "./plugin.js"l;
  `;

	const design = await __unstable__loadDesignSystem(input, {
		loadStylesheet: async (_, base) => ({
			base,
			content: "@tailwind utilities;",
		}),
		loadModule: async () => ({
			base: "",
			module: plugin(({ addUtilities }) => {
				addUtilities({
					".custom-utility": {
						color: "red",
					},
				});
			}),
		}),
	});

	expect(design.candidatesToCss(["custom-utility"])).toMatchInlineSnapshot(`
    [
      ".custom-utility {
      color: red;
    }
    ",
    ]
  `);

	expect(design.getClassList().map((entry) => entry[0])).toContain(
		"custom-utility",
	);
});

test("Functional utilities from plugins are listed in hovers and completions", async () => {
	const input = css`
    @import 'tailwindcss/utilities';
    @plugin "./plugin.js"l;
  `;

	const design = await __unstable__loadDesignSystem(input, {
		loadStylesheet: async (_, base) => ({
			base,
			content: "@tailwind utilities;",
		}),
		loadModule: async () => ({
			base: "",
			module: plugin(({ matchUtilities }) => {
				matchUtilities(
					{
						"custom-1": (value) => ({
							color: value,
						}),
					},
					{
						values: {
							red: "#ff0000",
							green: "#ff0000",
						},
					},
				);

				matchUtilities(
					{
						"custom-2": (value, { modifier }) => ({
							color: `${value} / ${modifier ?? "0%"}`,
						}),
					},
					{
						values: {
							red: "#ff0000",
							green: "#ff0000",
						},
						modifiers: {
							"50": "50%",
							"75": "75%",
						},
					},
				);

				matchUtilities(
					{
						"custom-3": (value, { modifier }) => ({
							color: `${value} / ${modifier ?? "0%"}`,
						}),
					},
					{
						values: {
							red: "#ff0000",
							green: "#ff0000",
						},
						modifiers: "any",
					},
				);
			}),
		}),
	});

	expect(
		design.candidatesToCss([
			"custom-1-red",
			"custom-1-green",
			"custom-1-unknown",
		]),
	).toMatchInlineSnapshot(`
    [
      ".custom-1-red {
      color: #ff0000;
    }
    ",
      ".custom-1-green {
      color: #ff0000;
    }
    ",
      null,
    ]
  `);

	expect(
		design.candidatesToCss([
			"custom-2-red",
			"custom-2-green",
			"custom-2-unknown",
		]),
	).toMatchInlineSnapshot(`
    [
      ".custom-2-red {
      color: #ff0000 / 0%;
    }
    ",
      ".custom-2-green {
      color: #ff0000 / 0%;
    }
    ",
      null,
    ]
  `);

	expect(
		design.candidatesToCss([
			"custom-2-red/50",
			"custom-2-red/75",
			"custom-2-red/unknown",
		]),
	).toMatchInlineSnapshot(`
    [
      ".custom-2-red\\/50 {
      color: #ff0000 / 50%;
    }
    ",
      ".custom-2-red\\/75 {
      color: #ff0000 / 75%;
    }
    ",
      null,
    ]
  `);

	const classMap = new Map(design.getClassList());
	const classNames = Array.from(classMap.keys());

	// matchUtilities without modifiers
	expect(classNames).toContain("custom-1-red");
	expect(classMap.get("custom-1-red")?.modifiers).toEqual([]);

	expect(classNames).toContain("custom-1-green");
	expect(classMap.get("custom-1-green")?.modifiers).toEqual([]);

	expect(classNames).not.toContain("custom-1-unknown");

	// matchUtilities with a set list of modifiers
	expect(classNames).toContain("custom-2-red");
	expect(classMap.get("custom-2-red")?.modifiers).toEqual(["50", "75"]);

	expect(classNames).toContain("custom-2-green");
	expect(classMap.get("custom-2-green")?.modifiers).toEqual(["50", "75"]);

	expect(classNames).not.toContain("custom-2-unknown");

	// matchUtilities with any modifiers
	expect(classNames).toContain("custom-3-red");
	expect(classMap.get("custom-3-red")?.modifiers).toEqual([]);

	expect(classNames).toContain("custom-3-green");
	expect(classMap.get("custom-3-green")?.modifiers).toEqual([]);

	expect(classNames).not.toContain("custom-3-unknown");
});

test("Custom at-rule variants do not show up as a value under `group`", async () => {
	const input = css`
    @import 'tailwindcss/utilities';
    @custom-variant variant-1 (@media foo);
    @custom-variant variant-2 {
      @media bar {
        @slot;
      }
    }
    @plugin "./plugin.js";
  `;

	const design = await __unstable__loadDesignSystem(input, {
		loadStylesheet: async (_, base) => ({
			base,
			content: "@tailwind utilities;",
		}),
		loadModule: async () => ({
			base: "",
			module: plugin(({ addVariant }) => {
				addVariant("variant-3", "@media baz");
				addVariant("variant-4", ["@media qux", "@media cat"]);
			}),
		}),
	});

	const variants = design.getVariants();
	const v1 = variants.find((v) => v.name === "variant-1")!;
	const v2 = variants.find((v) => v.name === "variant-2")!;
	const v3 = variants.find((v) => v.name === "variant-3")!;
	const v4 = variants.find((v) => v.name === "variant-4")!;
	const group = variants.find((v) => v.name === "group")!;
	const not = variants.find((v) => v.name === "not")!;

	// All the variants should exist
	expect(v1).not.toBeUndefined();
	expect(v2).not.toBeUndefined();
	expect(v3).not.toBeUndefined();
	expect(v4).not.toBeUndefined();
	expect(group).not.toBeUndefined();
	expect(not).not.toBeUndefined();

	// Group should not have variant-1, variant-2, or variant-3
	expect(group.values).not.toContain("variant-1");
	expect(group.values).not.toContain("variant-2");
	expect(group.values).not.toContain("variant-3");
	expect(group.values).not.toContain("variant-4");

	// Not should have variant-1, variant-2, or variant-3
	expect(not.values).toContain("variant-1");
	expect(not.values).toContain("variant-2");
	expect(not.values).toContain("variant-3");
	expect(not.values).toContain("variant-4");
});

test("Custom functional @utility", async () => {
	const input = css`
    @import 'tailwindcss/utilities';

    @theme reference {
      --tab-size-1: 1;
      --tab-size-2: 2;
      --tab-size-4: 4;
      --tab-size-github: 8;

      --text-xs: 0.75rem;
      --text-xs--line-height: calc(1 / 0.75);

      --leading-foo: 1.5;
      --leading-bar: 2;
    }

    @utility tab-* {
      tab-size: --value(--tab-size);
    }

    @utility example-* {
      font-size: --value(--text);
      line-height: --value(--text- * --line-height);
      line-height: --modifier(--leading);
    }

    @utility -negative-* {
      margin: --value(--tab-size- *);
    }
  `;

	const design = await __unstable__loadDesignSystem(input, {
		loadStylesheet: async (_, base) => ({
			base,
			content: "@tailwind utilities;",
		}),
	});

	const classMap = new Map(design.getClassList());
	const classNames = Array.from(classMap.keys());

	expect(classNames).toContain("tab-1");
	expect(classNames).toContain("tab-2");
	expect(classNames).toContain("tab-4");
	expect(classNames).toContain("tab-github");

	expect(classNames).not.toContain("-tab-1");
	expect(classNames).not.toContain("-tab-2");
	expect(classNames).not.toContain("-tab-4");
	expect(classNames).not.toContain("-tab-github");

	expect(classNames).toContain("-negative-1");
	expect(classNames).toContain("-negative-2");
	expect(classNames).toContain("-negative-4");
	expect(classNames).toContain("-negative-github");

	expect(classNames).not.toContain("--negative-1");
	expect(classNames).not.toContain("--negative-2");
	expect(classNames).not.toContain("--negative-4");
	expect(classNames).not.toContain("--negative-github");

	expect(classNames).toContain("example-xs");
	expect(classMap.get("example-xs")?.modifiers).toEqual(["foo", "bar"]);
});
