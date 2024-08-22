import Footer from "@/components/Footer";
import NavigationBar from "@/components/navbar/NavigationBar";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata = {
  title: "Quick Edits Roadmap",
  description: "See what's coming next for Quick Edits",
  authors: [
    {
      name: "Michael Peters",
      url: "https://mpeters.dev",
    },
  ],
  creator: "Quick Edits",
  publisher: "Quick Edits",
  robots: "index, follow",
  generator: "Next.js",
  keywords: [
    "quick edits",
    "roadmap",
    "quick edits roadmap",
    "quick edits features",
    "quick edits updates",
  ],
  openGraph: {
    type: "website",
    description: "See what's coming next for Quick Edits",
    locale: "en_US",
    title: "Quick Edits Roadmap",
    siteName: "Quick Edits",
  },
} satisfies Metadata;

function ArticleHeader2(props: {
  children: React.ReactNode | React.ReactNode[];
}) {
  return (
    <h2 className="pt-8 pb-4 font-bold font-heading text-3xl">
      {props.children}
    </h2>
  );
}

function ArticleHeader3(props: {
  children: React.ReactNode | React.ReactNode[];
}) {
  return (
    <h2 className="pt-8 pb-4 font-bold font-heading text-2xl">
      {props.children}
    </h2>
  );
}

export default function Home() {
  return (
    <>
      <div className="relative z-10 flex min-h-screen flex-col">
        <NavigationBar />
        <main className="flex-1 pb-10 container px-4 sm:px-6 lg:px-8 mx-auto">
          <section className="pt-10">
            <h1 className="pb-12 font-heading font-semibold text-3xl tracking-[-0.04] sm:font-medium sm:text-5xl">
              Roadmap
            </h1>
            <div className="max-w-[600px] pb-3">
              <b className="inline-block py-2">Near Future</b>
              <ul className="list-disc pb-2 pl-5">
                <li>
                  Optimize{" "}
                  <Link href="/docs" className="text-blue-600 underline">
                    Onboarding Experience
                  </Link>
                </li>
                <li>Stabilize</li>
                <li>Improve Code Search Algorithm</li>
              </ul>
              <b className="inline-block py-2">Far Future 🚀</b>
              <ul className="list-disc pb-2 pl-5">
                <li>Add Framework Specific Search Algorithm Extensions</li>
                <li>Add Save Changes from Popup Feature</li>
              </ul>
            </div>
          </section>

          <section className="col-span-12 col-start-2 hidden">
            <ArticleHeader2>1. Optimize Onboarding Experience</ArticleHeader2>
            <p>Press</p>
          </section>

          <section className="col-span-12 col-start-2 hidden">
            <ArticleHeader2>2. Setup Native Search Module</ArticleHeader2>
            <p className="pb-4">
              The native search module is a Go module that is used to search for
              files in your projects. You can build the module by cloning the
              repository and running the following commands.
            </p>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
