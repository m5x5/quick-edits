import React, { useCallback, useEffect, useRef, useState } from "react";

interface StoredImage {
	id: string;
	name: string;
	dataUrl: string;
	naturalWidth: number;
	naturalHeight: number;
}

/** Shared across all pages */
interface GlobalState {
	images: StoredImage[];
	minimized: boolean;
	panelPosition: { x: number; y: number };
}

/** Per-page overlay config, keyed by page path */
interface PageConfig {
	activeImageId: string | null;
	opacity: number;
	inverted: boolean;
	overlayX: number;
	overlayY: number;
	overlayWidth: number;
	visible: boolean;
}

interface PixelPerfectStorage {
	global: GlobalState;
	pages: Record<string, PageConfig>;
}

const STORAGE_KEY = "pixelPerfect";

const defaultGlobal: GlobalState = {
	images: [],
	minimized: false,
	panelPosition: { x: 0, y: 0 },
};

const defaultPageConfig: PageConfig = {
	activeImageId: null,
	opacity: 0.5,
	inverted: false,
	overlayX: 0,
	overlayY: 0,
	overlayWidth: 0,
	visible: true,
};

function getPageKey(): string {
	return window.location.origin + window.location.pathname;
}

function migrateOldState(raw: Record<string, unknown>): PixelPerfectStorage | null {
	if (!raw || raw.global || raw.pages) return null;
	// Old flat format — migrate to new structure
	const images = (raw.images as StoredImage[]) || [];
	return {
		global: {
			images,
			minimized: (raw.minimized as boolean) ?? false,
			panelPosition: (raw.position as { x: number; y: number }) ?? { x: 0, y: 0 },
		},
		pages: {},
	};
}

function loadStorage(): Promise<PixelPerfectStorage> {
	return new Promise((resolve) => {
		if (typeof chrome !== "undefined" && chrome.storage?.local) {
			chrome.storage.local
				.get([STORAGE_KEY])
				.then((data) => {
					const raw = data[STORAGE_KEY];
					const migrated = migrateOldState(raw);
					if (migrated) {
						chrome.storage.local.set({ [STORAGE_KEY]: migrated }).catch(() => {});
						resolve(migrated);
						return;
					}
					resolve({
						global: { ...defaultGlobal, ...raw?.global },
						pages: raw?.pages ?? {},
					});
				})
				.catch(() =>
					resolve({ global: defaultGlobal, pages: {} }),
				);
		} else {
			resolve({ global: defaultGlobal, pages: {} });
		}
	});
}

function saveStorage(storage: PixelPerfectStorage): void {
	if (typeof chrome !== "undefined" && chrome.storage?.local) {
		chrome.storage.local.set({ [STORAGE_KEY]: storage }).catch(() => {});
	}
}

function getNaturalSize(
	dataUrl: string,
): Promise<{ width: number; height: number }> {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () =>
			resolve({ width: img.naturalWidth, height: img.naturalHeight });
		img.onerror = () => resolve({ width: 0, height: 0 });
		img.src = dataUrl;
	});
}

const ARROW_STEP = 1;

// Message type for WebMCP integration
interface PixelPerfectMessage {
	type: "pixel-perfect:set-overlay";
	imageId?: string;
	opacity?: number;
	inverted?: boolean;
	x?: number;
	y?: number;
	width?: number;
}

