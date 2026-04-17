import React, { useCallback, useEffect, useRef, useState } from "react";
import DesignTokensPanel from "./DesignTokensPanel";
import PixelPerfectPanel, { PixelPerfectOverlay, usePixelPerfectState } from "./PixelPerfectPanel";
import TypographyClassesPanel from "./TypographyClassesPanel";

type PanelId = "pixel-perfect" | "webmcp" | "tokens" | "typography" | null;


export default function DevToolbar() {
	const [activePanel, setActivePanel] = useState<PanelId>(null);
	const [webmcpConnected, setWebmcpConnected] = useState(false);
	const ppState = usePixelPerfectState();
	const [hasTarget, setHasTarget] = useState(false);
	const [hidden, setHidden] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const toolbarRef = useRef<HTMLDivElement>(null);

	const togglePanel = useCallback((panel: PanelId) => {
		setActivePanel((prev) => (prev === panel ? null : panel));
	}, []);

	// Track element selection state
	useEffect(() => {
		const handler = (e: MessageEvent) => {
			if (e.data?.type === "quick-edits:target-changed") {
				setHasTarget(!!e.data.selector);
			}
		};
		window.addEventListener("message", handler);
		return () => window.removeEventListener("message", handler);
	}, []);

	// Close panel on outside click
	useEffect(() => {
		if (!activePanel) return;
		const handler = (e: MouseEvent) => {
			if (
				toolbarRef.current &&
				!toolbarRef.current.contains(e.target as Node)
			) {
				setActivePanel(null);
			}
		};
		const id = setTimeout(
			() => document.addEventListener("mousedown", handler),
			0,
		);
		return () => {
			clearTimeout(id);
			document.removeEventListener("mousedown", handler);
		};
	}, [activePanel]);

	// Close on Escape
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape" && activePanel) {
				setActivePanel(null);
			}
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [activePanel]);

	// Listen for WebMCP connection status
	useEffect(() => {
		const handler = (e: MessageEvent) => {
			if (e.data?.type === "webmcp:connected") setWebmcpConnected(true);
			if (e.data?.type === "webmcp:disconnected")
				setWebmcpConnected(false);
		};
		window.addEventListener("message", handler);
		return () => window.removeEventListener("message", handler);
	}, []);

	const handleHideForSession = useCallback(() => {
		setHidden(true);
		setMenuOpen(false);
		chrome.runtime.sendMessage({ action: "hide_toolbar_session" }).catch(() => {});
	}, []);

	const btnBase =
		"flex items-center justify-center w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer transition-all duration-150";
	const btnInactive =
		"text-[#a1a1aa] hover:text-white hover:bg-[#27272a]";
	const btnActive = "text-white bg-[#27272a]";

	const panelStyle: React.CSSProperties = {
		position: "absolute",
		bottom: "100%",
		left: "50%",
		transform: "translateX(-50%)",
		marginBottom: "8px",
		width: "max-content",
	};

	if (hidden) {
		return <PixelPerfectOverlay page={ppState.page} activeImage={ppState.activeImage} />;
	}

	return (
		<div
			ref={toolbarRef}
			style={{
				position: "fixed",
				bottom: "16px",
				left: "50%",
				transform: "translateX(-50%)",
				zIndex: 2147483646,
				fontFamily:
					'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
				fontSize: "13px",
			}}
		>
			{/* Overlay always rendered so it persists when panel is closed */}
			<PixelPerfectOverlay page={ppState.page} activeImage={ppState.activeImage} />

			{/* Active panel — positioned absolutely so it doesn't affect toolbar width */}
			<div style={{ position: "relative" }}>
				{activePanel === "pixel-perfect" && (
					<div
						className="rounded-xl bg-[#18181b] border border-[#27272a] shadow-2xl overflow-hidden"
						style={{ ...panelStyle, minWidth: "300px" }}
					>
						<PixelPerfectPanel ppState={ppState} />
					</div>
				)}

				{activePanel === "tokens" && (
					<div
						className="rounded-xl bg-[#18181b] border border-[#27272a] shadow-2xl overflow-hidden"
						style={{ ...panelStyle, minWidth: "320px", maxWidth: "400px" }}
					>
						<DesignTokensPanel />
					</div>
				)}

				{activePanel === "typography" && (
					<div
						className="rounded-xl bg-[#18181b] border border-[#27272a] shadow-2xl overflow-hidden"
						style={{ ...panelStyle, minWidth: "280px", maxWidth: "360px" }}
					>
						<TypographyClassesPanel />
					</div>
				)}

				{activePanel === "webmcp" && (
					<div
						className="rounded-xl bg-[#18181b] border border-[#27272a] shadow-2xl overflow-hidden p-4"
						style={{ ...panelStyle, minWidth: "280px" }}
					>
						<div className="flex items-center gap-2 mb-3">
							<div
								className={`w-2 h-2 rounded-full ${webmcpConnected ? "bg-emerald-400" : "bg-zinc-500"}`}
							/>
							<span className="text-sm font-medium text-white">
								WebMCP
							</span>
							<span className="text-xs text-[#71717a]">
								{webmcpConnected
									? "Connected"
									: "Not connected"}
							</span>
						</div>
						<p className="text-xs text-[#71717a] leading-relaxed m-0">
							WebMCP allows AI assistants to interact with page
							elements. Connect via the WebMCP client to inspect
							elements, edit classes, and control the pixel
							perfect overlay.
						</p>
					</div>
				)}
			</div>

			{/* Toolbar bar */}
			<div className="flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-[#18181b] border border-[#27272a] shadow-2xl">
				{/* Quick Edits logo only */}
				<div
					className="flex items-center justify-center w-9 h-9 select-none"
					title="Quick Edits"
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M11.5 1.5l3 3-9 9H2.5v-3l9-9z"
							stroke="#a1a1aa"
							strokeWidth="1.3"
							strokeLinecap="round"
							strokeLinejoin="round"
							fill="none"
						/>
					</svg>
				</div>

				<div className="w-px h-5 bg-[#27272a] mx-0.5" />

				{/* Design Tokens */}
				<button
					type="button"
					className={`${btnBase} ${activePanel === "tokens" ? btnActive : btnInactive} relative`}
					onClick={() => togglePanel("tokens")}
					title="Design Tokens"
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 18 18"
						fill="none"
					>
						<circle
							cx="9"
							cy="5"
							r="3"
							stroke="currentColor"
							strokeWidth="1.3"
							fill="none"
						/>
						<circle
							cx="5"
							cy="12"
							r="3"
							stroke="currentColor"
							strokeWidth="1.3"
							fill="none"
						/>
						<circle
							cx="13"
							cy="12"
							r="3"
							stroke="currentColor"
							strokeWidth="1.3"
							fill="none"
						/>
					</svg>
					{hasTarget && (
						<div
							className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#818cf8]"
							style={{ boxShadow: "0 0 4px #818cf8" }}
						/>
					)}
				</button>

				{/* Pixel Perfect */}
				<button
					type="button"
					className={`${btnBase} ${activePanel === "pixel-perfect" ? btnActive : btnInactive}`}
					onClick={() => togglePanel("pixel-perfect")}
					title="Pixel Perfect overlay"
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 18 18"
						fill="none"
					>
						<rect
							x="2"
							y="2"
							width="14"
							height="14"
							rx="2"
							stroke="currentColor"
							strokeWidth="1.3"
							fill="none"
						/>
						<path
							d="M6 2v14M12 2v14M2 6h14M2 12h14"
							stroke="currentColor"
							strokeWidth="0.8"
							opacity="0.4"
						/>
					</svg>
				</button>

				{/* Typography Classes */}
				<button
					type="button"
					className={`${btnBase} ${activePanel === "typography" ? btnActive : btnInactive}`}
					onClick={() => togglePanel("typography")}
					title="Typography Classes"
				>
					<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
						<text x="3" y="13" fontSize="13" fontWeight="700" fill="currentColor" fontFamily="serif">T</text>
						<path d="M10 14h6M10 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
					</svg>
				</button>

				{/* WebMCP */}
				<button
					type="button"
					className={`${btnBase} ${activePanel === "webmcp" ? btnActive : btnInactive} relative`}
					onClick={() => togglePanel("webmcp")}
					title="WebMCP connection"
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 18 18"
						fill="none"
					>
						<circle
							cx="9"
							cy="9"
							r="6.5"
							stroke="currentColor"
							strokeWidth="1.3"
							fill="none"
						/>
						<path
							d="M9 2.5C6.5 5 6.5 13 9 15.5M9 2.5C11.5 5 11.5 13 9 15.5M2.5 9h13"
							stroke="currentColor"
							strokeWidth="1"
							fill="none"
						/>
					</svg>
					{webmcpConnected && (
						<div
							className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400"
							style={{ boxShadow: "0 0 4px #34d399" }}
						/>
					)}
				</button>

				<div className="w-px h-5 bg-[#27272a] mx-0.5" />

				{/* 3-dot menu */}
				<div style={{ position: "relative" }}>
					<button
						type="button"
						className={`${btnBase} ${menuOpen ? btnActive : btnInactive}`}
						onClick={() => setMenuOpen((prev) => !prev)}
						title="More options"
					>
						<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
							<circle cx="9" cy="4" r="1.2" fill="currentColor" />
							<circle cx="9" cy="9" r="1.2" fill="currentColor" />
							<circle cx="9" cy="14" r="1.2" fill="currentColor" />
						</svg>
					</button>
					{menuOpen && (
						<div
							className="rounded-xl bg-[#18181b] border border-[#27272a] shadow-2xl overflow-hidden py-1"
							style={{
								position: "absolute",
								bottom: "100%",
								right: 0,
								marginBottom: "8px",
								width: "max-content",
								minWidth: "180px",
							}}
						>
							<button
								type="button"
								className="w-full text-left text-xs text-[#a1a1aa] hover:text-white hover:bg-[#27272a] bg-transparent border-0 cursor-pointer px-3 py-2 transition-colors"
								onClick={handleHideForSession}
							>
								Hide for this session
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
