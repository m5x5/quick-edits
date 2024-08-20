import type { Meta, StoryObj } from "@storybook/react";
import InspectView from "./InspectView";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Elements/InspectView",
  component: InspectView,
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
} satisfies Meta<typeof InspectView>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    tagName: "div",
    classes: "grid w-full grid-cols-1 gap-12 md:grid-cols-2 lg:gap-6",
  },
};

export const WithAstro: Story = {
  args: {
    tagName: "button",
    classes: "secondary",
    astroResult: {
      file: "path/to/astro/file",
      loc: "1:2",
    },
  },
};
