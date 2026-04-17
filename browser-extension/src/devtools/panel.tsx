import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "../popup.css";

// ── Types ────────────────────────────────────────────────────────────────────

interface ClassChange {
  element: string;
  oldClasses: string;
  newClasses: string;
  timestamp: number;
}

interface ComputedStyles {
  [key: string]: string;
}

interface InspectTarget {
  selector: string;
  tagName: string;
  classes: string;
  additionalClasses: string;
  tabId: number;
  dimensions: string;
  computedStyles: ComputedStyles;
}

type Tab = "inspect" | "history";

// ── Property sections config ─────────────────────────────────────────────────

const PROPERTY_SECTIONS: {
  title: string;
  properties: { key: string; label: string }[];
}[] = [
  {
    title: "Typography",
    properties: [
      { key: "fontFamily", label: "font-family" },
      { key: "fontSize", label: "font-size" },
      { key: "fontWeight", label: "font-weight" },
      { key: "lineHeight", label: "line-height" },
      { key: "letterSpacing", label: "letter-spacing" },
      { key: "color", label: "color" },
      { key: "textAlign", label: "text-align" },
    ],
  },
  {
    title: "Spacing",
    properties: [
      { key: "paddingTop", label: "padding-top" },
      { key: "paddingRight", label: "padding-right" },
      { key: "paddingBottom", label: "padding-bottom" },
      { key: "paddingLeft", label: "padding-left" },
      { key: "marginTop", label: "margin-top" },
      { key: "marginRight", label: "margin-right" },
      { key: "marginBottom", label: "margin-bottom" },
      { key: "marginLeft", label: "margin-left" },
      { key: "gap", label: "gap" },
    ],
  },
  {
    title: "Layout",
    properties: [
      { key: "display", label: "display" },
      { key: "position", label: "position" },
      { key: "flexDirection", label: "flex-direction" },
      { key: "alignItems", label: "align-items" },
      { key: "justifyContent", label: "justify-content" },
    ],
  },
  {
    title: "Size",
    properties: [
      { key: "width", label: "width" },
      { key: "height", label: "height" },
      { key: "minWidth", label: "min-width" },
      { key: "maxWidth", label: "max-width" },
      { key: "minHeight", label: "min-height" },
      { key: "maxHeight", label: "max-height" },
    ],
  },
  {
    title: "Border",
    properties: [
      { key: "borderTopWidth", label: "border-width" },
      { key: "borderTopStyle", label: "border-style" },
      { key: "borderTopColor", label: "border-color" },
      { key: "borderTopLeftRadius", label: "border-radius" },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Try to parse an rgb/rgba string into a hex-ish display swatch color */
const isColorValue = (key: string) => key === "color" || key.includes("Color");

const getClassDiff = (oldClasses: string, newClasses: string) => {
  const oldSet = new Set(oldClasses.split(" ").filter(Boolean));
  const newSet = new Set(newClasses.split(" ").filter(Boolean));
  const removed = [...oldSet].filter((c) => !newSet.has(c));
  const added = [...newSet].filter((c) => !oldSet.has(c));
  const swapped =
    added.length === removed.length && added.length > 0
      ? added.map((n, i) => ({ from: removed[i], to: n }))
      : [];
  return { removed, added, swapped };
};

// ── Components ──────────────────────────────────────────────────────────────

const ColorSwatch = ({ value }: { value: string }) => (
  <span
    className="inline-block w-3 h-3 rounded-sm border border-[#DADCE0] dark:border-[#5f6368] shrink-0"
    style={{ backgroundColor: value }}
  />
);

const SectionChevron = ({ expanded }: { expanded: boolean }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    className={`transition-transform shrink-0 ${expanded ? "rotate-90" : ""}`}
  >
    <path
      d="M4 2l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── Main Panel ──────────────────────────────────────────────────────────────

const DevToolsPanel = () => {
  const [activeTab, setActiveTab] = useState<Tab>("inspect");
  const [changes, setChanges] = useState<ClassChange[]>([]);
  const [inspectTarget, setInspectTarget] = useState<InspectTarget | null>(
    null,
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["Typography", "Spacing"]),
  );
  const [addClassInput, setAddClassInput] = useState("");

  // ── Messaging ───────────────────────────────────────────────────────────

  useEffect(() => {
    const handleMessage = (message: any) => {
      // ── Class change (history) ──────────────────────────────────────
      if (message.type === "class_change") {
        const element = message.element;
        const newClasses = message.newClasses.trim();
        const oldClasses = message.oldClasses.trim();
        if (oldClasses === newClasses) return;

        setChanges((prev) => {
          const oldSet = new Set(oldClasses.split(" ").filter(Boolean));
          const newSet = new Set(newClasses.split(" ").filter(Boolean));
          const removed = [...oldSet].filter((c) => !newSet.has(c));
          const added = [...newSet].filter((c) => !oldSet.has(c));
          if (removed.length === 0 && added.length === 0) return prev;

          const existingIdx = prev.findIndex((c) => {
            if (c.element !== element) return false;
            const eOld = new Set(c.oldClasses.split(" ").filter(Boolean));
            const eNew = new Set(c.newClasses.split(" ").filter(Boolean));
            const eRemoved = [...eOld].filter((x) => !eNew.has(x));
            const eAdded = [...eNew].filter((x) => !eOld.has(x));
            return removed.some(
              (r) => eAdded.includes(r) || eRemoved.includes(r),
            );
          });

          if (existingIdx !== -1) {
            const existing = prev[existingIdx];
            if (existing.oldClasses === newClasses) {
              return [
                ...prev.slice(0, existingIdx),
                ...prev.slice(existingIdx + 1),
              ];
            }
            const updated = [...prev];
            updated[existingIdx] = {
              ...existing,
              newClasses,
              timestamp: Date.now(),
            };
            return updated;
          }
          return [
            { element, oldClasses, newClasses, timestamp: Date.now() },
            ...prev,
          ];
        });
      }

      // ── Move to devtools ────────────────────────────────────────────
      if (message.type === "move_to_devtools") {
        setInspectTarget({
          selector: message.selector,
          tagName: message.tagName,
          classes: message.classes,
          additionalClasses: message.additionalClasses || "",
          tabId: message.tabId,
          dimensions: message.dimensions || "",
          computedStyles: message.computedStyles || {},
        });
        setAddClassInput("");
        setActiveTab("inspect");
      }
    };

    // Connect to the devtools init script to receive buffered messages
    // (messages that arrived before this panel tab was opened)
    const port = chrome.runtime.connect({ name: "quick-edits-panel" });
    port.onMessage.addListener(handleMessage);

    // Also listen directly for messages while panel is active
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      port.disconnect();
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // ── Class editing callbacks ─────────────────────────────────────────────

  const sendClassUpdate = useCallback(
    (
      selector: string,
      tabId: number,
      classes: string,
      additionalClasses: string,
    ) => {
      chrome.runtime.sendMessage({
        type: "devtools_class_update",
        selector,
        tabId,
        classes,
        additionalClasses,
      });
    },
    [],
  );

  const handleDeleteClass = useCallback(
    (classToDelete: string) => {
      setInspectTarget((prev) => {
        if (!prev) return prev;
        const updated = prev.classes
          .split(" ")
          .filter((c) => c !== classToDelete)
          .join(" ");
        sendClassUpdate(prev.selector, prev.tabId, updated, prev.additionalClasses);
        return { ...prev, classes: updated };
      });
    },
    [sendClassUpdate],
  );

  const handleDeleteAdditionalClass = useCallback(
    (classToDelete: string) => {
      setInspectTarget((prev) => {
        if (!prev) return prev;
        const updated = prev.additionalClasses
          .split(" ")
          .filter((c) => c !== classToDelete)
          .join(" ");
        sendClassUpdate(prev.selector, prev.tabId, prev.classes, updated);
        return { ...prev, additionalClasses: updated };
      });
    },
    [sendClassUpdate],
  );

  const handleAddClasses = useCallback(
    (value: string) => {
      setAddClassInput(value);
      setInspectTarget((prev) => {
        if (!prev) return prev;
        sendClassUpdate(prev.selector, prev.tabId, prev.classes, value);
        return { ...prev, additionalClasses: value };
      });
    },
    [sendClassUpdate],
  );

  // ── Section toggling ────────────────────────────────────────────────────

  const toggleSection = useCallback((title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-[#202124] text-[#3C4043] dark:text-[#E8EAED] font-mono text-[12px]">
      {/* ── Tab Bar ──────────────────────────────────────────────────── */}
      <div className="flex border-b border-[#DADCE0] dark:border-[#3c4043] bg-[#F8F9FA] dark:bg-[#292a2d] shrink-0">
        <button
          type="button"
          className={`px-4 py-2 text-[11px] font-semibold border-b-2 bg-transparent cursor-pointer transition-colors ${
            activeTab === "inspect"
              ? "border-[#1A73E8] text-[#1A73E8]"
              : "border-transparent text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#3C4043] dark:hover:text-[#E8EAED]"
          }`}
          onClick={() => setActiveTab("inspect")}
        >
          Inspect
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-[11px] font-semibold border-b-2 bg-transparent cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === "history"
              ? "border-[#1A73E8] text-[#1A73E8]"
              : "border-transparent text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#3C4043] dark:hover:text-[#E8EAED]"
          }`}
          onClick={() => setActiveTab("history")}
        >
          History
          {changes.length > 0 && (
            <span className="bg-[#E8F0FE] dark:bg-[#1A73E830] text-[#1A73E8] rounded-full px-1.5 text-[9px] font-bold min-w-[16px] text-center">
              {changes.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Inspect Tab ──────────────────────────────────────────────── */}
      {activeTab === "inspect" &&
        (inspectTarget ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Panel Header */}
            <div className="bg-[#F8F9FA] dark:bg-[#292a2d] border-b border-[#DADCE0] dark:border-[#3c4043] shrink-0">
              {/* Top row */}
              <div className="flex items-center justify-between px-5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-[#1A73E8] font-semibold text-[14px]">
                    {inspectTarget.tagName}
                  </span>
                  {inspectTarget.dimensions && (
                    <span className="text-[#80868B] text-[11px]">
                      {inspectTarget.dimensions}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="text-[#80868B] hover:text-[#5F6368] dark:hover:text-[#E8EAED] bg-transparent border-0 cursor-pointer p-1 transition-colors"
                  onClick={() => setInspectTarget(null)}
                  title="Close"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 2l8 8M10 2l-8 8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Class chips */}
              <div className="flex flex-wrap items-center gap-1.5 px-5 pb-2.5">
                {inspectTarget.classes
                  .split(" ")
                  .filter(Boolean)
                  .map((cls, i) => (
                    <span
                      key={`r-${i}`}
                      className="group flex items-center gap-1 bg-[#E8F0FE] dark:bg-[#1A73E820] text-[#1A73E8] border border-[#D2E3FC] dark:border-[#1A73E840] rounded px-2 py-0.5 text-[11px]"
                    >
                      {cls}
                      <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 bg-transparent border-0 text-[#1A73E8] cursor-pointer p-0 leading-none transition-opacity"
                        onClick={() => handleDeleteClass(cls)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                {inspectTarget.additionalClasses
                  ?.split(" ")
                  .filter(Boolean)
                  .map((cls, i) => (
                    <span
                      key={`a-${i}`}
                      className="group flex items-center gap-1 bg-[#E6F4EA] dark:bg-[#18803820] text-[#188038] border border-[#CEEAD6] dark:border-[#18803840] rounded px-2 py-0.5 text-[11px]"
                    >
                      {cls}
                      <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 bg-transparent border-0 text-[#188038] cursor-pointer p-0 leading-none transition-opacity"
                        onClick={() => handleDeleteAdditionalClass(cls)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                {/* Add class input */}
                <input
                  type="text"
                  placeholder="+ add class"
                  className="bg-transparent border border-dashed border-[#DADCE0] dark:border-[#5f6368] rounded px-2 py-0.5 text-[11px] text-[#5F6368] dark:text-[#9AA0A6] placeholder:text-[#9AA0A6] dark:placeholder:text-[#5f6368] focus:outline-none focus:border-[#1A73E8] min-w-[80px] max-w-[160px]"
                  value={addClassInput}
                  onChange={(e) => handleAddClasses(e.target.value)}
                />
              </div>
            </div>

            {/* Panel Body — Property Sections */}
            <div className="flex-1 overflow-y-auto">
              {PROPERTY_SECTIONS.map((section) => {
                const expanded = expandedSections.has(section.title);
                return (
                  <div key={section.title}>
                    {/* Section header */}
                    <button
                      type="button"
                      className={`flex items-center gap-1.5 w-full px-4 py-[7px] border-b border-[#E0E0E0] dark:border-[#3c4043] bg-transparent cursor-pointer text-left transition-colors hover:bg-[#F1F3F4] dark:hover:bg-[#35363a] ${
                        expanded
                          ? "text-[#5F6368] dark:text-[#E8EAED]"
                          : "text-[#80868B] dark:text-[#9AA0A6]"
                      }`}
                      onClick={() => toggleSection(section.title)}
                    >
                      <SectionChevron expanded={expanded} />
                      <span className="text-[11px] font-semibold">
                        {section.title}
                      </span>
                      {!expanded && (
                        <span className="text-[10px] text-[#9AA0A6] dark:text-[#5f6368]">
                          {section.properties.length} props
                        </span>
                      )}
                    </button>

                    {/* Property rows */}
                    {expanded && (
                      <div>
                        {/* Column header */}
                        <div className="flex items-center px-4 pl-8 py-1 bg-[#F1F3F4] dark:bg-[#35363a] border-b border-[#E0E0E0] dark:border-[#3c4043]">
                          <span className="text-[9px] font-semibold text-[#9AA0A6] uppercase tracking-wider w-[120px] shrink-0">
                            property
                          </span>
                          <span className="text-[9px] font-semibold text-[#9AA0A6] uppercase tracking-wider flex-1">
                            value
                          </span>
                        </div>
                        {section.properties.map((prop) => {
                          const value =
                            inspectTarget.computedStyles?.[prop.key] || "—";
                          return (
                            <div
                              key={prop.key}
                              className="flex items-center px-4 pl-8 py-[5px] border-b border-[#E0E0E0] dark:border-[#3c4043] hover:bg-[#F8F9FA] dark:hover:bg-[#292a2d] transition-colors"
                            >
                              <span className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6] w-[120px] shrink-0">
                                {prop.label}
                              </span>
                              <span className="text-[11px] text-[#3C4043] dark:text-[#E8EAED] truncate flex items-center gap-1.5">
                                {isColorValue(prop.key) && value !== "—" && (
                                  <ColorSwatch value={value} />
                                )}
                                <span title={value}>{value}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Panel Footer */}
            <div className="flex items-center justify-between px-5 py-2 bg-[#F8F9FA] dark:bg-[#292a2d] border-t border-[#DADCE0] dark:border-[#3c4043] shrink-0">
              <div className="flex items-center gap-3.5">
                <span className="flex items-center gap-1.5 text-[10px] text-[#5F6368] dark:text-[#9AA0A6]">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M6 1v10M1 6h10"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {Object.keys(inspectTarget.computedStyles || {}).length}{" "}
                  properties
                </span>
                {changes.length > 0 && (
                  <span className="flex items-center gap-1.5 text-[10px] text-[#E37400]">
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M6 1v6M6 9v1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    {changes.length} edits
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1 rounded border border-[#DADCE0] dark:border-[#5f6368] bg-transparent text-[10px] font-medium text-[#5F6368] dark:text-[#9AA0A6] cursor-pointer hover:bg-[#F1F3F4] dark:hover:bg-[#35363a] transition-colors"
                  onClick={() => setInspectTarget(null)}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2 6h8M7 3l3 3-3 3"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-[#9AA0A6] dark:text-[#5f6368]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 15l5 5M10 4a6 6 0 100 12 6 6 0 000-12z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[12px]">
              Move an element to DevTools to inspect its properties.
            </span>
          </div>
        ))}

      {/* ── History Tab ──────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="flex-1 overflow-y-auto">
          {changes.length > 0 ? (
            <div>
              {changes.map((change, index) => {
                const { removed, added, swapped } = getClassDiff(
                  change.oldClasses,
                  change.newClasses,
                );
                return (
                  <div
                    key={index}
                    className="px-4 py-2.5 border-b border-[#E0E0E0] dark:border-[#3c4043] hover:bg-[#F8F9FA] dark:hover:bg-[#292a2d] transition-colors"
                  >
                    <div className="flex gap-2 items-center text-[10px] text-[#9AA0A6] dark:text-[#5f6368] mb-1">
                      <span>
                        {new Date(change.timestamp).toLocaleTimeString()}
                      </span>
                      <span>·</span>
                      <span className="text-[#5F6368] dark:text-[#9AA0A6]">
                        {change.element}
                      </span>
                    </div>
                    <div className="text-[12px]">
                      {swapped.length > 0
                        ? swapped.map((swap, i) => (
                            <div
                              key={i}
                              className="flex gap-1.5 items-center text-[#E37400]"
                            >
                              <span>{swap.from}</span>
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                              >
                                <path
                                  d="M2 6h8M7 3l3 3-3 3"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span>{swap.to}</span>
                            </div>
                          ))
                        : [
                            ...removed.map((cls, i) => (
                              <div key={`r-${i}`} className="text-[#D93025]">
                                − {cls}
                              </div>
                            )),
                            ...added.map((cls, i) => (
                              <div key={`a-${i}`} className="text-[#188038]">
                                + {cls}
                              </div>
                            )),
                          ]}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-[#9AA0A6] dark:text-[#5f6368] py-16">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8v4l3 3M3 12a9 9 0 1018 0 9 9 0 00-18 0z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[12px]">
                No class changes recorded yet.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Mount ───────────────────────────────────────────────────────────────────

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<DevToolsPanel />);
} else {
  console.error("Root element not found");
}
