import Link from "next/link";

export default function Footer () {
  return (
    <footer
      className="flex flex-col gap-2 sm:flex-row justify-center py-6 w-full shrink-0 items-center px-4 md:px-6 border-t dark:border-dark-700 dark:bg-dark-900 bg-white">
      <p className="text-xs text-gray-600 dark:text-gray-400">
        © 2021-2024 Michael Peters. All rights reserved.
      </p>
    </footer>
  )
}