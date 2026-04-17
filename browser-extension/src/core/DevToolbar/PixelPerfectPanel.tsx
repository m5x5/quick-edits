import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface StoredImage {
	id: string;
	name: string;
	dataUrl: string;
	naturalWidth: number;
	naturalHeight: number;
}

interface GlobalState {
	images: StoredImage[];
	minimized: boolean;
	panelPosition: { x: number; y: number };
}

interface PageConfig {
	activeImageId: string | null;
	opacity: number;
	inverted: boolean;
	overlayX: number;
	overlayY: number;
	overlayWidth: number;
	visible: boolean;
	centerHorizontally: boolean;
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
	centerHorizontally: false,
};

function getPageKey(): string {
	return window.location.origin + window.location.pathname;
}

function migrateOldState(
	raw: Record<string, unknown>,
): PixelPerfectStorage | null {
	if (!raw || raw.global || raw.pages) return null;
	const images = (raw.images as StoredImage[]) || [];
	return {
		global: {
			images,
			minimized: (raw.minimized as boolean) ?? false,
			panelPosition:
				(raw.position as { x: number; y: number }) ?? { x: 0, y: 0 },
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
						chrome.storage.local
							.set({ [STORAGE_KEY]: migrated })
							.catch(() => {});
						resolve(migrated);
						return;
					}
					resolve({
						global: { ...defaultGlobal, ...raw?.global },
						pages: raw?.pages ?? {},
					});
				})
				.catch(() => resolve({ global: defaultGlobal, pages: {} }));
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

/** A label that can be dragged horizontally to scrub a numeric value */
function DraggableLabel({
	label,
	value,
	onChange,
}: {
	label: string;
	value: number;
	onChange: (value: number) => void;
}) {
	const startRef = useRef<{ x: number; startValue: number } | null>(null);

	const onPointerDown = useCallback(
		(e: React.PointerEvent) => {
			startRef.current = { x: e.clientX, startValue: value };
			(e.target as HTMLElement).setPointerCapture(e.pointerId);
		},
		[value],
	);

	const onPointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!startRef.current) return;
			const dx = e.clientX - startRef.current.x;
			onChange(Math.round(startRef.current.startValue + dx));
		},
		[onChange],
	);

	const onPointerUp = useCallback(() => {
		startRef.current = null;
	}, []);

	return (
		<span
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			style={{ cursor: "ew-resize", userSelect: "none" }}
		>
			{label}
		</span>
	);
}

interface PixelPerfectMessage {
	type: "pixel-perfect:set-overlay";
	imageId?: string;
	opacity?: number;
	inverted?: boolean;
	x?: number;
	y?: number;
	width?: number;
}

// Container for the overlay image, appended directly to document.body
let overlayContainer: HTMLDivElement | null = null;
function getOverlayContainer(): HTMLDivElement {
	if (!overlayContainer) {
		overlayContainer = document.createElement("div");
		overlayContainer.dataset.pixelPerfectOverlay = "true";
		overlayContainer.style.cssText =
			"position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483640;";
		document.body.appendChild(overlayContainer);
	}
	return overlayContainer;
}

