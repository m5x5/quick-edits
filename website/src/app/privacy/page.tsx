import Grid from "@/components/Grid";
import LinkedinIcon from "@/components/LinkedinIcon";
import Technologies from "@/components/Technologies";
import TwitterIcon from "@/components/TwitterIcon";
import NavigationBar from "@/components/navbar/NavigationBar";
import Projects from "@/components/sections/Projects";
import Head from "next/head";
import Link from "next/link";
import Footer from "@/components/Footer";
import type { Metadata } from "next";
import { IconBrandGithub } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Quick Edits - A Developer Utility",
  description: "Quickly locates the code you need to edit. Optimizes the frontend development workflow.",
};

export default function Home() {
  return (
    <>
      <Head key="head">
        <title>Quick Edits - Privacy</title>
        <meta
          name="description"
          content={"Quickly locates the code you need to edit. Optimizes the frontend development workflow."}
        />
      </Head>
      <Grid />
      <div className="fixed inset-0 grid grid-cols-full z-20 pointer-events-none">
        <div className="col-start-[13] flex justify-end">
          <div className="flex flex-col justify-end items-end pb-24 [&>*]:pointer-events-auto">
            <button className="hidden border border-dark-700 p-3 bg-black rounded-md translate-x-1/2">
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
      <div className="flex flex-col min-h-screen relative z-10">
        <NavigationBar />
        <main className="flex-1">
          <section className="w-full py-12 md:pt-24 md:pb-24 lg:py-32 mx-auto grid grid-cols-full grid-flow-col" aria-label={"Hero Sektion"}>
            <div className="col-span-12 col-start-2">
              <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px] w-full">
                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <h1 className="pt-1 text-4xl font-semibold tracking-tight sm:text-5xl xl:text-4xl/none pb-5">
                      This extension does not collect any personal data and will not do so in the foreseeable future.
                    </h1>
                    <p className="!mt-0 max-w-[600px] text-gray-500 md:text-base pb-3">
                      If you clone the repository from GitHub to install the &quot;native search module&quot; be sure to read the privacy policy of GitHub. We are going to let you know if we change our privacy policy.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 min-[400px]:flex-row flex-wrap">
                    <Link
                      className="inline-flex h-10 items-center gap-2 justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
                      href="https://github.com/m5x5/quick-edits"
                      target={"_blank"}
                    >
                      Get it on GitHub <IconBrandGithub />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <Technologies />
          <Projects />
          <section className="w-full py-12 md:py-24 lg:py-32" id="contact" aria-label={"Sektion zu Kontaktmöglichkeiten"}>
            <div className="container px-4 md:px-6 mx-auto">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-medium tracking-tight md:text-4xl/tight">
                    Contact
                  </h2>
                  <p className="max-w-[900px] text-gray-500 lg:text-base/relaxed">
                    Feel free to contact me if you have any questions or feedback.
                  </p>
                </div>
                <div className="mt-6 flex space-x-4">
                  <Link
                    className="text-gray-500 hover:text-gray-900"
                    aria-label={"im neuen Tab in Twitter öffnen"}
                    href="https://twitter.com/m5x5p"
                    target="_blank"
                  >
                    <TwitterIcon className="h-6 w-6" />
                  </Link>
                  <Link
                    className="text-gray-500 hover:text-gray-900"
                    aria-label={"open in a new Tab"}
                    href="https://github.com/m5x5"
                    target="_blank"
                  >
                    <IconBrandGithub className="h-6 w-6" />
                  </Link>
                  <Link
                    className="text-gray-500 hover:text-gray-900"
                    aria-label={"open in a new Tab"}
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
