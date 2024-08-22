import Footer from "@/components/Footer";
import NavigationBar from "@/components/navbar/NavigationBar";
import type { Metadata } from "next";
import Link from "next/link";
import GithubIcon from "../../components/GithubIcon";
import Grid from "../../components/Grid";
import LinkedinIcon from "../../components/LinkedinIcon";
import TwitterIcon from "../../components/TwitterIcon";

export const metadata = {
  title: "Blog",
  description: "Blog",
  authors: [
    {
      name: "Michael Peters",
      url: "https://mpeters.dev",
    },
  ],
  creator: "Michael Peters",
  publisher: "Michael Peters",
  robots: "index, follow",
  generator: "Next.js",
  keywords: [
    "blog",
    "web development",
    "programming",
    "software development",
    "web entwicklung",
    "web entwickler",
    "devtools",
  ],
  openGraph: {
    type: "website",
    description: "Hier schreibe ich über Webentwicklung und Programmierung",
    locale: "de_DE",
    title: "Michael Peters Blog",
    siteName: "Michael Peters Blog",
  },
} satisfies Metadata;

export default function Home() {
  return (
    <>
      <Grid />
      <div className="fixed inset-0 grid grid-cols-full z-20 pointer-events-none">
        <div className="col-start-[13] flex justify-end">
          <div className="flex flex-col justify-end items-end pb-24 [&>*]:pointer-events-auto">
            <button
              type="button"
              title="Open Menu"
              className="hidden border border-dark-700 p-3 bg-black rounded-md translate-x-1/2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                className="h-7 w-7"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M8 9h8" />
                <path d="M8 13h6" />
                <path d="M9 18h-3a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-3l-3 3l-3 -3z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className="relative z-10 flex min-h-screen flex-col">
        <NavigationBar />
        <main className="flex-1">
          <section className="mx-auto grid w-full grid-flow-col grid-cols-full py-12 md:py-24 lg:py-32">
            <div className="container col-span-12 col-start-2">
              <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none pb-6">
                      Blog
                    </h1>
                    <p className="max-w-[600px] pb-3 text-gray-500">
                      This is where I write about web development and
                      programming.
                    </p>
                  </div>
                  <div className="flex flex-col flex-wrap gap-2 min-[400px]:flex-row">
                    <Link
                      className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
                      href="/blog/latest"
                    >
                      Read latest
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32" id="contact">
            <div className="container px-4 md:px-6 mx-auto">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                    Get in touch
                  </h2>
                  <p className="max-w-[900px] text-gray-500 lg:text-base/relaxed xl:text-xl/relaxed">
                    Reach out to me if you have any questions or just want to
                    say hi.
                  </p>
                </div>
                <div className="mt-6 flex space-x-4">
                  <Link
                    className="text-gray-500 hover:text-gray-900"
                    href="https://twitter.com/m5x5p"
                    target="_blank"
                  >
                    <TwitterIcon className="h-6 w-6" />
                  </Link>
                  <Link
                    className="text-gray-500 hover:text-gray-900"
                    href="https://github.com/m5x5"
                    target="_blank"
                  >
                    <GithubIcon className="h-6 w-6" />
                  </Link>
                  <Link
                    className="text-gray-500 hover:text-gray-900"
                    href="https://www.linkedin.com/in/michael-peters-3985a0223/"
                    target="_blank"
                  >
                    <LinkedinIcon className="h-6 w-6" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
