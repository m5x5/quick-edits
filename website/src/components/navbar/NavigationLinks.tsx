import { IconBrandChrome } from "@tabler/icons-react";
import Link from "next/link";

export default function NavigationLinks() {
  return (
    <>
      <nav className="header -mr-4">
        <Link
          className="px-5 py-3 text-gray-900 hover:text-gray-900"
          href="/docs"
        >
          Setup
        </Link>
        <Link
          className="px-5 py-3 text-gray-900 hover:text-gray-900"
          href="/roadmap"
        >
          Roadmap
        </Link>
      </nav>
      <Link
        className="hidden h-10 items-center justify-center gap-2 rounded-full bg-blue-500 px-8 font-medium text-gray-50 text-sm shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 md:inline-flex"
        href="https://chromewebstore.google.com/detail/quick-edits/bfcjldhcnibiijidbbeddopkpljkahja"
        target={"_blank"}
      >
        Add Chrome Extension <IconBrandChrome />
      </Link>
    </>
  );
}
