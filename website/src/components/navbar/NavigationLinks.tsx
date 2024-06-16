import Link from "next/link";
import {useTranslation} from "next-i18next";
import {IconBrandGithub} from "@tabler/icons-react";

export default function NavigationLinks() {
  return (
    <nav className="header hidden md:flex -mr-4">
      <Link
        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-5 py-3"
        href="/#"
      >
        Home
      </Link>
      <Link
        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-5 py-3"
        href="https://github.com/m5x5"
      >
        <IconBrandGithub />
      </Link>
    </nav>
  );
}
