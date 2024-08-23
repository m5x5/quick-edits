import Footer from "@/components/Footer";
import NavigationBar from "@/components/navbar/NavigationBar";
import {
  IconBrandApple,
  IconBrandChrome,
  IconBrandGithub,
} from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata = {
  title: "Quick Edits Setup",
  description: "How to setup Quick Edits in 15 minutes.",
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

function ArticleHeader2(props: {
  children: React.ReactNode | React.ReactNode[];
  className?: string;
}) {
  return (
    <h2
      className={`pt-8 pb-4 font-bold font-heading text-xl sm:text-3xl ${props.className}`}
    >
      {props.children}
    </h2>
  );
}

function ArticleHeader3(props: {
  children: React.ReactNode | React.ReactNode[];
}) {
  return (
    <h2 className="pt-8 pb-4 font-bold font-heading text-lg sm:text-2xl">
      {props.children}
    </h2>
  );
}

export default function Home() {
  return (
    <>
      <div className="relative z-10 flex min-h-screen flex-col">
        <NavigationBar />
        <main className="flex-1 grid-cols-full pb-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <section className="col-span-12 col-start-2 pt-10">
            <h1 className="pb-12 font-heading font-semibold text-2xl tracking-[-0.04] sm:font-medium sm:text-5xl">
              Setup Quick Edits
            </h1>
            <p className="max-w-[600px] pb-3">
              Quick Edits consists of a Chrome extension and a native search
              module. The Chrome extension is used to show you the info for the
              hovered element and the native search module is used to search for
              files in your projects. The native search module is a Go module
              that is used to search for files in your projects. You can build
              the module by cloning the repository and running the following
              commands.
            </p>
          </section>

          <section className="col-span-12 col-start-2">
            <ArticleHeader2>1. Install the browser extension</ArticleHeader2>
            <p>
              Press on the button below and install the Quick Edits Chrome
              extension from the Chrome Webstore.
            </p>
            <Link
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-blue-500 px-8 font-medium text-gray-50 text-sm shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
              href="https://chromewebstore.google.com/detail/quick-edits/bfcjldhcnibiijidbbeddopkpljkahja"
              target={"_blank"}
            >
              Download in Chrome Webstore <IconBrandChrome stroke={1.5} />
            </Link>
          </section>

          <section className="col-span-12 col-start-2">
            <ArticleHeader2>
              2. Setup Native Search Module{" "}
              <span className="bg-blue-100 rounded-lg inline-flex p-1">
                <IconBrandApple className="inline-block text-blue-600" />
              </span>
            </ArticleHeader2>
            <div className="p-4 mb-4 rounded-2xl inline-block bg-blue-100">
              Currently this guide is only available for macOS users, but I am
              working on adding support for other operating systems.
              <br />
              Check out this issue if you want to help out:{" "}
              <Link
                className="text-blue-500 underline"
                href="https://github.com/m5x5/quick-edits/issues/5"
                target={"_blank"}
              >
                #5
              </Link>
            </div>
            <p className="pb-4">
              The native search module is a Go module that is used to search for
              files in your projects. You can build the module by cloning the
              repository and running the following commands.
            </p>
            <Link
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-blue-500 px-8 font-medium text-gray-50 text-sm shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
              href="https://github.com/m5x5/quick-edits/releases/tag/v0.0.1"
              target={"_blank"}
            >
              Download Binary from GitHub <IconBrandGithub stroke={1.5} />
            </Link>
            <p className="py-4 font-bold">Or</p>
            <div className="overflow-x-auto">
              <code>
                <pre className="inline-block border p-4 text-[0.875rem] whitespace-nowrap">
                  git clone git@github.com:m5x5/quick-edits.git
                  <br />
                  cd native-search
                  <br />
                  go install
                  <br />
                  go build
                  <br />
                </pre>
              </code>
            </div>
          </section>

          <section className="col-span-12 col-start-2">
            <ArticleHeader3>
              2.1. Connect Native Search Module to Chrome Extension
            </ArticleHeader3>
            <div className="overflow-x-auto">
              <code>
                <pre className="text-[0.875rem] whitespace-nowrap">
                  cd /Library/Google/Chrome/NativeMessagingHosts
                  <br />
                  sudo touch com.quick_search.native_search.json
                  <br />
                </pre>
              </code>
            </div>
            <br />
            <div className="overflow-x-auto max-w-full">
              <code>
                <pre className="inline-block border p-4 text-[0.875rem] whitespace-nowrap">
                  &#123;
                  <br />
                  &quot;name&quot;: &quot;com.quick_edits.native_search&quot;,
                  <br />
                  &quot;description&quot;: &quot;Quick Edits&quot;,
                  <br />
                  &quot;path&quot;:
                  &quot;/absolute/path/to/built/go/module/native-search&quot;,
                  <br />
                  &quot;type&quot;: &quot;stdio&quot;,
                  <br />
                  &quot;allowed_origins&quot;:
                  [&quot;chrome-extension://bfcjldhcnibiijidbbeddopkpljkahja/&quot;]
                  <br />
                  &#125;
                </pre>
              </code>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
