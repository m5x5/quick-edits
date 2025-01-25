import type { Config } from "tailwindcss";

const config: Config = {
	plugins: [require("@tailwindcss/typography")],
	theme: {
		extend: {
			container: {
				center: true
			}
		}
	}
}
export default config;