/** Hook that manages pixel perfect state — used by both the overlay and the panel */
export function usePixelPerfectState() {
	const [global, setGlobal] = useState<GlobalState>(defaultGlobal);
	const [page, setPage] = useState<PageConfig>(defaultPageConfig);
	const [loaded, setLoaded] = useState(false);
	const storageRef = useRef<PixelPerfectStorage>({
		global: defaultGlobal,
		pages: {},
	});

	const pageKey = useRef(getPageKey()).current;

	useEffect(() => {
		loadStorage().then((s) => {
			storageRef.current = s;
			setGlobal(s.global);
			setPage({ ...defaultPageConfig, ...s.pages[pageKey] });
			setLoaded(true);
		});
	}, [pageKey]);

	const persistGlobal = useCallback((newGlobal: GlobalState) => {
		setGlobal(newGlobal);
		storageRef.current = { ...storageRef.current, global: newGlobal };
		saveStorage(storageRef.current);
	}, []);

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
					pages: {
						...storageRef.current.pages,
						[pageKey]: newPage,
					},
				};
				saveStorage(storageRef.current);
				setGlobal(newGlobal);
				setPage(newPage);
			};
			reader.readAsDataURL(blob);
		},
		[pageKey],
	);

	// Listen for WebMCP messages
	useEffect(() => {
		const handleMessage = (e: MessageEvent) => {
			if (e.data?.type !== "pixel-perfect:set-overlay") return;
			const msg = e.data as PixelPerfectMessage;
			setPage((prev) => {
				const newPage = { ...prev };
				if (msg.imageId !== undefined)
					newPage.activeImageId = msg.imageId;
				if (msg.opacity !== undefined) newPage.opacity = msg.opacity;
				if (msg.inverted !== undefined)
					newPage.inverted = msg.inverted;
				if (msg.x !== undefined) newPage.overlayX = msg.x;
				if (msg.y !== undefined) newPage.overlayY = msg.y;
				if (msg.width !== undefined) newPage.overlayWidth = msg.width;
				storageRef.current = {
					...storageRef.current,
					pages: {
						...storageRef.current.pages,
						[pageKey]: newPage,
					},
				};
				saveStorage(storageRef.current);
				return newPage;
			});
		};
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [pageKey]);

	const activeImage = global.images.find(
		(i) => i.id === page.activeImageId,
	);

	// Recenter on window resize when centerHorizontally is enabled
	useEffect(() => {
		if (!page.centerHorizontally || !activeImage) return;
		const handleResize = () => {
			const overlayWidth = page.overlayWidth || activeImage.naturalWidth || 0;
			const x = Math.round((window.innerWidth - overlayWidth) / 2);
			persistPage({ ...page, overlayX: x });
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [page, activeImage, persistPage]);

	return {
		global, page, loaded, activeImage, pageKey,
		persistGlobal, persistPage, addImageFromBlob,
	};
}

/** Renders the overlay image — should always be mounted, independent of panel */
export function PixelPerfectOverlay({
	page,
	activeImage,
}: {
	page: PageConfig;
	activeImage: StoredImage | undefined;
}) {
	if (!activeImage || !page.visible) return null;
	return createPortal(
		<img
			src={activeImage.dataUrl}
			alt="Pixel perfect overlay"
			style={{
				position: "absolute",
				top: page.overlayY,
				left: page.overlayX,
				width: page.overlayWidth || activeImage.naturalWidth || "auto",
				pointerEvents: "none",
				opacity: page.opacity,
				filter: page.inverted ? "invert(1)" : "none",
				transformOrigin: "top left",
			}}
		/>,
		getOverlayContainer(),
	);
}

export default function PixelPerfectPanel({
	ppState,
}: {
	ppState: ReturnType<typeof usePixelPerfectState>;
}) {
	const {
		global, page, loaded, activeImage,
		persistGlobal, persistPage, addImageFromBlob,
	} = ppState;
	const fileInputRef = useRef<HTMLInputElement>(null);

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
		const images = global.images.filter(
			(i) => i.id !== page.activeImageId,
		);
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
			persistPage({
				...page,
				opacity: Number.parseFloat(e.target.value),
			});
		},
		[page, persistPage],
	);

	const handleInvert = useCallback(() => {
		persistPage({ ...page, inverted: !page.inverted });
	}, [page, persistPage]);

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

	const handleToggleCenterHorizontally = useCallback(() => {
		const next = !page.centerHorizontally;
		if (next) {
			const overlayWidth = page.overlayWidth || activeImage?.naturalWidth || 0;
			const x = Math.round((window.innerWidth - overlayWidth) / 2);
			persistPage({ ...page, centerHorizontally: true, overlayX: x });
		} else {
			persistPage({ ...page, centerHorizontally: false });
		}
	}, [page, activeImage, persistPage]);

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
			if (!Number.isNaN(val))
				persistPage({ ...page, overlayWidth: val });
		},
		[page, persistPage],
	);

	if (!loaded) return null;

	const inputClasses =
		"w-16 text-xs text-center rounded-md border border-[#27272a] bg-[#09090b] text-white p-1.5 tabular-nums focus:outline-none focus:border-[#3f3f46]";
	const arrowBtnClasses =
		"flex items-center justify-center w-7 h-7 bg-transparent border border-[#27272a] cursor-pointer rounded-md hover:bg-[#27272a] text-[#a1a1aa] hover:text-white transition-colors";

	return (
		<>
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]">
				<span className="text-sm font-semibold text-white">
					Pixel Perfect
				</span>
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={handleToggleVisible}
						className={`flex items-center justify-center w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer transition-colors ${page.visible ? "text-white hover:bg-[#27272a]" : "text-[#52525b] hover:bg-[#27272a]"}`}
						title={page.visible ? "Hide overlay" : "Show overlay"}
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 18 18"
							fill="none"
						>
							{page.visible ? (
								<>
									<path
										d="M9 4.5C5 4.5 2.5 9 2.5 9s2.5 4.5 6.5 4.5S15.5 9 15.5 9 13 4.5 9 4.5z"
										stroke="currentColor"
										strokeWidth="1.3"
										strokeLinecap="round"
										strokeLinejoin="round"
										fill="none"
									/>
									<circle
										cx="9"
										cy="9"
										r="2.25"
										stroke="currentColor"
										strokeWidth="1.3"
										fill="none"
									/>
								</>
							) : (
								<>
									<path
										d="M9 4.5C5 4.5 2.5 9 2.5 9s2.5 4.5 6.5 4.5S15.5 9 15.5 9 13 4.5 9 4.5z"
										stroke="currentColor"
										strokeWidth="1.3"
										strokeLinecap="round"
										strokeLinejoin="round"
										fill="none"
									/>
									<circle
										cx="9"
										cy="9"
										r="2.25"
										stroke="currentColor"
										strokeWidth="1.3"
										fill="none"
									/>
									<path
										d="M3.5 14.5L14.5 3.5"
										stroke="currentColor"
										strokeWidth="1.3"
										strokeLinecap="round"
									/>
								</>
							)}
						</svg>
					</button>
				</div>
			</div>

			{/* Body */}
			<div className="p-4 flex flex-col gap-4">
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
						<span className="flex items-center justify-center text-xs font-medium py-2 px-3 bg-white text-[#09090b] rounded-lg cursor-pointer hover:bg-[#e4e4e7] transition-colors">
							Upload Image
						</span>
					</label>
					<button
						type="button"
						onClick={async () => {
							try {
								const items =
									await navigator.clipboard.read();
								for (const item of items) {
									const imageType = item.types.find((t) =>
										t.startsWith("image/"),
									);
									if (imageType) {
										const blob =
											await item.getType(imageType);
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
						className="flex-1 flex items-center justify-center text-xs font-medium py-2 px-3 bg-transparent border border-[#27272a] text-[#a1a1aa] rounded-lg cursor-pointer hover:bg-[#27272a] hover:text-white transition-colors"
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
							className="flex-1 text-xs rounded-lg border border-[#27272a] bg-[#09090b] text-white p-2 cursor-pointer focus:outline-none focus:border-[#3f3f46]"
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
								className="flex items-center justify-center w-8 h-8 bg-transparent border-0 cursor-pointer rounded-lg hover:bg-[#27272a] text-[#ef4444] transition-colors"
								title="Delete image"
							>
								<svg
									width="16"
									height="16"
									viewBox="0 0 16 16"
									fill="none"
								>
									<path
										d="M4 5h8l-.5 8.5H4.5L4 5zm2-2.5h4m-6 2.5h8"
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

				{/* Controls for active image */}
				{activeImage && (
					<>
						{/* Opacity */}
						<div className="flex items-center gap-3">
							<span className="text-xs text-[#71717a] w-14 shrink-0">
								Opacity
							</span>
							<input
								type="range"
								min="0"
								max="1"
								step="0.01"
								value={page.opacity}
								onChange={handleOpacity}
								className="flex-1 cursor-pointer accent-white h-1"
							/>
							<span className="text-xs text-[#a1a1aa] w-8 text-right tabular-nums">
								{Math.round(page.opacity * 100)}%
							</span>
						</div>

						{/* Width */}
						<div className="flex items-center gap-3">
							<span className="text-xs text-[#71717a] w-14 shrink-0">
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
							<span className="text-xs text-[#52525b]">px</span>
							<button
								type="button"
								onClick={() =>
									persistPage({
										...page,
										overlayWidth:
											activeImage.naturalWidth,
									})
								}
								className="text-xs text-[#71717a] hover:text-white bg-transparent border-0 cursor-pointer underline transition-colors"
							>
								Reset
							</button>
						</div>

						{/* Position */}
						<div className="flex items-center gap-3">
							<span className="text-xs text-[#71717a] w-14 shrink-0">
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
								<label className="flex items-center gap-1 text-xs text-[#71717a]">
									<DraggableLabel
										label="X"
										value={page.overlayX}
										onChange={(v) => persistPage({ ...page, overlayX: v })}
									/>
									<input
										type="number"
										value={page.overlayX}
										onChange={handleOverlayX}
										className={inputClasses}
									/>
								</label>
								<label className="flex items-center gap-1 text-xs text-[#71717a]">
									<DraggableLabel
										label="Y"
										value={page.overlayY}
										onChange={(v) => persistPage({ ...page, overlayY: v })}
									/>
									<input
										type="number"
										value={page.overlayY}
										onChange={handleOverlayY}
										className={inputClasses}
									/>
								</label>
							</div>
						</div>

						{/* Center Horizontally */}
						<label className="flex items-center gap-2 text-xs text-[#a1a1aa] cursor-pointer select-none">
							<input
								type="checkbox"
								checked={page.centerHorizontally}
								onChange={handleToggleCenterHorizontally}
								className="w-3.5 h-3.5 accent-white cursor-pointer"
							/>
							Center horizontally
						</label>

						{/* Invert */}
						<button
							type="button"
							onClick={handleInvert}
							className={`text-xs font-medium py-2 px-4 rounded-lg border cursor-pointer transition-colors ${
								page.inverted
									? "bg-white text-[#09090b] border-transparent"
									: "bg-transparent border-[#27272a] text-[#a1a1aa] hover:bg-[#27272a] hover:text-white"
							}`}
						>
							{page.inverted ? "Inverted" : "Invert colors"}
						</button>
					</>
				)}
			</div>
		</>
	);
}
