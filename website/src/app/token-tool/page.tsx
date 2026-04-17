"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  ExtractedTokens,
  ExtractedTextStyle,
  FigmaFileInfo,
  FigmaPage,
  FigmaFrame,
  TypographyClassDef,
} from "./types";
import {
  parseFileKeyFromUrl,
  fetchFile,
  fetchVariables,
  fetchFrameImages,
  generateCSSFromTokens,
  generateTailwindConfigFromTokens,
  generateJSONFromTokens,
  parseImportedTokens,
  mergeTextStyles,
  type ExtractionResult,
  type MergedTextStyle,
} from "./figma";
import { initTokenToolWebMCP, destroyTokenToolWebMCP } from "./webmcp";

type Step = "connect" | "extracted" | "map_review" | "export";

const SS_KEY = "token-tool-state";
const LS_CLASSES_KEY = "token-tool-typography-classes";

function saveClasses(classes: TypographyClassDef[]) {
  try {
    localStorage.setItem(LS_CLASSES_KEY, JSON.stringify(classes));
  } catch {
    // storage full or unavailable
  }
}

function loadClasses(): TypographyClassDef[] {
  try {
    const raw = localStorage.getItem(LS_CLASSES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TypographyClassDef[];
  } catch {
    return [];
  }
}

type PersistedState = {
  step: Step;
  token: string;
  fileUrl: string;
  fileInfo: FigmaFileInfo | null;
  selectedPageId: string | null;
  selectedFrameIds: string[];
  tokens: ExtractedTokens | null;
  rawNodes: Record<string, unknown>[];
};

function saveSession(state: PersistedState) {
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable
  }
}

function loadSession(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

const NAV_ITEMS: { key: Step; label: string }[] = [
  { key: "connect", label: "connect_source" },
  { key: "extracted", label: "extraction_preview" },
  { key: "map_review", label: "map_and_review" },
  { key: "export", label: "export_config" },
];

function StepBadge({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#22C55E] text-[#0C0C0C] text-xs font-bold font-mono">
        {num}
      </span>
      <span className="text-[#E5E5E5] font-mono text-base font-medium">
        {title}
      </span>
    </div>
  );
}

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="font-mono text-[11px] font-medium" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded bg-[#171717] border border-[#1F1F1F] p-6 flex flex-col gap-5">
      {children}
    </div>
  );
}

