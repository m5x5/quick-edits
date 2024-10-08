import type { Metadata } from "next";
import "./globals.css";
import { CSPostHogProvider } from "./providers";

export const metadata: Metadata = {
	title: "Michael Peters - Web Developer Portfolio",
	description:
		"Ich bin ein Web Entwickler und fasziniere mich für Optimierung und Automatisierung. Ich habe Spaß an einer sauberen und guten Umsetzung.",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="de">
			<head>
				<meta name="theme-color" content="#ffffff" />
			</head>
			<CSPostHogProvider>
				<body>{children}</body>
			</CSPostHogProvider>
		</html>
	);
}
