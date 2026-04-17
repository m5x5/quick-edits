import React, { useEffect, useState } from "react";

type TypographyClassDef = {
  name: string;
  fontWeight?: string;
  fontSize?: string;
  lineHeight?: string;
  responsiveFontSize?: string;
};

const LS_KEY = "token-tool-typography-classes";

function loadClasses(): TypographyClassDef[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

type ValidationResult = { name: string; found: boolean; count: number };

export default function TypographyClassesPanel() {
  const [classes, setClasses] = useState<TypographyClassDef[]>([]);
  const [results, setResults] = useState<ValidationResult[] | null>(null);

  useEffect(() => {
    setClasses(loadClasses());
  }, []);

  const handleValidate = () => {
    const res = classes.map((cls) => {
      const els = document.querySelectorAll("." + CSS.escape(cls.name));
      return { name: cls.name, found: els.length > 0, count: els.length };
    });
    setResults(res);
  };

  const found = results?.filter((r) => r.found) || [];
  const missing = results?.filter((r) => !r.found) || [];

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]">
        <span className="text-sm font-semibold text-white">
          Typography Classes
        </span>
        <span className="text-xs text-[#71717a]">
          {classes.length} configured
        </span>
      </div>
      <div className="p-4 flex flex-col gap-3" style={{ maxHeight: "400px", overflowY: "auto" }}>
        {classes.length === 0 ? (
          <p className="text-xs text-[#71717a] leading-relaxed m-0">
            No typography classes configured. Use the WebMCP{" "}
            <code className="text-[#a1a1aa] bg-[#27272a] px-1 rounded text-[10px]">
              set_typography_classes
            </code>{" "}
            tool to add classes from your design system.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={handleValidate}
              className="w-full text-xs font-medium text-white bg-[#27272a] hover:bg-[#3f3f46] border border-[#3f3f46] rounded-lg px-3 py-2 cursor-pointer transition-colors"
            >
              Validate on this page
            </button>

            {results && (
              <div className="text-xs text-[#a1a1aa] font-medium">
                {found.length}/{results.length} classes found
              </div>
            )}

            <div className="flex flex-col gap-1">
              {classes.map((cls) => {
                const r = results?.find((x) => x.name === cls.name);
                return (
                  <div
                    key={cls.name}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-md"
                    style={{
                      background: r
                        ? r.found
                          ? "rgba(52, 211, 153, 0.1)"
                          : "rgba(113, 113, 122, 0.1)"
                        : "transparent",
                    }}
                  >
                    <span
                      className="text-xs font-mono"
                      style={{
                        color: r
                          ? r.found
                            ? "#34d399"
                            : "#71717a"
                          : "#a1a1aa",
                        textDecoration: r && !r.found ? "line-through" : "none",
                      }}
                    >
                      .{cls.name}
                    </span>
                    <span className="text-[10px] text-[#71717a]">
                      {r ? (r.found ? `${r.count}×` : "—") : cls.fontSize || ""}
                    </span>
                  </div>
                );
              })}
            </div>

            {results && missing.length > 0 && (
              <div className="text-[10px] text-[#71717a] leading-relaxed">
                {missing.length} class{missing.length !== 1 ? "es" : ""} not found on this page
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