function Comment({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs text-[#a3a3a3] leading-[1.5]">
      {children}
    </p>
  );
}

/* ─── Icons (Lucide-style inline SVGs) ─── */
function IconSearch() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#525252"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#22C55E"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#525252"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#525252"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconFigma({ color = "#525252" }: { color?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
      <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
      <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z" />
      <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z" />
      <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0C0C0C"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#0C0C0C"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconLayoutDashboard() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#525252"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

function IconPalette() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#22C55E"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="13.5" cy="6.5" r=".5" />
      <circle cx="17.5" cy="10.5" r=".5" />
      <circle cx="8.5" cy="7.5" r=".5" />
      <circle cx="6.5" cy="12" r=".5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function IconSmartphone() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#525252"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#A3A3A3"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#A3A3A3"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function IconX() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#A3A3A3"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#252525"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function IconLoader() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

/* ─── Sidebar ─── */
function Sidebar({
  step,
  onStep,
}: {
  step: Step;
  onStep: (s: Step) => void;
}) {
  return (
    <div className="flex flex-col gap-8 bg-[#0C0C0C] border-r border-[#1F1F1F] p-8 pt-8 pb-8 w-[280px] shrink-0 h-full">
      <div className="flex items-center gap-2">
        <span className="text-[#22C55E] font-mono text-lg font-semibold">
          ~
        </span>
        <span className="text-[#E5E5E5] font-mono text-sm font-semibold">
          design_tokens
        </span>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onStep(item.key)}
            className={`flex items-center gap-3 rounded px-3 py-2 font-mono text-[13px] text-left w-full transition-colors ${
              step === item.key
                ? "bg-[#1A1A1A] text-[#E5E5E5] font-medium"
                : "text-[#a3a3a3] hover:text-[#E5E5E5]"
            }`}
          >
            <span
              className={
                step === item.key ? "text-[#22C55E]" : "text-[#a3a3a3]"
              }
            >
              {step === item.key ? ">" : " "}
            </span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ─── Step 1: Connect ─── */
function ConnectStep({
  onNext,
  onImport,
  token,
  setToken,
  fileUrl,
  setFileUrl,
  fileInfo,
  setFileInfo,
  selectedPage,
  setSelectedPage,
  selectedFrames,
  setSelectedFrames,
  frameImages,
  setFrameImages,
  loading,
  setLoading,
  error,
  setError,
}: {
  onNext: (frameIdOverride?: string[]) => void;
  onImport: (tokens: ExtractedTokens) => void;
  token: string;
  setToken: (v: string) => void;
  fileUrl: string;
  setFileUrl: (v: string) => void;
  fileInfo: FigmaFileInfo | null;
  setFileInfo: (v: FigmaFileInfo | null) => void;
  selectedPage: FigmaPage | null;
  setSelectedPage: (v: FigmaPage | null) => void;
  selectedFrames: Set<string>;
  setSelectedFrames: (v: Set<string>) => void;
  frameImages: Record<string, string | null>;
  setFrameImages: (v: Record<string, string | null>) => void;
  loading: string | null;
  setLoading: (v: string | null) => void;
  error: string | null;
  setError: (v: string | null) => void;
}) {
  const [showToken, setShowToken] = useState(false);
  const [directFrameIds, setDirectFrameIds] = useState("");
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const fileKey = parseFileKeyFromUrl(fileUrl);
  const isTokenValid = token.length > 10;
  const parsedDirectIds = directFrameIds
    .split(",")
    .map((s) => s.trim().replace(/:/g, "-"))
    .filter(Boolean);
  const hasDirectIds = parsedDirectIds.length > 0 && !!fileKey && isTokenValid;

  const handleLoadFile = async () => {
    if (!fileKey || !isTokenValid) return;
    setLoading("file");
    setError(null);
    try {
      const info = await fetchFile(token, fileKey);
      setFileInfo(info);
      setSelectedPage(null);
      setSelectedFrames(new Set());
      setFrameImages({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoading(null);
    }
  };

  const handleSelectPage = async (page: FigmaPage) => {
    setSelectedPage(page);
    setSelectedFrames(new Set());
    // Load frame thumbnails
    if (page.children.length > 0 && fileKey) {
      const nodeIds = page.children.slice(0, 20).map((f) => f.id);
      try {
        const images = await fetchFrameImages(token, fileKey, nodeIds);
        setFrameImages(images);
      } catch {
        // thumbnails are optional
      }
    }
  };

  const toggleFrame = (frameId: string) => {
    const next = new Set(selectedFrames);
    if (next.has(frameId)) next.delete(frameId);
    else next.add(frameId);
    setSelectedFrames(next);
  };

  const selectAllFrames = () => {
    if (!selectedPage) return;
    setSelectedFrames(new Set(selectedPage.children.map((f) => f.id)));
  };

  const frames = selectedPage?.children || [];

  return (
    <div className="flex flex-col gap-10 p-12 overflow-y-auto flex-1">
      <div className="flex flex-col gap-2">
        <h1 className="font-mono text-[32px] font-semibold text-[#E5E5E5]">
          connect_source
        </h1>
        <Comment>
          {"// connect your figma account, choose a file, then select the frames to extract tokens from"}
        </Comment>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded px-4 py-3 font-mono text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-8">
        {/* Step 1: Auth */}
        <Card>
          <div className="flex items-center justify-between">
            <StepBadge num={1} title="personal_access_token" />
            {isTokenValid && <StatusDot color="#22C55E" label="token set" />}
          </div>
          <Comment>
            {"// generate a personal access token in figma > settings > security"}
          </Comment>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-between bg-[#1A1A1A] border border-[#252525] rounded h-10 px-3 w-full">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="figd_aBcDeFgH..."
                className="bg-transparent font-mono text-xs text-[#E5E5E5] outline-none flex-1 placeholder:text-[#525252]"
              />
              <button type="button" onClick={() => setShowToken(!showToken)}>
                {showToken ? <IconEye /> : <IconEyeOff />}
              </button>
            </div>
          </div>
        </Card>

        {/* Step 2: File URL */}
        <Card>
          <div className="flex items-center justify-between">
            <StepBadge num={2} title="select_design_file" />
            {fileInfo && <StatusDot color="#22C55E" label="loaded" />}
          </div>
          <Comment>
            {"// paste a figma file url or file key"}
          </Comment>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#252525] rounded h-10 px-3 w-full">
              <IconSearch />
              <input
                type="text"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://figma.com/design/abc123/... or paste file key"
                className="bg-transparent font-mono text-xs text-[#E5E5E5] outline-none flex-1 placeholder:text-[#525252]"
              />
            </div>
            <button
              type="button"
              onClick={handleLoadFile}
              disabled={!fileKey || !isTokenValid || loading === "file"}
              className="flex items-center gap-2 bg-[#22C55E] rounded px-4 h-10 font-mono text-xs font-semibold text-[#0C0C0C] disabled:opacity-40 shrink-0"
            >
              {loading === "file" ? <IconLoader /> : null}
              load
            </button>
          </div>
          {fileInfo && (
            <div className="flex items-center gap-3 rounded bg-[#1A1A1A] border border-[#22C55E] px-3 py-2.5">
              <IconFigma color="#22C55E" />
              <div className="flex flex-col gap-0.5 flex-1">
                <span className="font-mono text-[13px] font-medium text-[#E5E5E5]">
                  {fileInfo.name}
                </span>
                <span className="font-mono text-[11px] text-[#a3a3a3]">
                  {fileInfo.pages.length} pages · last modified{" "}
                  {new Date(fileInfo.lastModified).toLocaleDateString()}
                </span>
              </div>
              <IconCheck />
            </div>
          )}
        </Card>

        {/* Direct frame IDs — skip file load */}
        <Card>
          <div className="flex items-center justify-between">
            <StepBadge num={3} title="direct_frame_ids" />
            {directFrameIds.trim() && <StatusDot color="#22C55E" label={`${directFrameIds.split(",").filter(Boolean).length} ids`} />}
          </div>
          <Comment>
            {"// optional: paste frame node IDs directly to skip loading the full file (e.g. 2025-143, 2025-144)"}
          </Comment>
          <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#252525] rounded h-10 px-3 w-full">
            <input
              type="text"
              value={directFrameIds}
              onChange={(e) => setDirectFrameIds(e.target.value)}
              placeholder="2025-143, 2025-144, 2025-145"
              className="bg-transparent font-mono text-xs text-[#E5E5E5] outline-none flex-1 placeholder:text-[#525252]"
            />
          </div>
        </Card>

        {/* Import JSON — paste MCP output, W3C DTCG, or .tokens.json */}
        <Card>
          <div className="flex items-center justify-between">
            <StepBadge num={4} title="import_tokens" />
            {importJson.trim().length > 2 && <StatusDot color="#22C55E" label="json ready" />}
          </div>
          <Comment>
            {"// alternative: paste or upload token JSON (exported design-tokens.json, Figma MCP output, W3C .tokens.json, or Tokens Studio export)"}
          </Comment>
          <textarea
            value={importJson}
            onChange={(e) => { setImportJson(e.target.value); setImportError(null); }}
            placeholder={'{\n  "Sunshine Burst": "#ffdf00",\n  "Desktop/Headline/MD": "Font(family: \\"Rubik\\", style: Bold, size: 48, weight: 700, lineHeight: 1.2, letterSpacing: 0)"\n}'}
            className="bg-[#1A1A1A] border border-[#252525] rounded px-3 py-2.5 w-full h-32 font-mono text-xs text-[#E5E5E5] outline-none resize-y placeholder:text-[#525252]"
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 border border-[#525252] rounded px-3 py-2 font-mono text-[11px] text-[#A3A3A3] cursor-pointer hover:border-[#22C55E] hover:text-[#E5E5E5] transition-colors">
              <input
                type="file"
                accept=".json,.tokens,.tokens.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    setImportJson(reader.result as string);
                    setImportError(null);
                  };
                  reader.readAsText(file);
                }}
              />
              upload .tokens.json
            </label>
            {importJson.trim().length > 2 && (
              <button
                type="button"
                onClick={() => {
                  try {
                    const source = fileKey ? { fileKey, url: fileUrl } : undefined;
                    const tokens = parseImportedTokens(importJson, source);
                    if (tokens.colors.length === 0 && tokens.textStyles.length === 0 && tokens.spacing.length === 0 && tokens.radii.length === 0) {
                      setImportError("No tokens found in JSON. Check the format.");
                      return;
                    }
                    onImport(tokens);
                  } catch (e) {
                    setImportError(e instanceof Error ? e.message : "Invalid JSON");
                  }
                }}
                className="flex items-center gap-2 bg-[#22C55E] rounded px-4 py-2 font-mono text-[11px] font-semibold text-[#0C0C0C]"
              >
                <IconArrowRight />
                import_tokens &gt;
              </button>
            )}
          </div>
          {importError && (
            <div className="font-mono text-[11px] text-red-400">{importError}</div>
          )}
        </Card>

        {/* Page selection (when using file load) */}
        {fileInfo && !hasDirectIds && (
          <Card>
            <div className="flex items-center justify-between">
              <StepBadge num={5} title="select_page" />
              {selectedPage && (
                <StatusDot color="#22C55E" label={selectedPage.name} />
              )}
            </div>
            <Comment>
              {`// pages found in "${fileInfo.name}" — pick the page containing your design tokens`}
            </Comment>
            <div className="flex flex-col gap-0.5">
              {fileInfo.pages.map((page) => {
                const isSelected = selectedPage?.id === page.id;
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => handleSelectPage(page)}
                    className={`flex items-center gap-3 rounded px-3 py-2.5 text-left ${
                      isSelected
                        ? "bg-[#1A1A1A] border border-[#22C55E]"
                        : "hover:bg-[#1A1A1A]/50"
                    }`}
                  >
                    {isSelected ? <IconPalette /> : <IconLayoutDashboard />}
                    <div className="flex flex-col gap-0.5 flex-1">
                      <span
                        className={`font-mono text-[13px] ${
                          isSelected
                            ? "font-medium text-[#E5E5E5]"
                            : "text-[#A3A3A3]"
                        }`}
                      >
                        {page.name}
                      </span>
                      <span className="font-mono text-[11px] text-[#a3a3a3]">
                        {page.children.length} frames
                      </span>
                    </div>
                    {isSelected && <IconCheck />}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Frame selection (when using file load) */}
        {selectedPage && frames.length > 0 && !hasDirectIds && (
          <Card>
            <div className="flex items-center justify-between">
              <StepBadge num={6} title="select_frames" />
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-[#A3A3A3]">
                  {selectedFrames.size} of {frames.length} selected
                </span>
                <button
                  type="button"
                  onClick={selectAllFrames}
                  className="font-mono text-[11px] text-[#A3A3A3] border border-[#525252] rounded px-2 py-1"
                >
                  select all
                </button>
              </div>
            </div>
            <Comment>
              {"// choose which frames to extract tokens from — click thumbnail to preview full size"}
            </Comment>
            <div className="flex gap-4 flex-wrap">
              {frames.map((frame) => {
                const isSelected = selectedFrames.has(frame.id);
                const imageUrl = frameImages[frame.id];
                return (
                  <button
                    key={frame.id}
                    type="button"
                    onClick={() => toggleFrame(frame.id)}
                    className={`flex flex-col rounded overflow-hidden w-[190px] border-2 text-left ${
                      isSelected ? "border-[#22C55E]" : "border-[#252525]"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center bg-[#1A1A1A] h-[120px] overflow-hidden">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={frame.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <span className="text-[#333333] text-3xl font-mono">
                            {frame.name.charAt(0)}
                          </span>
                          <span className="font-mono text-[10px] text-[#737373]">
                            {frame.name}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 bg-[#171717] p-2.5">
                      <span
                        className={`font-mono text-xs truncate ${
                          isSelected
                            ? "text-[#E5E5E5] font-medium"
                            : "text-[#A3A3A3]"
                        }`}
                      >
                        {frame.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Action bar — direct frame IDs */}
        {hasDirectIds && (
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#a3a3a3]">
              {`// ready: ${parsedDirectIds.length} frame IDs provided directly (skipping file load)`}
            </span>
            <button
              type="button"
              onClick={() => onNext(parsedDirectIds)}
              className="flex items-center gap-2 bg-[#22C55E] rounded px-5 py-2.5 font-mono text-[13px] font-semibold text-[#0C0C0C]"
            >
              <IconArrowRight />
              extract_tokens &gt;
            </button>
          </div>
        )}

        {/* Action bar — file-loaded selection */}
        {!hasDirectIds && selectedPage && selectedFrames.size > 0 && (
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#a3a3a3]">
              {`// ready: ${selectedFrames.size} frames selected from "${selectedPage.name}" page`}
            </span>
            <button
              type="button"
              onClick={() => onNext()}
              className="flex items-center gap-2 bg-[#22C55E] rounded px-5 py-2.5 font-mono text-[13px] font-semibold text-[#0C0C0C]"
            >
              <IconArrowRight />
              extract_tokens &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Step 2: Extracted ─── */
function ExtractedStep({
  onNext,
  tokens,
}: {
  onNext: () => void;
  tokens: ExtractedTokens;
}) {
  const stats = [
    { value: String(tokens.colors.length), label: "colors" },
    { value: String(tokens.textStyles.length), label: "text_styles" },
    { value: String(tokens.spacing.length), label: "spacing" },
    { value: String(tokens.radii.length), label: "radii" },
  ];

  const totalVars =
    tokens.colors.length +
    tokens.textStyles.length +
    tokens.spacing.length +
    tokens.radii.length;

  return (
    <div className="flex flex-col gap-8 p-12 overflow-y-auto flex-1">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-mono text-[32px] font-semibold text-[#E5E5E5]">
            extraction_preview
          </h1>
          <Comment>
            {`// found ${totalVars} variables across ${stats.filter((s) => Number(s.value) > 0).length} categories`}
          </Comment>
        </div>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 bg-[#22C55E] rounded px-4 py-2 font-mono text-[13px] font-semibold text-[#0C0C0C]"
        >
          continue &gt;
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col gap-1 bg-[#171717] border border-[#1F1F1F] rounded px-5 py-4 flex-1"
          >
            <span className="font-mono text-[28px] font-semibold text-[#22C55E]">
              {s.value}
            </span>
            <span className="font-mono text-xs text-[#a3a3a3]">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Panels */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Colors */}
        <div className="flex flex-col gap-4 bg-[#171717] border border-[#1F1F1F] rounded p-5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-medium text-[#E5E5E5]">
              colors
            </span>
            <span className="font-mono text-[11px] text-[#a3a3a3]">
              {tokens.colors.length} found
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {tokens.colors.map((c, i) => (
              <div key={`${c.hex}-${i}`} className="flex items-center gap-2.5">
                <span
                  className="w-4 h-4 rounded-sm shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="font-mono text-xs text-[#A3A3A3] flex-1 truncate">
                  {c.name}
                </span>
                <span className="font-mono text-xs text-[#a3a3a3]">
                  {c.hex}
                </span>
              </div>
            ))}
            {tokens.colors.length === 0 && (
              <span className="font-mono text-[11px] text-[#525252]">
                no color variables found
              </span>
            )}
          </div>
        </div>

        {/* Spacing + Radii */}
        <div className="flex flex-col gap-4 bg-[#171717] border border-[#1F1F1F] rounded p-5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-medium text-[#E5E5E5]">
              spacing &amp; radii
            </span>
            <span className="font-mono text-[11px] text-[#a3a3a3]">
              {tokens.spacing.length + tokens.radii.length} found
            </span>
          </div>
          {tokens.spacing.length > 0 && (
            <>
              <span className="font-mono text-xs text-[#525252]">spacing</span>
              <div className="flex flex-col gap-1.5">
                {tokens.spacing.map((s, i) => (
                  <div key={`s-${i}`} className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#A3A3A3] truncate flex-1">
                      {s.name}
                    </span>
                    <span className="font-mono text-xs text-[#a3a3a3]">
                      {s.value}px
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          {tokens.radii.length > 0 && (
            <>
              <span className="font-mono text-xs text-[#525252] mt-2">
                radii
              </span>
              <div className="flex flex-col gap-1.5">
                {tokens.radii.map((r, i) => (
                  <div key={`r-${i}`} className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#A3A3A3] truncate flex-1">
                      {r.name}
                    </span>
                    <span className="font-mono text-xs text-[#a3a3a3]">
                      {r.value}px
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          {tokens.spacing.length === 0 && tokens.radii.length === 0 && (
            <span className="font-mono text-[11px] text-[#525252]">
              no spacing/radii variables found
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 3: Map & Review ─── */

function MapReviewStep({
  onNext,
  tokens,
  fileUrl,
}: {
  onNext: () => void;
  tokens: ExtractedTokens;
  fileUrl: string;
}) {
  const merged = mergeTextStyles(tokens.textStyles);

  const allItems = [
    ...merged.map((m, i) => ({ id: `textStyle-${i}`, name: m.semanticName, type: "textStyle" as const, color: undefined, icon: "T" })),
    ...tokens.colors.map((c, i) => ({ id: `color-${i}`, name: c.name, type: "color" as const, color: c.hex, icon: undefined })),
    ...tokens.spacing.map((s, i) => ({ id: `spacing-${i}`, name: s.name, type: "spacing" as const, color: undefined, icon: undefined })),
    ...tokens.radii.map((r, i) => ({ id: `radius-${i}`, name: r.name, type: "radius" as const, color: undefined, icon: undefined })),
  ].sort((a, b) => {
    // Primary: group by type (textStyle, color, spacing, radius)
    const typeOrder = { textStyle: 0, color: 1, spacing: 2, radius: 3 };
    const typeDiff = typeOrder[a.type] - typeOrder[b.type];
    if (typeDiff !== 0) return typeDiff;
    // Secondary: alphabetical within type
    return a.name.localeCompare(b.name);
  });

  const [selected, setSelected] = useState(allItems[0]?.id || "");
  const [excludedTokens, setExcludedTokens] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const selectedItem = allItems.find((i) => i.id === selected);
  const toggleExclude = (id: string) => {
    setExcludedTokens((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setMenuOpenId(null);
  };

  // Find corresponding token data by parsing the selected id
  const selectedIdx = parseInt(selected.split("-").pop() || "0", 10);
  const selectedColor = selected.startsWith("color-") ? tokens.colors[selectedIdx] : undefined;
  const selectedSpacing = selected.startsWith("spacing-") ? tokens.spacing[selectedIdx] : undefined;
  const selectedRadius = selected.startsWith("radius-") ? tokens.radii[selectedIdx] : undefined;
  const selectedMerged = selected.startsWith("textStyle-") ? merged[selectedIdx] : undefined;
  // Note: IDs like textStyle-3 always reference the original array index in `merged`,
  // so sorting allItems for display doesn't break the lookup.

  // Build figma link helper
  const figmaFileKey = parseFileKeyFromUrl(fileUrl);
  const figmaNodeLink = (nodeId: string) =>
    figmaFileKey ? `https://figma.com/design/${figmaFileKey}?node-id=${nodeId.replace(":", "-")}` : null;

  return (
    <div className="flex flex-col gap-8 p-12 overflow-y-auto flex-1">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-mono text-[32px] font-semibold text-[#E5E5E5]">
            map_and_review
          </h1>
          <Comment>
            {"// review extracted tokens and their values"}
          </Comment>
        </div>
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 bg-[#22C55E] rounded px-4 py-2 font-mono text-[13px] font-semibold text-[#0C0C0C]"
        >
          export &gt;
        </button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Token list */}
        <div className="flex flex-col bg-[#171717] border border-[#1F1F1F] rounded w-[260px] shrink-0 pt-4 overflow-y-auto">
          <div className="flex items-center justify-between px-4 pb-3">
            <span className="font-mono text-[13px] font-medium text-[#A3A3A3]">
              tokens
            </span>
            <span className="font-mono text-[11px] text-[#a3a3a3]">
              {allItems.length - excludedTokens.size}{excludedTokens.size > 0 ? ` (${excludedTokens.size} excluded)` : ""}
            </span>
          </div>
          <div className="h-px bg-[#252525]" />
          <div className="flex flex-col">
            {allItems.map((item) => {
              const isExcluded = excludedTokens.has(item.id);
              const isMenuOpen = menuOpenId === item.id;
              return (
              <div key={item.id} className="relative">
                <button
                  type="button"
                  onClick={() => setSelected(item.id)}
                  className={`flex items-center justify-between w-full px-4 py-2.5 text-left group ${
                    selected === item.id
                      ? "bg-[#1A1A1A]"
                      : "hover:bg-[#1A1A1A]/50"
                  } ${isExcluded ? "opacity-40" : ""}`}
                >
                  <span
                    className={`font-mono text-xs truncate ${
                      selected === item.id
                        ? "text-[#22C55E] font-medium"
                        : "text-[#A3A3A3]"
                    } ${isExcluded ? "line-through" : ""}`}
                  >
                    {item.name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {item.color && (
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: item.color,
                          border:
                            item.color === "#ffffff" || item.color === "#FFFFFF"
                              ? "1px solid #525252"
                              : undefined,
                        }}
                      />
                    )}
                    {item.icon && (
                      <span className="font-mono text-[10px] text-[#525252]">
                        {item.icon}
                      </span>
                    )}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); setMenuOpenId(isMenuOpen ? null : item.id); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setMenuOpenId(isMenuOpen ? null : item.id); } }}
                      className="font-mono text-[11px] text-[#525252] hover:text-[#A3A3A3] opacity-0 group-hover:opacity-100 transition-opacity px-1 cursor-pointer select-none"
                    >
                      ···
                    </span>
                  </div>
                </button>
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                    <div className="absolute right-2 top-full z-20 bg-[#1A1A1A] border border-[#333] rounded shadow-lg py-1 min-w-[140px]">
                      <button
                        type="button"
                        onClick={() => toggleExclude(item.id)}
                        className="w-full text-left px-3 py-1.5 font-mono text-[11px] text-[#A3A3A3] hover:bg-[#252525] hover:text-[#E5E5E5]"
                      >
                        {isExcluded ? "include_token" : "exclude_token"}
                      </button>
                    </div>
                  </>
                )}
              </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex flex-col gap-6 bg-[#171717] border border-[#1F1F1F] rounded p-6 flex-1">
          {selectedItem ? (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-xl font-semibold text-[#22C55E]">
                  {selectedItem.name}
                </span>
                <span className="font-mono text-[11px] text-[#a3a3a3]">
                  {`// type: ${selectedItem.type}`}
                </span>
              </div>

              {/* Color detail */}
              {selectedColor && (
                <>
                  <div className="flex items-center gap-4 bg-[#1A1A1A] rounded p-5">
                    <span
                      className="w-16 h-16 rounded"
                      style={{ backgroundColor: selectedColor.hex }}
                    />
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-sm text-[#E5E5E5]">
                        {selectedColor.hex}
                      </span>
                      <span className="font-mono text-xs text-[#a3a3a3]">
                        rgba({Math.round(selectedColor.rgba.r * 255)},{" "}
                        {Math.round(selectedColor.rgba.g * 255)},{" "}
                        {Math.round(selectedColor.rgba.b * 255)},{" "}
                        {selectedColor.rgba.a.toFixed(2)})
                      </span>
                      {selectedColor.figmaStyleName && (
                        <span className="font-mono text-xs text-[#22C55E]">
                          figma style: {selectedColor.figmaStyleName}
                        </span>
                      )}
                      <span className="font-mono text-xs text-[#525252]">
                        collection: {selectedColor.collection}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-[13px] font-medium text-[#A3A3A3]">
                      css_output_preview
                    </span>
                    <div className="bg-[#0C0C0C] border border-[#252525] rounded p-4">
                      <pre className="font-mono text-[11px] leading-relaxed">
                        <span className="text-[#22C55E]">
                          {`:root {`}
                        </span>
                        {"\n"}
                        <span className="text-[#A3A3A3]">
                          {`  --color-${selectedColor.name.replace(/[/ ]/g, "-").toLowerCase()}: ${selectedColor.hex};`}
                        </span>
                        {"\n"}
                        <span className="text-[#22C55E]">{"}"}</span>
                      </pre>
                    </div>
                  </div>
                  {/* Source reference */}
                  {selectedColor.sourceUrl && (
                    <div className="flex flex-col gap-2">
                      <span className="font-mono text-[13px] font-medium text-[#A3A3A3]">source_reference</span>
                      <div className="flex flex-col gap-1.5 bg-[#1A1A1A] rounded p-4">
                        <a href={selectedColor.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-[#22C55E] hover:underline">
                          {selectedColor.figmaStyleName || selectedColor.name} &rarr; Figma
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Text style detail (merged Desktop/Mobile) */}
              {selectedMerged && (() => {
                const dt = selectedMerged.desktop;
                const mb = selectedMerged.mobile;
                const primary = dt || mb;
                if (!primary) return null;
                const desktopSize = dt?.fontSize[0];
                const mobileSize = mb?.fontSize[0];
                const weightLabel = selectedMerged.fontWeight <= 400 ? "regular" : selectedMerged.fontWeight <= 500 ? "medium" : selectedMerged.fontWeight <= 600 ? "semibold" : "bold";
                const cssName = `.${selectedMerged.semanticName}`;

                return (
                  <>
                    {/* Description */}
                    <span className="font-mono text-[11px] text-[#a3a3a3]">
                      {`// semantic recipe: font + weight + size + lineHeight + spacing`}
                    </span>

                    {/* Preview */}
                    <div className="flex flex-col gap-2 bg-[#1A1A1A] rounded p-5">
                      <span className="font-mono text-[11px] text-[#a3a3a3]">preview</span>
                      <span
                        className="text-[#E5E5E5]"
                        style={{
                          fontFamily: `${selectedMerged.fontFamily}, system-ui`,
                          fontSize: Math.min(desktopSize || mobileSize || 16, 72),
                          fontWeight: selectedMerged.fontWeight,
                          fontStyle: selectedMerged.fontStyle === "italic" ? "italic" : undefined,
                          lineHeight: selectedMerged.lineHeight,
                        }}
                      >
                        The quick brown fox jumps over the lazy dog
                      </span>
                      <span
                        className="text-[#a3a3a3]"
                        style={{
                          fontFamily: `${selectedMerged.fontFamily}, system-ui`,
                          fontSize: 16,
                          fontWeight: selectedMerged.fontWeight,
                        }}
                      >
                        ABCDEFGHIJKLM  abcdefghijklm  0123456789
                      </span>
                    </div>

                    {/* Base properties */}
                    <div className="flex flex-col gap-3">
                      <span className="font-mono text-[13px] font-medium text-[#A3A3A3]">base_properties</span>
                      <div className="flex flex-col gap-1.5 bg-[#1A1A1A] rounded p-4">
                        {[
                          ["font_family", selectedMerged.fontFamily],
                          ["font_weight", `${selectedMerged.fontWeight} (${weightLabel})`],
                          ["line_height", `${selectedMerged.lineHeight}`],
                          ...(selectedMerged.fontStyle === "italic" ? [["font_style", "italic"]] : []),
                        ].map(([key, val]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="font-mono text-xs text-[#a3a3a3]">{key}</span>
                            <span className="font-mono text-xs text-[#E5E5E5]">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Responsive breakpoints */}
                    <div className="flex flex-col gap-3">
                      <span className="font-mono text-[13px] font-medium text-[#A3A3A3]">responsive_breakpoints</span>
                      <div className="flex gap-4">
                        {/* Desktop / lg column */}
                        <div className="flex flex-col gap-2 bg-[#1A1A1A] rounded p-4 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-[#0C0C0C] bg-[#22C55E] rounded px-2 py-0.5">lg</span>
                            <span className="font-mono text-[11px] text-[#a3a3a3]">&gt;= 1024px</span>
                          </div>
                          <div className="h-px bg-[#252525]" />
                          {desktopSize ? (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs text-[#a3a3a3]">font_size</span>
                                <span className="font-mono text-xs font-medium text-[#E5E5E5]">{desktopSize}px</span>
                              </div>
                            </>
                          ) : (
                            <span className="font-mono text-[11px] text-[#525252]">no desktop variant</span>
                          )}
                        </div>

                        {/* Mobile / sm column */}
                        <div className="flex flex-col gap-2 bg-[#1A1A1A] rounded p-4 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-[#E5E5E5] bg-[#525252] rounded px-2 py-0.5">sm</span>
                            <span className="font-mono text-[11px] text-[#a3a3a3]">&lt; 1024px</span>
                          </div>
                          <div className="h-px bg-[#252525]" />
                          {mobileSize ? (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs text-[#a3a3a3]">font_size</span>
                                <span className="font-mono text-xs font-medium text-[#E5E5E5]">{mobileSize}px</span>
                              </div>
                            </>
                          ) : (
                            <span className="font-mono text-[11px] text-[#525252]">no mobile variant</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CSS output preview */}
                    <div className="flex flex-col gap-2">
                      <span className="font-mono text-[13px] font-medium text-[#A3A3A3]">css_output_preview</span>
                      <div className="bg-[#0C0C0C] border border-[#252525] rounded p-4">
                        <pre className="font-mono text-[11px] leading-relaxed">
                          <span className="text-[#22C55E]">{`${cssName} {`}</span>
                          {"\n"}
                          <span className="text-[#A3A3A3]">{`  font-family: var(--font-primary);`}</span>
                          {"\n"}
                          <span className="text-[#A3A3A3]">{`  font-weight: var(--font-weight-${weightLabel});`}</span>
                          {"\n"}
                          <span className="text-[#A3A3A3]">{`  font-size: ${mobileSize || desktopSize}px;`}</span>
                          {"\n"}
                          <span className="text-[#A3A3A3]">{`  line-height: ${selectedMerged.lineHeight};`}</span>
                          {desktopSize && mobileSize && desktopSize !== mobileSize ? (
                            <>
                              {"\n\n"}
                              <span className="text-[#22C55E]">{`  @media (min-width: 1024px) {`}</span>
                              {"\n"}
                              <span className="text-[#A3A3A3]">{`    font-size: ${desktopSize}px;`}</span>
                              {"\n"}
                              <span className="text-[#22C55E]">{`  }`}</span>
                            </>
                          ) : null}
                          {"\n"}
                          <span className="text-[#22C55E]">{"}"}</span>
                        </pre>
                      </div>
                    </div>

                    {/* Source reference */}
                    {(() => {
                      const dtUrl = dt?.sourceUrl;
                      const mbUrl = mb?.sourceUrl;
                      const dtNodes = dt?.sourceNodeIds || [];
                      const mbNodes = mb?.sourceNodeIds || [];
                      if (!dtUrl && !mbUrl && dtNodes.length === 0 && mbNodes.length === 0) return null;
                      return (
                        <div className="flex flex-col gap-2">
                          <span className="font-mono text-[13px] font-medium text-[#A3A3A3]">source_reference</span>
                          <div className="flex flex-col gap-1.5 bg-[#1A1A1A] rounded p-4">
                            {dt && (
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs text-[#a3a3a3]">desktop</span>
                                {dtUrl ? (
                                  <a href={dtUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-[#22C55E] hover:underline">
                                    {dt.figmaStyleName || dt.name} &rarr;
                                  </a>
                                ) : (
                                  <span className="font-mono text-[11px] text-[#a3a3a3]">{dt.figmaStyleName || dt.name}</span>
                                )}
                              </div>
                            )}
                            {mb && (
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs text-[#a3a3a3]">mobile</span>
                                {mbUrl ? (
                                  <a href={mbUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-[#22C55E] hover:underline">
                                    {mb.figmaStyleName || mb.name} &rarr;
                                  </a>
                                ) : (
                                  <span className="font-mono text-[11px] text-[#a3a3a3]">{mb.figmaStyleName || mb.name}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                );
              })()}

              {/* Spacing/Radius detail */}
              {(selectedSpacing || selectedRadius) && (
                <>
                  <div className="flex flex-col gap-2 bg-[#1A1A1A] rounded p-5">
                    <span className="font-mono text-xs text-[#a3a3a3]">value</span>
                    <span className="font-mono text-2xl font-semibold text-[#E5E5E5]">
                      {(selectedSpacing || selectedRadius)!.value}px
                    </span>
                    {selectedSpacing && (
                      <div className="bg-[#22C55E]/20 rounded" style={{ width: Math.min(selectedSpacing.value * 2, 300), height: 8 }} />
                    )}
                    {selectedRadius && (
                      <div className="bg-[#22C55E]/20 w-16 h-16" style={{ borderRadius: selectedRadius.value }} />
                    )}
                  </div>
                  {/* Source reference */}
                  {(() => {
                    const item = (selectedSpacing || selectedRadius)!;
                    if (!item.sourceUrl && (!item.sourceNodeIds || item.sourceNodeIds.length === 0)) return null;
                    return (
                      <div className="flex flex-col gap-2">
                        <span className="font-mono text-[13px] font-medium text-[#A3A3A3]">source_reference</span>
                        <div className="flex flex-wrap gap-1.5 bg-[#1A1A1A] rounded p-4">
                          {item.sourceUrl ? (
                            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-[#22C55E] hover:underline">
                              {item.name} &rarr; Figma
                            </a>
                          ) : item.sourceNodeIds?.slice(0, 8).map((nid) => {
                            const link = figmaNodeLink(nid);
                            return link ? (
                              <a key={nid} href={link} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-[#22C55E] bg-[#0C0C0C] rounded px-2 py-1 hover:bg-[#252525]">{nid}</a>
                            ) : (
                              <span key={nid} className="font-mono text-[10px] text-[#a3a3a3] bg-[#0C0C0C] rounded px-2 py-1">{nid}</span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-[13px] font-medium text-[#A3A3A3]">css_output_preview</span>
                    <div className="bg-[#0C0C0C] border border-[#252525] rounded p-4">
                      <pre className="font-mono text-[11px] leading-relaxed">
                        <span className="text-[#22C55E]">{`:root {`}</span>
                        {"\n"}
                        <span className="text-[#A3A3A3]">
                          {`  --${selectedSpacing ? "spacing" : "radius"}-${(selectedSpacing || selectedRadius)!.name.replace(/[/ ]/g, "-").toLowerCase()}: ${(selectedSpacing || selectedRadius)!.value}px;`}
                        </span>
                        {"\n"}
                        <span className="text-[#22C55E]">{"}"}</span>
                      </pre>
                    </div>
                  </div>
                </>
              )}

              {/* Source nodes for colors */}
              {selectedColor && selectedColor.sourceNodeIds && selectedColor.sourceNodeIds.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[13px] font-medium text-[#A3A3A3]">source_nodes</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedColor.sourceNodeIds.slice(0, 8).map((nid) => {
                      const link = figmaNodeLink(nid);
                      return link ? (
                        <a key={nid} href={link} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-[#22C55E] bg-[#1A1A1A] rounded px-2 py-1 hover:bg-[#252525]">{nid}</a>
                      ) : (
                        <span key={nid} className="font-mono text-[10px] text-[#a3a3a3] bg-[#1A1A1A] rounded px-2 py-1">{nid}</span>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center flex-1">
              <span className="font-mono text-xs text-[#525252]">
                select a token to view details
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 4: Export ─── */
function ExportStep({
  tokens,
  savedClasses,
  onUpdateClasses,
}: {
  tokens: ExtractedTokens;
  savedClasses: TypographyClassDef[];
  onUpdateClasses: (classes: TypographyClassDef[]) => void;
}) {
  const cssOutput = generateCSSFromTokens(tokens);
  const jsonOutput = generateJSONFromTokens(tokens);
  const tailwindOutput = generateTailwindConfigFromTokens(tokens);

  const [selectedFormat, setSelectedFormat] = useState<"json" | "css" | "tailwind">("json");
  const [copied, setCopied] = useState(false);
  const [htmlInput, setHtmlInput] = useState("");
  const [validationResults, setValidationResults] = useState<{ name: string; found: boolean }[] | null>(null);

  const formats = [
    {
      key: "json" as const,
      name: "design-tokens.json",
      desc: "// full token config with colors, spacing, and radii",
      size: `${(new Blob([jsonOutput]).size / 1024).toFixed(1)} KB`,
    },
    {
      key: "css" as const,
      name: "design-tokens.css",
      desc: "// CSS custom properties for all extracted tokens",
      size: `${(new Blob([cssOutput]).size / 1024).toFixed(1)} KB`,
    },
    {
      key: "tailwind" as const,
      name: "tailwind.config.js",
      desc: "// Tailwind CSS config with extracted theme values",
      size: `${(new Blob([tailwindOutput]).size / 1024).toFixed(1)} KB`,
    },
  ];

  const currentOutput =
    selectedFormat === "json"
      ? jsonOutput
      : selectedFormat === "css"
        ? cssOutput
        : tailwindOutput;

  const currentFileName = formats.find((f) => f.key === selectedFormat)!.name;

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-8 p-12 overflow-y-auto flex-1">
      <div className="flex flex-col gap-2">
        <h1 className="font-mono text-[32px] font-semibold text-[#E5E5E5]">
          export_config
        </h1>
        <Comment>
          {"// select output format and download your design token configuration"}
        </Comment>
      </div>

      {/* Format cards */}
      <div className="flex gap-4">
        {formats.map((fmt) => {
          const isSelected = selectedFormat === fmt.key;
          return (
            <button
              key={fmt.key}
              type="button"
              onClick={() => setSelectedFormat(fmt.key)}
              className={`flex flex-col gap-3 bg-[#171717] border-2 rounded p-5 flex-1 text-left ${
                isSelected ? "border-[#22C55E]" : "border-[#252525]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-medium text-[#E5E5E5]">
                  {fmt.name}
                </span>
                {isSelected && (
                  <span className="bg-[#22C55E] text-[#0C0C0C] font-mono text-[10px] font-medium rounded-sm px-2 py-0.5">
                    selected
                  </span>
                )}
              </div>
              <p className="font-mono text-[11px] text-[#a3a3a3] leading-relaxed whitespace-pre-line">
                {fmt.desc}
              </p>
              <span className="font-mono text-[11px] text-[#a3a3a3]">
                {fmt.size}
              </span>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleDownload(currentOutput, currentFileName)}
          className="flex items-center gap-2 bg-[#22C55E] rounded h-11 px-6 font-mono text-sm font-medium text-[#0C0C0C]"
        >
          <IconDownload />
          download {currentFileName}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center h-11 px-6 rounded border border-[#252525] font-mono text-sm font-medium text-[#A3A3A3]"
        >
          {copied ? "copied!" : "copy_to_clipboard"}
        </button>
        <button
          type="button"
          onClick={() => {
            handleDownload(jsonOutput, "design-tokens.json");
            handleDownload(cssOutput, "design-tokens.css");
            handleDownload(tailwindOutput, "tailwind.config.js");
          }}
          className="flex items-center justify-center h-11 px-6 rounded border border-[#252525] font-mono text-sm font-medium text-[#A3A3A3]"
        >
          export_all
        </button>
      </div>

      {/* Preview */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[13px] font-medium text-[#A3A3A3]">
          preview: {currentFileName}
        </span>
        <div className="bg-[#0C0C0C] border border-[#252525] rounded p-5 max-h-[400px] overflow-y-auto">
          <pre className="font-mono text-[11px] leading-relaxed text-[#A3A3A3] whitespace-pre-wrap">
            {currentOutput}
          </pre>
        </div>
      </div>

      {/* Validate class usage */}
      <div className="flex flex-col gap-4 border-t border-[#1F1F1F] pt-8">
        <div className="flex flex-col gap-2">
          <h2 className="font-mono text-lg font-semibold text-[#E5E5E5]">
            validate_usage
          </h2>
          <Comment>
            {"// check which typography classes are used on a page — configure classes via AI (WebMCP) or load from current tokens"}
          </Comment>
        </div>

        {/* Class list */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[13px] font-medium text-[#A3A3A3]">
              {savedClasses.length} classes configured
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const merged = mergeTextStyles(tokens.textStyles);
                  const classes: TypographyClassDef[] = merged.map((m) => ({
                    name: m.semanticName,
                    fontWeight: String(m.fontWeight),
                    fontSize: m.mobile ? `${m.mobile.fontSize[0]}px` : m.desktop ? `${m.desktop.fontSize[0]}px` : undefined,
                    lineHeight: String(m.lineHeight),
                    responsiveFontSize: m.desktop && m.mobile ? `${m.desktop.fontSize[0]}px` : undefined,
                  }));
                  onUpdateClasses(classes);
                }}
                className="font-mono text-[11px] text-[#A3A3A3] border border-[#252525] rounded px-3 py-1.5 hover:border-[#22C55E] hover:text-[#E5E5E5] transition-colors"
              >
                load_from_tokens
              </button>
              {savedClasses.length > 0 && (
                <button
                  type="button"
                  onClick={() => { onUpdateClasses([]); setValidationResults(null); }}
                  className="font-mono text-[11px] text-[#525252] border border-[#252525] rounded px-3 py-1.5 hover:border-red-500 hover:text-red-400 transition-colors"
                >
                  clear
                </button>
              )}
            </div>
          </div>

          {savedClasses.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {savedClasses.map((cls) => (
                <span
                  key={cls.name}
                  className={`font-mono text-[11px] px-2 py-1 rounded border ${
                    validationResults
                      ? validationResults.find((r) => r.name === cls.name)?.found
                        ? "border-[#22C55E] text-[#22C55E] bg-[#22C55E10]"
                        : "border-[#525252] text-[#525252] bg-[#52525210] line-through"
                      : "border-[#252525] text-[#A3A3A3]"
                  }`}
                >
                  .{cls.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* HTML input + validate */}
        {savedClasses.length > 0 && (
          <div className="flex flex-col gap-3">
            <textarea
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
              placeholder="paste page HTML source here to check class usage..."
              className="bg-[#1A1A1A] border border-[#252525] rounded px-3 py-2.5 w-full h-28 font-mono text-xs text-[#E5E5E5] outline-none resize-y placeholder:text-[#525252]"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const results = savedClasses.map((cls) => ({
                    name: cls.name,
                    found: htmlInput.includes(cls.name),
                  }));
                  setValidationResults(results);
                }}
                disabled={!htmlInput.trim()}
                className="flex items-center gap-2 bg-[#22C55E] rounded px-4 py-2 font-mono text-[11px] font-semibold text-[#0C0C0C] disabled:opacity-40"
              >
                <IconSearch />
                validate_classes
              </button>
              {validationResults && (
                <span className="font-mono text-[11px] text-[#A3A3A3]">
                  {validationResults.filter((r) => r.found).length}/{validationResults.length} classes found
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Frame Preview Modal ─── */
function FramePreviewModal({
  frame,
  imageUrl,
  onClose,
  onPrev,
  onNext,
  current,
  total,
}: {
  frame: FigmaFrame;
  imageUrl: string | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  current: number;
  total: number;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C0C0CDD] p-[60px]">
      <div className="flex flex-col bg-[#171717] border border-[#252525] rounded-lg w-[900px] max-h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-semibold text-[#E5E5E5]">
              {frame.name}
            </span>
            {frame.absoluteBoundingBox && (
              <span className="font-mono text-xs text-[#525252]">
                {Math.round(frame.absoluteBoundingBox.width)} ×{" "}
                {Math.round(frame.absoluteBoundingBox.height)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded border border-[#333333]"
          >
            <IconX />
          </button>
        </div>

        <div className="h-px bg-[#252525]" />

        {/* Body */}
        <div className="flex items-center justify-center bg-[#1A1A1A] h-[500px]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={frame.name}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3">
              <IconImage />
              <span className="font-mono text-[13px] text-[#333333]">
                loading frame preview...
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#171717]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrev}
              className="flex items-center justify-center w-8 h-8 rounded border border-[#333333]"
            >
              <IconChevronLeft />
            </button>
            <span className="font-mono text-[11px] text-[#525252]">
              {current} of {total} frames
            </span>
            <button
              type="button"
              onClick={onNext}
              className="flex items-center justify-center w-8 h-8 rounded border border-[#333333]"
            >
              <IconChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function TokenToolPage() {
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<Step>("connect");

  // Connect state
  const [token, setToken] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileInfo, setFileInfo] = useState<FigmaFileInfo | null>(null);
  const [selectedPage, setSelectedPage] = useState<FigmaPage | null>(null);
  const [selectedFrames, setSelectedFrames] = useState<Set<string>>(new Set());
  const [frameImages, setFrameImages] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Extracted tokens + raw figma nodes for AI analysis
  const [tokens, setTokens] = useState<ExtractedTokens | null>(null);
  const [rawNodes, setRawNodes] = useState<Record<string, unknown>[]>([]);

  // Saved typography classes (localStorage)
  const [savedClasses, setSavedClasses] = useState<TypographyClassDef[]>([]);

  // Modal
  const [modalFrameIndex, setModalFrameIndex] = useState<number | null>(null);

  // Restore from sessionStorage on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setStep(saved.step);
      setToken(saved.token);
      setFileUrl(saved.fileUrl);
      setFileInfo(saved.fileInfo);
      if (saved.fileInfo && saved.selectedPageId) {
        const page = saved.fileInfo.pages.find((p) => p.id === saved.selectedPageId);
        if (page) setSelectedPage(page);
      }
      setSelectedFrames(new Set(saved.selectedFrameIds));
      setTokens(saved.tokens);
      if (saved.rawNodes) setRawNodes(saved.rawNodes);
    }
    setSavedClasses(loadClasses());
    setHydrated(true);
  }, []);

  // Persist to sessionStorage on changes
  useEffect(() => {
    if (!hydrated) return;
    saveSession({
      step,
      token,
      fileUrl,
      fileInfo,
      selectedPageId: selectedPage?.id || null,
      selectedFrameIds: Array.from(selectedFrames),
      tokens,
      rawNodes,
    });
  }, [hydrated, step, token, fileUrl, fileInfo, selectedPage, selectedFrames, tokens, rawNodes]);

  // Refs for WebMCP callbacks
  const tokensRef = useRef(tokens);
  const stepRef = useRef(step);
  const rawNodesRef = useRef(rawNodes);
  const savedClassesRef = useRef(savedClasses);
  tokensRef.current = tokens;
  stepRef.current = step;
  rawNodesRef.current = rawNodes;
  savedClassesRef.current = savedClasses;

  const updateSavedClasses = useCallback((classes: TypographyClassDef[]) => {
    setSavedClasses(classes);
    saveClasses(classes);
  }, []);

  // Extract tokens when moving to extracted step
  // Accepts optional frameIdOverride for direct frame ID input (bypasses selectedFrames state)
  const handleExtract = useCallback(async (frameIdOverride?: string[]) => {
    const fileKey = parseFileKeyFromUrl(fileUrl);
    if (!fileKey || !token) return;
    const frameIds = frameIdOverride || Array.from(selectedFrames);
    if (frameIds.length === 0) return;
    setLoading("extract");
    setError(null);
    try {
      const result = await fetchVariables(token, fileKey, frameIds, fileInfo?.styles, fileInfo?.fillStyleColors);
      setTokens(result.tokens);
      setRawNodes(result.rawNodes);
      setStep("extracted");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to extract tokens");
    } finally {
      setLoading(null);
    }
  }, [fileUrl, token, selectedFrames, fileInfo?.styles, fileInfo?.fillStyleColors]);

  // WebMCP integration
  useEffect(() => {
    const updateTokenName = (type: string, oldName: string, newName: string) => {
      setTokens((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        if (type === "color") {
          next.colors = next.colors.map((c) =>
            c.name === oldName ? { ...c, name: newName } : c
          );
        } else if (type === "spacing") {
          next.spacing = next.spacing.map((s) =>
            s.name === oldName ? { ...s, name: newName } : s
          );
        } else if (type === "radius") {
          next.radii = next.radii.map((r) =>
            r.name === oldName ? { ...r, name: newName } : r
          );
        }
        return next;
      });
    };

    // Expose global API for browser automation / WebMCP
    const importFn = (imported: ExtractedTokens) => { setTokens(imported); setStep("extracted"); };
    const w = window as Window & {
      tokenTool?: {
        importTokens: (json: string, source?: { fileKey?: string; nodeId?: string; nodeIdMap?: Record<string, string>; url?: string }) => string;
        getTokens: () => ExtractedTokens | null;
        getStep: () => string;
      };
    };
    w.tokenTool = {
      importTokens: (json: string, source?: { fileKey?: string; nodeId?: string; nodeIdMap?: Record<string, string>; url?: string }) => {
        const tokens = parseImportedTokens(json, source);
        const total = tokens.colors.length + tokens.textStyles.length + tokens.spacing.length + tokens.radii.length;
        if (total === 0) return "No tokens found in JSON";
        importFn(tokens);
        return `Imported ${tokens.colors.length} colors, ${tokens.textStyles.length} text styles, ${tokens.spacing.length} spacing, ${tokens.radii.length} radii`;
      },
      getTokens: () => tokensRef.current,
      getStep: () => stepRef.current,
    };

    initTokenToolWebMCP(
      () => tokensRef.current,
      () => stepRef.current,
      () => rawNodesRef.current,
      updateTokenName,
      importFn,
      () => savedClassesRef.current,
      updateSavedClasses
    ).catch(() => {
      // WebMCP not available — that's fine
    });

    return () => {
      destroyTokenToolWebMCP();
      delete w.tokenTool;
    };
  }, [updateSavedClasses]);

  // Modal frames
  const modalFrames = selectedPage?.children || [];
  const modalFrame = modalFrameIndex !== null ? modalFrames[modalFrameIndex] : null;

  return (
    <div className="flex h-screen bg-[#0C0C0C] text-white overflow-hidden">
      <Sidebar step={step} onStep={setStep} />

      {step === "connect" && (
        <ConnectStep
          onNext={handleExtract}
          onImport={(t) => { setTokens(t); setStep("extracted"); }}
          token={token}
          setToken={setToken}
          fileUrl={fileUrl}
          setFileUrl={setFileUrl}
          fileInfo={fileInfo}
          setFileInfo={setFileInfo}
          selectedPage={selectedPage}
          setSelectedPage={setSelectedPage}
          selectedFrames={selectedFrames}
          setSelectedFrames={setSelectedFrames}
          frameImages={frameImages}
          setFrameImages={setFrameImages}
          loading={loading}
          setLoading={setLoading}
          error={error}
          setError={setError}
        />
      )}
      {step === "extracted" && tokens && (
        <ExtractedStep
          onNext={() => setStep("map_review")}
          tokens={tokens}
        />
      )}
      {step === "map_review" && tokens && (
        <MapReviewStep onNext={() => setStep("export")} tokens={tokens} fileUrl={fileUrl} />
      )}
      {step === "export" && tokens && <ExportStep tokens={tokens} savedClasses={savedClasses} onUpdateClasses={updateSavedClasses} />}

      {/* Fallback if no tokens yet on later steps */}
      {step !== "connect" && !tokens && (
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-4">
            <span className="font-mono text-sm text-[#525252]">
              no tokens extracted yet
            </span>
            <button
              type="button"
              onClick={() => setStep("connect")}
              className="font-mono text-xs text-[#22C55E] underline"
            >
              go back to connect
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading === "extract" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C0C0CDD]">
          <div className="flex flex-col items-center gap-4">
            <IconLoader />
            <span className="font-mono text-sm text-[#A3A3A3]">
              extracting tokens from figma...
            </span>
          </div>
        </div>
      )}

      {modalFrame && modalFrameIndex !== null && (
        <FramePreviewModal
          frame={modalFrame}
          imageUrl={frameImages[modalFrame.id] || null}
          onClose={() => setModalFrameIndex(null)}
          onPrev={() =>
            setModalFrameIndex(
              (modalFrameIndex - 1 + modalFrames.length) % modalFrames.length
            )
          }
          onNext={() =>
            setModalFrameIndex((modalFrameIndex + 1) % modalFrames.length)
          }
          current={modalFrameIndex + 1}
          total={modalFrames.length}
        />
      )}
    </div>
  );
}
