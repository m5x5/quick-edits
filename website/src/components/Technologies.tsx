import {
  IconCode,
  IconCursorText,
  IconEdit,
  IconPointer,
} from "@tabler/icons-react";
import Image from "next/image";

export default function Technologies() {
  return (
    <section
      className="grid grid-cols-full"
      aria-label={"Sektion mit einer Auflistung von Technologien"}
    >
      <div className="col-span-full bg-blue-500 py-7 md:py-12 lg:py-16 hidden">
        <div className="container mx-auto">
          <div className="flex flex-col gap-y-7 md:flex-row">
            <div className="space-y-2 px-4">
              <h2 className="font-bold font-heading text-2xl text-white tracking-tight md:text-5xl/tight">
                Integrate with your favorite editor
              </h2>
              <p className="max-w-[900px] text-white pb-4">
                Quick Edits allows you to reduce the steps it takes to make
                TailwindCSS changes to a website.
              </p>
              <ul>
                <li
                  className={
                    "flex items-center gap-3 rounded-lg py-2 text-white"
                  }
                >
                  <span
                    className={
                      "flex aspect-square h-14 items-center justify-center rounded-full bg-blue-600/50"
                    }
                  >
                    <IconEdit />
                  </span>
                  Speeds up the process of finding HTML elements in your code.
                </li>
                <li
                  className={
                    "flex items-center gap-3 rounded-lg py-2 text-white"
                  }
                >
                  <span
                    className={
                      "flex aspect-square h-14 items-center justify-center rounded-full bg-blue-600/50"
                    }
                  >
                    <IconPointer />
                  </span>
                  Hover over an element an overview of the classes used on it.
                </li>
                <li
                  className={
                    "flex items-center gap-3 rounded-lg py-2 text-white"
                  }
                >
                  <span
                    className={
                      "flex aspect-square h-14 items-center justify-center rounded-full bg-blue-600/50"
                    }
                  >
                    <IconEdit />
                  </span>
                  Add utility classes to the element with a single click. And
                  get a preview of the changes.
                </li>
              </ul>
            </div>
            <div
              className={
                "hidden aspect-square w-full max-w-[40vw] items-center justify-center rounded-2xl bg-white lg:col-span-4"
              }
            >
              <p className="rounded-md border border-gray-500 border-dashed px-4 py-2">
                Hover over me! <IconPointer className="inline w-6" />
              </p>
            </div>
          </div>
        </div>
      </div>
      <div
        className={
          "relative col-span-full gap-4 py-12 container mx-auto px-4 sm:px-6 lg:px-8  grid grid-cols-full"
        }
      >
        <div className="-top-14 absolute" id="process" />

        <h2 className="col-span-12 col-start-2 pb-8 text-center font-bold font-heading text-4xl">
          This is how it works
        </h2>

        <div className={"overflow-hidden rounded-md border border-gray-800 col-start-4 col-span-8 mb-16"}>
          <Image
            src="/home/how-to-use-popup.gif"
            alt={""}
            width={500}
            height={500}
            className="w-full"
          />
        </div>
        <div
          className={
            "col-span-full pb-4 text-center md:col-span-7 md:col-start-1"
          }
        >
          <IconPointer className="mb-2 box-content inline-block rounded-full border-8 border-blue-50 bg-blue-200 p-2 text-blue-500" />
          <h3 className="font-heading font-medium text-xl">
            Find the right element
          </h3>
          <p className="pb-2">
            Press option or alt key and hover over the elements on your website
            of choice.
          </p>
        </div>
        <div className={"col-span-full pb-8 text-center md:col-span-7"}>
          <IconCursorText className="mb-2 box-content inline-block rounded-full border-8 border-blue-50 bg-blue-200 p-2 text-blue-500" />
          <h3 className="font-heading font-medium text-xl">
            Pick the right class
          </h3>
          <p className="pb-2">Test your TailwindCSS classes in record speed.</p>
        </div>
        <div
          className={
            "col-span-full pb-8 text-center md:col-span-8 md:col-start-4"
          }
        >
          <IconCode className="mb-2 box-content inline-block rounded-full border-8 border-blue-50 bg-blue-200 p-2 text-blue-500" />
          <h3 className="mb-2 font-medium font-heading text-xl">
            Find the matching code location
          </h3>
          <p className="pb-2">
            Click one of the direct code links. And you&apos;ll see the exact
            code location in your favorite editor.
          </p>
        </div>
      </div>
    </section >
  );
}
