import Footer from "@/components/Footer";
import Technologies from "@/components/Technologies";
import NavigationBar from "@/components/navbar/NavigationBar";
import { IconRocket } from "@tabler/icons-react";
import type { Metadata } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import InspectionShowCase from "@/components/InspectionShowCase";

export const metadata: Metadata = {
	title: "Quick Edits - A Developer Utility",
	description:
		"Quickly locates the code you need to edit. Optimizes the frontend development workflow.",
};

export default function Home() {
	return (
		<>
			<Head key="head">
				<title>Michael Peters - Web Developer Portfolio</title>
				<meta
					name="description"
					content={
						"Quickly locates the code you need to edit. Optimizes the frontend development workflow."
					}
				/>
			</Head>
			<div className="flex relative z-10 flex-col min-h-screen">
				<NavigationBar />
				<main className="container flex-1">
					<div className="mx-auto">
						<section
							className="pb-12 w-full lg:pb-32"
							aria-label="Hero Section"
						>
							<div className="grid w-full gap-6 lg:gap-12 xl:grid-cols-[1fr_600px]">
								<div className="flex flex-col justify-center space-y-4">
									<div className="space-y-2">
										<h1 className="pb-5 text-4xl font-semibold tracking-tight font-heading sm:text-5xl xl:text-6xl/none text-balance">
											Find and edit your code with{" "}
											<span className="text-blue-500">ease</span>.
										</h1>
										<p className="!mt-0 max-w-[600px] text-black md:text-base pb-3">
											Quick Edits is a powerful developer tool with a DevTools-like interface
											that streamlines TailwindCSS development with smart class management,
											real-time previews, and instant code location.
										</p>
									</div>
									<div className="flex flex-col gap-2 min-[400px]:flex-row flex-wrap">
										<Link
											className="inline-flex gap-2 justify-center items-center px-5 h-10 text-sm font-medium text-gray-900 rounded-full border-2 border-gray-900 shadow transition-colors hover:text-gray-50 hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50"
											href="https://chromewebstore.google.com/detail/quick-edits/bfcjldhcnibiijidbbeddopkpljkahja"
											target="_blank"
											rel="noopener noreferrer"
										>
											Add Chrome Extension
										</Link>
										<Link
											className="inline-flex gap-2 justify-center items-center px-8 h-10 text-sm font-medium text-gray-50 bg-blue-600 rounded-full shadow transition-colors hover:bg-blue-800/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
											href="/docs"
										>
											Get Started
											<IconRocket />
										</Link>
									</div>
								</div>
								<div className="shadow-2xl w-full rounded-2xl overflow-hidden max-w-[1000px] aspect-video mx-auto">
									<Image
										src="/screenshot-quick-edits-page.png"
										alt="Hero Image"
										width={1920}
										height={800}
										layout="responsive"
									/>
								</div>
							</div>
						</section>
					</div>
					<Technologies />
					<InspectionShowCase />
					<section className="container px-4 mx-auto w-full sm:px-6 lg:px-8">
						<h2 className="pb-8 text-4xl font-bold text-center font-heading">
							Integrates with your favorite editor
						</h2>
						<p className="pb-14 text-center">
							Quick Edits currently supports VSCode, PHPStorm, Cursor and Zed.
						</p>
						<ul className="flex gap-8 justify-center pb-24">
							<li>
								<Image
									src="/editors/vscode.png"
									alt="VSCode"
									width={50}
									height={50}
								/>
							</li>
							<li>
								<Image
									src="/editors/zed.png"
									alt="VSCode"
									width={50}
									height={50}
								/>
							</li>
							<li>
								<Image
									src="/editors/phpstorm.png"
									alt="VSCode"
									width={50}
									height={50}
								/>
							</li>
						</ul>
					</section>
					<div className="container px-4 mx-auto sm:px-6 lg:px-8">
						<svg
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							width="112"
							height="6"
							viewBox="0 0 112 6"
							fill="none"
							className="mx-auto text-blue-500"
						>
							<path
								d="M9.24865 1.40299C11.1861 -0.467666 14.2571 -0.467663 16.1946 1.40299L17.8878 3.03785C19.0503 4.16024 20.8929 4.16024 22.0554 3.03785L23.777 1.403C25.7145 -0.467659 28.7855 -0.467659 30.723 1.403L32.4162 3.03785C33.5787 4.16025 35.4213 4.16025 36.5838 3.03785L38.277 1.403C40.2145 -0.467659 43.2855 -0.467656 45.223 1.403L46.9162 3.03786C48.0787 4.16025 49.9213 4.16025 51.0838 3.03786L52.7552 1.42402C52.7592 1.42024 52.7593 1.414 52.7555 1.41009C52.7517 1.40617 52.7519 1.39989 52.7558 1.39612C54.6936 -0.467659 57.7595 -0.465367 59.6946 1.403L61.3878 3.03785C62.5503 4.16025 64.3929 4.16025 65.5554 3.03785L67.2486 1.403C69.1861 -0.467662 72.2571 -0.467659 74.1946 1.403L75.8878 3.03785C77.0503 4.16025 78.8929 4.16025 80.0554 3.03785L81.777 1.403C83.7145 -0.467655 86.7855 -0.467655 88.723 1.403L90.4162 3.03786C91.5787 4.16025 93.4213 4.16025 94.5838 3.03786L96.277 1.403C98.2145 -0.467655 101.285 -0.467652 103.223 1.403L104.916 3.03786C106.079 4.16025 107.921 4.16025 109.084 3.03786L110.058 2.0976C110.455 1.71398 111.088 1.72509 111.472 2.1224C111.855 2.51972 111.844 3.15279 111.447 3.5364L110.473 4.47666C108.535 6.34732 105.464 6.34732 103.527 4.47666L101.834 2.84181C100.671 1.71941 98.8287 1.71941 97.6662 2.8418L95.973 4.47666C94.0355 6.34732 90.9645 6.34732 89.027 4.47666L87.3338 2.8418C86.1713 1.71941 84.3287 1.71941 83.1662 2.8418L81.4446 4.47666C79.5071 6.34731 76.4361 6.34731 74.4986 4.47666L72.8054 2.8418C71.6429 1.71941 69.8003 1.7194 68.6378 2.8418L66.9446 4.47665C65.0071 6.34731 61.9361 6.34731 59.9986 4.47665L58.3054 2.8418C57.1502 1.72643 55.3234 1.71945 54.1598 2.82085C54.1558 2.82459 54.1556 2.83085 54.1594 2.83476C54.1632 2.83865 54.1631 2.84485 54.1592 2.8486L52.473 4.47666C50.5355 6.34732 47.4645 6.34732 45.527 4.47666L43.8338 2.8418C42.6713 1.71941 40.8287 1.71941 39.6662 2.8418L37.973 4.47666C36.0355 6.34731 32.9645 6.34731 31.027 4.47666L29.3338 2.8418C28.1713 1.71941 26.3287 1.71941 25.1662 2.8418L23.4446 4.47665C21.5071 6.34731 18.4361 6.34731 16.4986 4.47665L14.8054 2.8418C13.6429 1.7194 11.8003 1.7194 10.6378 2.84179L8.94459 4.47665C7.00713 6.34731 3.93611 6.34731 1.99865 4.47665L1.02481 3.53639C0.627491 3.15278 0.616384 2.51971 0.999998 2.12239C1.38361 1.72508 2.01668 1.71397 2.41399 2.09759L3.38784 3.03785C4.55032 4.16024 6.39292 4.16024 7.5554 3.03785L9.24865 1.40299Z"
								fill="currentColor"
							/>
						</svg>
						<section
							className="py-12 w-full md:py-24 lg:py-32"
							id="contact"
							aria-label="Contact Section"
						>
							<div className="container px-4 mx-auto md:px-6">
								<div className="flex flex-col justify-center items-center space-y-4 text-center">
									<div className="space-y-2">
										<h2 className="text-3xl font-medium tracking-tight font-heading md:text-4xl/tight">
											Try it yourself
										</h2>
										<p className="max-w-[900px] text-gray-500 lg:text-base/relaxed">
											Quick Edits is still in its early stages but I&apos;m sure
											you&apos;ll find it useful.
										</p>
									</div>
									<Link
										className="inline-flex gap-2 justify-center items-center px-8 h-10 text-sm font-medium text-gray-50 bg-gray-900 rounded-md shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50"
										href="/docs"
										rel="noopener noreferrer"
									>
										Get Started
									</Link>
								</div>
							</div>
						</section>
					</div>
				</main>
			</div>
			<Footer />
		</>
	);
}
