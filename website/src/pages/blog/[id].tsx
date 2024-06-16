import GithubIcon from "@/components/GithubIcon";
import Grid from "@/components/Grid";
import LinkedinIcon from "@/components/LinkedinIcon";
import TwitterIcon from "@/components/TwitterIcon";
import NavigationBar from "@/components/navbar/NavigationBar";
import { getAllPostIds, getPostData } from "@/lib/blog";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import Link from "next/link";
import Footer from "@/components/Footer";

export async function getStaticProps({
  params,
  locale,
}: {
  params: { id: string };
  locale: string;
}) {
  const postData = await getPostData(params.id);

  return {
    props: {
      postData,
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}

export async function getStaticPaths() {
  const paths = getAllPostIds();

  return {
    paths,
    fallback: false,
  };
}

export default function Post({ postData }: { postData: any }) {
  const { t } = useTranslation("common");
  return (
    <>
      <Head>
        <title>{postData.title}</title>
        <meta
          name="description"
          content={"Michael Peters | " + postData.description}
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
          <section className="w-full py-12 md:pt-24 lg:py-32 mx-auto grid grid-cols-full grid-flow-col">
            <div className="container col-span-12 col-start-2">
              <div className="grid gap-6 lg:grid-cols-[1fr_200px] lg:gap-12 xl:grid-cols-[1fr_600px]">
                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none pb-6">
                      {postData.title}
                    </h1>
                    <p className="max-w-[600px] text-gray-600 dark:text-gray-400">
                      {postData.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section
            className="w-full py-12 md:py-24 lg:py-20 mx-auto grid grid-cols-full"
            id="projects"
          >
            <nav className="col-start-2 col-span-12 pb-24">
              <h2 className="text-2xl font-bold">{t("outline")}</h2>
              <ul>
                {postData.outline.map((item: any, index: number) => (
                  <li key={index} className="flex flex-col space-y-4">
                    <a className="" href={"#" + item}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mx-auto col-start-2 col-span-12">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <article>
                  <div
                    dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
                  />
                </article>
              </div>
            </div>
          </section>
          <section className="w-full flex-col">
            <div className="gradient-highlight"></div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32" id="contact">
            <div className="container px-4 md:px-6 mx-auto">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                    {t("contact.title")}
                  </h2>
                  <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    {t("contact.description")}
                  </p>
                </div>
                <div className="mt-6 flex space-x-4">
                  <Link
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    href="https://twitter.com/m5x5p"
                    target="_blank"
                  >
                    <TwitterIcon className="h-6 w-6" />
                  </Link>
                  <Link
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    href="https://github.com/m5x5"
                    target="_blank"
                  >
                    <GithubIcon className="h-6 w-6" />
                  </Link>
                  <Link
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
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
