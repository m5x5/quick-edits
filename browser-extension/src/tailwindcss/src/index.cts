import postcssPlugin, * as tailwindcss from "./index.js";

// This file exists so that `index.ts` can be written one time but be
// compatible with both CJS and ESM. Without it we get a `.default` export when
// using `require` in CJS.

for (const key in tailwindcss) {
	if (key === "default") continue;
	// @ts-ignore
	postcssPlugin[key] = tailwindcss[key];
}

// @ts-ignore
export = postcssPlugin;
