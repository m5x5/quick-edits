import Image from "next/image";

export default function Projects() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 grid grid-cols-full" id="projects" aria-label={"Sektion mit meinen Projekten"}>
      <div className="mx-auto col-start-2 col-span-12">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
              Projekte
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl/tight">
              Built with Quick Edits
            </h2>
            <p className="max-w-[900px] text-gray-500 md:text-base/relaxed dark:text-gray-400 pb-5">
              Feel free to also submit your project if you built it with quick edits.
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-12 md:grid-cols-2 md:gap-6">
            <a
              className="flex flex-col space-y-2"
              href="https://sourcesync.vercel.app"
            >
              <Image
                alt="Project 1"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center border border-gray-800"
                height="310"
                src="/sourcesync-banner.svg"
                width="550"
              />
              <h3 className="text-xl font-semibold">SourceSync</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tool to bidirectionally sync changes in CSS files between
                browser&apos;s DevTools and Sass/PostCSS/etc sources
              </p>
            </a>
            <div className="flex flex-col space-y-2">
              <Image
                alt="Quick Edits"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center"
                height="310"
                src="/placeholder.svg"
                width="550"
              />
              <h3 className="text-xl font-semibold">Quick Edits</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Coming soon :)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
