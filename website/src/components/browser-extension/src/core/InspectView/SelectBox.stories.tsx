import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import SelectBox from "./SelectBox";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
	title: "Elements/SelectBox",
	component: SelectBox,
	parameters: {
		// Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
		layout: "centered",
	},
	// This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
	tags: ["autodocs"],
	// More on argTypes: https://storybook.js.org/docs/api/argtypes
	argTypes: {
		// backgroundColor: { control: "color" },
	},
	// Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
	// args: { onClick: fn() },
} satisfies Meta<typeof SelectBox>;

export default meta;
type Story = StoryObj<typeof meta>;

const storybookRoot = document.getElementById("storybook-root");

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const WithWidthAndHeightOnly: Story = {
	args: {
		target: null as any as HTMLElement,
	},
	render: () => {
		let div = document.getElementById("example-div");

		if (!div) {
			div = document.createElement("div");
		}

		div.id = "example-div";
		div.style.width = "100px";
		div.style.height = "100px";
		div.style.backgroundColor = "#999";
		document.body.appendChild(div);

		return <SelectBox target={div} />;
	},
};

export const WithVerticalPadding: Story = {
	args: {
		target: null as any as HTMLElement,
	},
	render: () => {
		let divWithPadding = document.getElementById("example-div");
		if (!divWithPadding) {
			divWithPadding = document.createElement("div");
		}

		divWithPadding.id = "example-div";
		divWithPadding.style.width = "100px";
		divWithPadding.style.height = "100px";
		divWithPadding.style.backgroundColor = "#999";
		divWithPadding.style.paddingBottom = "10px";
		divWithPadding.style.paddingTop = "10px";
		document.body.appendChild(divWithPadding);

		return <SelectBox target={divWithPadding} />;
	},
};
export const WithPadding: Story = {
	args: {
		target: null as any as HTMLElement,
	},
	render: () => {
		let divWithPadding = document.getElementById("example-div");
		if (!divWithPadding) {
			divWithPadding = document.createElement("div");
		}

		divWithPadding.id = "example-div";
		divWithPadding.style.width = "100px";
		divWithPadding.style.height = "100px";
		divWithPadding.style.backgroundColor = "#999";
		divWithPadding.style.paddingBottom = "10px";
		divWithPadding.style.paddingTop = "10px";
		divWithPadding.style.paddingLeft = "10px";
		divWithPadding.style.paddingRight = "10px";
		document.body.appendChild(divWithPadding);

		return <SelectBox target={divWithPadding} />;
	},
};
