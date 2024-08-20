import Image from "next/image";

export default function Projects() {
  return (
    <section className="hidden w-full grid-cols-full py-12 md:py-24 lg:py-32" id="projects" aria-label={"Sektion mit meinen Projekten"}>
      <div className="col-span-12 col-start-2 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="space-y-2 text-center">
            <h2 className="font-bold font-heading text-3xl tracking-tight md:text-4xl/tight">
              Built with Quick Edits
            </h2>
            <p className="max-w-[900px] pb-5 font-medium text-gray-500 md:text-base/relaxed">
              Feel free to also submit your project if you built it with Quick Edits.
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-12 md:grid-cols-2 md:gap-6">
            <a
              className="flex flex-col space-y-2"
              href="https://mpeters.dev"
            >
              <Image
                alt="Quick Edits"
                className="mx-auto aspect-video object-cover object-center"
                height="310"
                src="/og-image-en.png"
                width="550"
              />
              <h3 className="text-3xl font-heading font-medium">mpeters.dev</h3>
              <p className="text-gray-600">
                A personal website built with Next.js and Tailwind CSS.
              </p>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