export default function PixelPerfect() {
	const [global, setGlobal] = useState<GlobalState>(defaultGlobal);
	const [page, setPage] = useState<PageConfig>(defaultPageConfig);
	const [loaded, setLoaded] = useState(false);
	const [dragging, setDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const fileInputRef = useRef<HTMLInputElement>(null);
	const storageRef = useRef<PixelPerfectStorage>({ global: defaultGlobal, pages: {} });

	const pageKey = useRef(getPageKey()).current;

	useEffect(() => {
		loadStorage().then((s) => {
			storageRef.current = s;
			setGlobal(s.global);
			setPage({ ...defaultPageConfig, ...s.pages[pageKey] });
			setLoaded(true);
		});
	}, [pageKey]);

	const persistGlobal = useCallback(
		(newGlobal: GlobalState) => {
			setGlobal(newGlobal);
			storageRef.current = { ...storageRef.current, global: newGlobal };
			saveStorage(storageRef.current);
		},
		[],
	);

	const persistPage = useCallback(
		(newPage: PageConfig) => {
			setPage(newPage);
			storageRef.current = {
				...storageRef.current,
				pages: { ...storageRef.current.pages, [pageKey]: newPage },
			};
			saveStorage(storageRef.current);
		},
		[pageKey],
	);

	const addImageFromBlob = useCallback(
		(blob: Blob, name: string) => {
			const reader = new FileReader();
			reader.onload = async () => {
				const dataUrl = reader.result as string;
				const { width, height } = await getNaturalSize(dataUrl);
				const newImage: StoredImage = {
					id: `img_${Date.now()}`,
					name,
					dataUrl,
					naturalWidth: width,
					naturalHeight: height,
				};
				const newGlobal = {
					...storageRef.current.global,
					images: [...storageRef.current.global.images, newImage],
				};
				const newPage: PageConfig = {
					...(storageRef.current.pages[pageKey] ?? defaultPageConfig),
					activeImageId: newImage.id,
					overlayWidth: width,
				};
				storageRef.current = {
					global: newGlobal,
					pages: { ...storageRef.current.pages, [pageKey]: newPage },
				};
				saveStorage(storageRef.current);
				setGlobal(newGlobal);
				setPage(newPage);
			};
			reader.readAsDataURL(blob);
		},
		[pageKey],
	);

	// Listen for paste events
	useEffect(() => {
		const handlePaste = (e: ClipboardEvent) => {
			const items = e.clipboardData?.items;
			if (!items) return;
			for (const item of items) {
				if (item.type.startsWith("image/")) {
					const blob = item.getAsFile();
					if (blob) {
						addImageFromBlob(
							blob,
							`Pasted ${new Date().toLocaleTimeString()}`,
						);
					}
					break;
				}
			}
		};
		document.addEventListener("paste", handlePaste);
		return () => document.removeEventListener("paste", handlePaste);
	}, [addImageFromBlob]);

	// Listen for WebMCP messages
	useEffect(() => {
		const handleMessage = (e: MessageEvent) => {
			if (e.data?.type !== "pixel-perfect:set-overlay") return;
			const msg = e.data as PixelPerfectMessage;
			setPage((prev) => {
				const newPage = { ...prev };
				if (msg.imageId !== undefined) newPage.activeImageId = msg.imageId;
				if (msg.opacity !== undefined) newPage.opacity = msg.opacity;
				if (msg.inverted !== undefined) newPage.inverted = msg.inverted;
				if (msg.x !== undefined) newPage.overlayX = msg.x;
				if (msg.y !== undefined) newPage.overlayY = msg.y;
				if (msg.width !== undefined) newPage.overlayWidth = msg.width;
				storageRef.current = {
					...storageRef.current,
					pages: { ...storageRef.current.pages, [pageKey]: newPage },
				};
				saveStorage(storageRef.current);
				return newPage;
			});
		};
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [pageKey]);

	const handleUpload = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;
			addImageFromBlob(file, file.name);
			if (fileInputRef.current) fileInputRef.current.value = "";
		},
		[addImageFromBlob],
	);

	const handleSelectImage = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			const id = e.target.value || null;
			const img = global.images.find((i) => i.id === id);
			persistPage({
				...page,
				activeImageId: id,
				overlayWidth: img?.naturalWidth ?? page.overlayWidth,
			});
		},
		[global.images, page, persistPage],
	);

	const handleDeleteImage = useCallback(() => {
		if (!page.activeImageId) return;
		const images = global.images.filter((i) => i.id !== page.activeImageId);
		const next = images[0];
		persistGlobal({ ...global, images });
		persistPage({
			...page,
			activeImageId: next?.id ?? null,
			overlayWidth: next?.naturalWidth ?? 0,
		});
	}, [global, page, persistGlobal, persistPage]);

	const handleOpacity = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			persistPage({ ...page, opacity: Number.parseFloat(e.target.value) });
		},
		[page, persistPage],
	);

	const handleInvert = useCallback(() => {
		persistPage({ ...page, inverted: !page.inverted });
	}, [page, persistPage]);

	const handleMinimize = useCallback(() => {
		persistGlobal({ ...global, minimized: !global.minimized });
	}, [global, persistGlobal]);

	const handleToggleVisible = useCallback(() => {
		persistPage({ ...page, visible: !page.visible });
	}, [page, persistPage]);

	const moveOverlay = useCallback(
		(dx: number, dy: number) => {
			persistPage({
				...page,
				overlayX: page.overlayX + dx,
				overlayY: page.overlayY + dy,
			});
		},
		[page, persistPage],
	);

	const handleOverlayX = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const val = Number.parseInt(e.target.value, 10);
			if (!Number.isNaN(val)) persistPage({ ...page, overlayX: val });
		},
		[page, persistPage],
	);

	const handleOverlayY = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const val = Number.parseInt(e.target.value, 10);
			if (!Number.isNaN(val)) persistPage({ ...page, overlayY: val });
		},
		[page, persistPage],
	);

	const handleOverlayWidth = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const val = Number.parseInt(e.target.value, 10);
			if (!Number.isNaN(val)) persistPage({ ...page, overlayWidth: val });
		},
		[page, persistPage],
	);

	// Panel drag
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (
				(e.target as HTMLElement).closest("button, select, input, label")
			)
				return;
			setDragging(true);
			setDragStart({
				x: e.clientX - global.panelPosition.x,
				y: e.clientY - global.panelPosition.y,
			});
		},
		[global.panelPosition],
	);

	useEffect(() => {
		if (!dragging) return;
		const handleMouseMove = (e: MouseEvent) => {
			setGlobal((prev) => ({
				...prev,
				panelPosition: {
					x: e.clientX - dragStart.x,
					y: e.clientY - dragStart.y,
				},
			}));
		};
		const handleMouseUp = () => {
			setDragging(false);
			setGlobal((prev) => {
				storageRef.current = { ...storageRef.current, global: prev };
				saveStorage(storageRef.current);
				return prev;
			});
		};
		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [dragging, dragStart]);

	const activeImage = global.images.find(
		(i) => i.id === page.activeImageId,
	);

	if (!loaded) return null;

	const inputClasses =
		"w-16 text-xs text-center rounded border border-gray-200 dark:border-[#3c4043] bg-white dark:bg-[#1e1e1e] text-black dark:text-white p-1 tabular-nums";
	const arrowBtnClasses =
		"bg-transparent border border-gray-200 dark:border-[#3c4043] cursor-pointer p-0.5 rounded hover:bg-gray-100 dark:hover:bg-[#292a2d] text-black dark:text-white transition-colors flex items-center justify-center";

	return (
		<>
			{/* Overlay image — absolute so it scrolls with the page */}
			{activeImage && page.visible && (
				<img
					src={activeImage.dataUrl}
					alt="Pixel perfect overlay"
					style={{
						position: "absolute",
						top: page.overlayY,
						left: page.overlayX,
						width:
							page.overlayWidth ||
							activeImage.naturalWidth ||
							"auto",
						maxWidth: "none",
						zIndex: 2147483640,
						pointerEvents: "none",
						opacity: page.opacity,
						filter: page.inverted ? "invert(1)" : "none",
						transformOrigin: "top left",
					}}
				/>
			)}

			{/* Control panel */}
			<div
				onMouseDown={handleMouseDown}
				style={{
					position: "fixed",
					bottom: global.panelPosition.y ? "auto" : "20px",
					right: global.panelPosition.x ? "auto" : "20px",
					top: global.panelPosition.y
						? `${global.panelPosition.y}px`
						: "auto",
					left: global.panelPosition.x
						? `${global.panelPosition.x}px`
						: "auto",
					zIndex: 2147483641,
					fontFamily: "system-ui, -apple-system, sans-serif",
					fontSize: "13px",
					cursor: dragging ? "grabbing" : "grab",
					userSelect: "none",
				}}
				className="bg-white dark:bg-[#202124] text-black dark:text-white border border-gray-200 dark:border-[#3c4043] rounded-lg shadow-lg"
			>
				{/* Header */}
				<div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-200 dark:border-[#3c4043]">
					<span className="font-semibold text-xs tracking-wide opacity-70">
						PIXEL PERFECT
					</span>
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={handleToggleVisible}
							className={`bg-transparent border-0 cursor-pointer p-0.5 rounded hover:bg-gray-100 dark:hover:bg-[#292a2d] transition-colors ${page.visible ? "text-black dark:text-white" : "text-gray-400 dark:text-gray-600"}`}
							title={page.visible ? "Hide overlay" : "Show overlay"}
						>
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<title>{page.visible ? "Hide overlay" : "Show overlay"}</title>
								{page.visible ? (
									<>
										<path d="M8 4C4.5 4 2 8 2 8s2.5 4 6 4 6-4 6-4-2.5-4-6-4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
										<circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
									</>
								) : (
									<>
										<path d="M8 4C4.5 4 2 8 2 8s2.5 4 6 4 6-4 6-4-2.5-4-6-4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
										<circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
										<path d="M3 13L13 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
									</>
								)}
							</svg>
						</button>
					<button
						type="button"
						onClick={handleMinimize}
						className="bg-transparent border-0 cursor-pointer p-0.5 rounded hover:bg-gray-100 dark:hover:bg-[#292a2d] text-black dark:text-white transition-colors"
						title={global.minimized ? "Expand" : "Minimize"}
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
						>
							<title>
								{global.minimized ? "Expand" : "Minimize"}
							</title>
							{global.minimized ? (
								<path
									d="M4 6l4 4 4-4"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							) : (
								<path
									d="M4 10l4-4 4 4"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							)}
						</svg>
					</button>
					</div>
				</div>

				{/* Body */}
				{!global.minimized && (
					<div
						className="p-3 flex flex-col gap-3"
						style={{ minWidth: "260px" }}
					>
						{/* Upload & Paste */}
						<div className="flex gap-2">
							<label className="flex-1 cursor-pointer">
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handleUpload}
									className="hidden"
								/>
								<span className="block text-center text-xs py-1.5 px-3 bg-[#0957d0] dark:bg-[#a8c7fa] text-white dark:text-[#202124] rounded-full cursor-pointer hover:opacity-90 transition-opacity">
									Upload
								</span>
							</label>
							<button
								type="button"
								onClick={async () => {
									try {
										const items =
											await navigator.clipboard.read();
										for (const item of items) {
											const imageType = item.types.find(
												(t) => t.startsWith("image/"),
											);
											if (imageType) {
												const blob =
													await item.getType(
														imageType,
													);
												addImageFromBlob(
													blob,
													`Pasted ${new Date().toLocaleTimeString()}`,
												);
												break;
											}
										}
									} catch {
										// Clipboard API denied or no image
									}
								}}
								className="flex-1 text-center text-xs py-1.5 px-3 bg-[#0957d0] dark:bg-[#a8c7fa] text-white dark:text-[#202124] rounded-full cursor-pointer hover:opacity-90 transition-opacity border-0"
							>
								Paste
							</button>
						</div>

						{/* Image selector */}
						{global.images.length > 0 && (
							<div className="flex gap-2 items-center">
								<select
									value={page.activeImageId ?? ""}
									onChange={handleSelectImage}
									className="flex-1 text-xs rounded border border-gray-200 dark:border-[#3c4043] bg-white dark:bg-[#1e1e1e] text-black dark:text-white p-1.5 cursor-pointer"
								>
									<option value="">No overlay</option>
									{global.images.map((img) => (
										<option key={img.id} value={img.id}>
											{img.name}
										</option>
									))}
								</select>
								{page.activeImageId && (
									<button
										type="button"
										onClick={handleDeleteImage}
										className="bg-transparent border-0 cursor-pointer p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
										title="Delete image"
									>
										<svg
											width="14"
											height="14"
											viewBox="0 0 14 14"
											fill="none"
										>
											<title>Delete</title>
											<path
												d="M3 4h8l-.5 8H3.5L3 4zm2-2h4m-6 2h8"
												stroke="currentColor"
												strokeWidth="1.2"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									</button>
								)}
							</div>
						)}

						{/* Controls shown when an image is active */}
						{activeImage && (
							<>
								{/* Opacity */}
								<div className="flex items-center gap-2">
									<span className="text-xs opacity-70 w-14">
										Opacity
									</span>
									<input
										type="range"
										min="0"
										max="1"
										step="0.01"
										value={page.opacity}
										onChange={handleOpacity}
										className="flex-1 cursor-pointer accent-[#0957d0] dark:accent-[#a8c7fa]"
									/>
									<span className="text-xs w-8 text-right tabular-nums">
										{Math.round(page.opacity * 100)}%
									</span>
								</div>

								{/* Width */}
								<div className="flex items-center gap-2">
									<span className="text-xs opacity-70 w-14">
										Width
									</span>
									<input
										type="number"
										value={
											page.overlayWidth ||
											activeImage.naturalWidth
										}
										onChange={handleOverlayWidth}
										className={inputClasses}
									/>
									<span className="text-xs opacity-50">
										px
									</span>
									<button
										type="button"
										onClick={() =>
											persistPage({
												...page,
												overlayWidth:
													activeImage.naturalWidth,
											})
										}
										className="text-xs opacity-70 hover:opacity-100 bg-transparent border-0 cursor-pointer underline text-black dark:text-white"
									>
										Reset
									</button>
								</div>

								{/* Position: arrows + X/Y inputs */}
								<div className="flex items-center gap-3">
									<span className="text-xs opacity-70">
										Position
									</span>

									{/* Arrow pad */}
									<div
										className="grid grid-cols-3 gap-0.5"
										style={{ width: "fit-content" }}
									>
										<div />
										<button
											type="button"
											className={arrowBtnClasses}
											onClick={() =>
												moveOverlay(0, -ARROW_STEP)
											}
											title="Move up"
										>
											<svg
												width="12"
												height="12"
												viewBox="0 0 12 12"
												fill="none"
											>
												<path
													d="M6 2.5v7M6 2.5L3 5.5M6 2.5l3 3"
													stroke="currentColor"
													strokeWidth="1.2"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</button>
										<div />
										<button
											type="button"
											className={arrowBtnClasses}
											onClick={() =>
												moveOverlay(-ARROW_STEP, 0)
											}
											title="Move left"
										>
											<svg
												width="12"
												height="12"
												viewBox="0 0 12 12"
												fill="none"
											>
												<path
													d="M2.5 6h7M2.5 6L5.5 3M2.5 6l3 3"
													stroke="currentColor"
													strokeWidth="1.2"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</button>
										<div />
										<button
											type="button"
											className={arrowBtnClasses}
											onClick={() =>
												moveOverlay(ARROW_STEP, 0)
											}
											title="Move right"
										>
											<svg
												width="12"
												height="12"
												viewBox="0 0 12 12"
												fill="none"
											>
												<path
													d="M9.5 6h-7M9.5 6L6.5 3M9.5 6l-3 3"
													stroke="currentColor"
													strokeWidth="1.2"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</button>
										<div />
										<button
											type="button"
											className={arrowBtnClasses}
											onClick={() =>
												moveOverlay(0, ARROW_STEP)
											}
											title="Move down"
										>
											<svg
												width="12"
												height="12"
												viewBox="0 0 12 12"
												fill="none"
											>
												<path
													d="M6 9.5v-7M6 9.5L3 6.5M6 9.5l3-3"
													stroke="currentColor"
													strokeWidth="1.2"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
										</button>
										<div />
									</div>

									{/* X / Y inputs */}
									<div className="flex gap-2 items-center">
										<label className="flex items-center gap-1 text-xs opacity-70">
											X
											<input
												type="number"
												value={page.overlayX}
												onChange={handleOverlayX}
												className={inputClasses}
											/>
										</label>
										<label className="flex items-center gap-1 text-xs opacity-70">
											Y
											<input
												type="number"
												value={page.overlayY}
												onChange={handleOverlayY}
												className={inputClasses}
											/>
										</label>
									</div>
								</div>

								{/* Invert */}
								<button
									type="button"
									onClick={handleInvert}
									className={`text-xs py-1.5 px-3 rounded-full border cursor-pointer transition-colors ${
										page.inverted
											? "bg-[#0957d0] dark:bg-[#a8c7fa] text-white dark:text-[#202124] border-transparent"
											: "bg-transparent border-gray-300 dark:border-[#3c4043] text-black dark:text-white hover:bg-gray-50 dark:hover:bg-[#292a2d]"
									}`}
								>
									{page.inverted ? "Inverted" : "Invert"}
								</button>
							</>
						)}
					</div>
				)}
			</div>
		</>
	);
}
