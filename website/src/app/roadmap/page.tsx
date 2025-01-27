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
			<div className="relative z-10 flex flex-col min-h-screen bg-gradient-to-b from-white to-gray-50">
				<NavigationBar />
				<main className="container mx-auto px-4 py-12 flex-grow">
					<div className="max-w-4xl mx-auto">
						<h1 className="text-5xl font-bold text-gray-900 mb-8">Roadmap</h1>
						<p className="text-lg text-gray-600 mb-12">Explore our journey and upcoming features. We're constantly evolving to make Quick Edits better for you.</p>
						
						<div className="space-y-16">
							<section className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
								<h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
									<span>Near Future</span>
									<span className="text-sm font-normal px-3 py-1 bg-blue-100 text-blue-700 rounded-full">In Progress</span>
								</h2>
								<div className="space-y-6">
									<div className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
										<div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
											<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
											</svg>
										</div>
										<div>
											<Link href="/docs" className="text-lg font-semibold text-blue-600 hover:text-blue-700 transition-colors">
												Onboarding Experience
											</Link>
											<p className="text-gray-600 mt-1">Making it easier for new users to get started with Quick Edits</p>
										</div>
									</div>
									
									<div className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
										<div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0 mt-1">
											<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
											</svg>
										</div>
										<div>
											<h3 className="text-lg font-semibold text-gray-900">Stabilize</h3>
											<p className="text-gray-600 mt-1">Improving stability and performance across all features</p>
										</div>
									</div>

									<div className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
										<div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0 mt-1">
											<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
											</svg>
										</div>
										<div>
											<h3 className="text-lg font-semibold text-gray-900">Improve Code Search Algorithm</h3>
											<p className="text-gray-600 mt-1">Enhanced search capabilities for better code navigation</p>
										</div>
									</div>

									<div className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
										<div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
											<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
											</svg>
										</div>
										<div>
											<h3 className="text-lg font-semibold text-gray-900">Next.js Content Management Features</h3>
											<ul className="mt-2 space-y-2">
												<li className="flex items-center gap-2 text-gray-600">
													<svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
													</svg>
													Smart page detection
												</li>
												<li className="flex items-center gap-2 text-gray-600">
													<svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
													</svg>
													Content block management
												</li>
												<li className="flex items-center gap-2 text-gray-600">
													<svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
													</svg>
													Static site optimization
												</li>
											</ul>
										</div>
									</div>
								</div>
							</section>

							<section className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
								<h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
									<span>Far Future</span>
									<span className="text-sm font-normal px-3 py-1 bg-gray-100 text-gray-700 rounded-full">Planning</span>
									<span className="ml-2">🚀</span>
								</h2>
								<div className="space-y-6">
									<div className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
										<div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-1">
											<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
											</svg>
										</div>
										<div>
											<h3 className="text-lg font-semibold text-gray-900">Framework Specific Search Algorithm Extensions</h3>
											<p className="text-gray-600 mt-1">Specialized search algorithms optimized for different frameworks</p>
										</div>
									</div>

									<div className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
										<div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-1">
											<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
											</svg>
										</div>
										<div>
											<h3 className="text-lg font-semibold text-gray-900">Save Changes from Popup Feature</h3>
											<p className="text-gray-600 mt-1">Quick save functionality directly from the extension popup</p>
										</div>
									</div>
								</div>
							</section>
						</div>
					</div>

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
