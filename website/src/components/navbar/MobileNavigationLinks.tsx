import Link from "next/link";
import {useTranslation} from "next-i18next";

export default function MobileNavigationLinks () {
  const {t} = useTranslation("common");
return (
<>
  <Link
    className="text-gray-600 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white px-9 py-3"
    href="/#"
  >
    {t("navigation.skills")}
  </Link>
  <Link
    className="text-gray-600 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white px-9 py-3"
    href="/#projects"
  >
    {t("navigation.projects")}
  </Link>
  <Link
    className="text-gray-600 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white px-9 py-3"
    href="/#contact"
  >
    {t("navigation.contact")}
  </Link>
  <Link
    className="text-gray-600 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white px-9 py-3"
    href="/blog"
  >
    {t("navigation.blog")}
  </Link>
</>
)
}