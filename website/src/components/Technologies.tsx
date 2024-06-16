import quickEditImage from '../app/quickly-find-classes-and-locations-in-code-with-quick-edits.png';
import Image from "next/image";

export default function Technologies() {
  return (
    <section className="grid grid-cols-full" aria-label={"Sektion mit einer Auflistung von Technologien"}>
      <div className="py-7 md:py-12 lg:py-16 col-start-2 col-span-12 dark:bg-dark-800 bg-white rounded-md border dark:border-dark-700 dark:border-dark-100">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center text-center gap-y-7">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight md:text-4xl/tight">
                Features
              </h2>
              <p className="max-w-[900px]">
                Quick Edits allows you to reduce the steps it takes to make TailwindCSS changes to a website.
              </p>
            </div>
            <div className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6 text-left">

              <p className={"lg:col-span-2 flex justify-center items-center"}>
                <ul className={"list-disc list-inside pl-4"}>
                  <li>Quick Edits find&apos;s the files you need!</li>
                  <li>It also shows you the classes used on a component</li>
                  <li>It allows you to add utility classes quickly</li>
                </ul>

              </p>
              <div className={"lg:col-span-2"}>
              <div className={"border rounded-md border-gray-800 overflow-hidden"}>
                  <Image src={quickEditImage} alt={""}/>
                </div>
                <p className={"text-sm text-gray-400 pl-2 pt-2"}>A screenshot of the quick edits tool opening after holding &quot;option&quot; and hovering over an
                  element</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
