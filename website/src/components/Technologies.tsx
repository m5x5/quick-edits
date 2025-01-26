import {
	IconCode,
	IconCursorText,
	IconEdit,
	IconPointer,
	IconBolt,
	IconDeviceLaptop,
} from "@tabler/icons-react";
import Image from "next/image";

export default function Technologies() {
	return (
		<section className="overflow-hidden relative bg-gradient-to-b from-blue-50 to-white">
			{/* Hero Section */}
			<div className="relative z-10 px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8 lg:py-24">
				<div className="grid grid-cols-1 gap-12 items-center lg:grid-cols-2">
					<div className="max-w-2xl">
						<h2 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 font-heading sm:text-5xl">
							Powerful Features for Modern Development
						</h2>
						<p className="mb-8 text-lg text-gray-600">
							Streamline your development workflow with our intuitive tools and features designed for modern web development.
						</p>
						<div className="grid gap-6 sm:grid-cols-2">
							<div className="flex gap-4 items-start">
								<div className="flex-shrink-0">
									<div className="flex justify-center items-center w-12 h-12 text-white bg-blue-600 rounded-lg">
										<IconBolt className="w-6 h-6" />
									</div>
								</div>
								<div>
									<h3 className="mb-2 text-lg font-semibold text-gray-900">Lightning Fast</h3>
									<p className="text-gray-600">Real-time updates and instant class previews for rapid development.</p>
								</div>
							</div>
							<div className="flex gap-4 items-start">
								<div className="flex-shrink-0">
									<div className="flex justify-center items-center w-12 h-12 text-white bg-blue-600 rounded-lg">
										<IconDeviceLaptop className="w-6 h-6" />
									</div>
								</div>
								<div>
									<h3 className="mb-2 text-lg font-semibold text-gray-900">Cross-Editor Support</h3>
									<p className="text-gray-600">Works seamlessly with your favorite code editor.</p>
								</div>
							</div>
							<div className="flex gap-4 items-start">
								<div className="flex-shrink-0">
									<div className="flex justify-center items-center w-12 h-12 text-white bg-blue-600 rounded-lg">
										<IconEdit className="w-6 h-6" />
									</div>
								</div>
								<div>
									<h3 className="mb-2 text-lg font-semibold text-gray-900">Smart Editing</h3>
									<p className="text-gray-600">Intelligent class suggestions and management tools.</p>
								</div>
							</div>
							<div className="flex gap-4 items-start">
								<div className="flex-shrink-0">
									<div className="flex justify-center items-center w-12 h-12 text-white bg-blue-600 rounded-lg">
										<IconPointer className="w-6 h-6" />
									</div>
								</div>
								<div>
									<h3 className="mb-2 text-lg font-semibold text-gray-900">Intuitive Interface</h3>
									<p className="text-gray-600">DevTools-like experience for seamless workflow.</p>
								</div>
							</div>
						</div>
					</div>
					<div className="hidden relative lg:block">
						<Image
							src="/quick-edits-tool.png"
							alt="Quick Edits Tool Interface"
							width={600}
							height={400}
							className="rounded-lg shadow-xl"
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
