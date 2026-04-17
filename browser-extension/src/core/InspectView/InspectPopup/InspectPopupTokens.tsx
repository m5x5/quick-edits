import { useEffect, useState } from "react";
import {
  type ColorMatch,
  type ColorToken,
  type DesignTokens,
  type TextStyleMatch,
  type TextStyleToken,
  findClosestColor,
  findClosestTextStyle,
  loadDesignTokens,
} from "../../DevToolbar/tokens";

function DeviationBadge({
  label,
  actual,
  expected,
  unit,
}: {
  label: string;
  actual: string | number;
  expected: string | number;
  unit?: string;
}) {
  const diff =
    typeof actual === "number" && typeof expected === "number"
      ? actual - expected
      : null;
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-gray-400 dark:text-[#9ba0a5] w-[72px] shrink-0">{label}</span>
      <span className="text-red-500 dark:text-[#ef4444] line-through tabular-nums">
        {actual}
        {unit}
      </span>
      <span className="text-gray-400 dark:text-[#9ba0a5]">&rarr;</span>
      <span className="text-green-600 dark:text-[#22c55e] tabular-nums">
        {expected}
        {unit}
      </span>
      {diff !== null && diff !== 0 && (
        <span className="text-gray-400 dark:text-[#9ba0a5] tabular-nums">
          ({diff > 0 ? "+" : ""}
          {Math.round(diff * 100) / 100}
          {unit})
        </span>
      )}
    </div>
  );
}

function ColorMatchRow({
  label,
  cssColor,
  match,
  allTokens,
  onSelectToken,
}: {
  label: string;
  cssColor: string;
  match: ColorMatch | null;
  allTokens: ColorToken[];
  onSelectToken: (token: ColorToken) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  if (!match) return null;
  if (cssColor.includes("rgba") && cssColor.endsWith(", 0)")) return null;
  if (cssColor === "rgba(0, 0, 0, 0)") return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-sm border border-gray-300 dark:border-[#5f6368] shrink-0"
            style={{ backgroundColor: cssColor }}
          />
          <span className="text-[11px] text-gray-500 dark:text-[#9ba0a5]">{label}</span>
        </div>
        {match.exact ? (
          <span className="text-[10px] text-green-600 dark:text-[#22c55e] font-medium px-1.5 py-0.5 rounded bg-green-50 dark:bg-[#22c55e]/10">
            {match.token.name}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="text-[10px] text-amber-600 dark:text-[#f59e0b] font-medium px-1.5 py-0.5 rounded bg-amber-50 dark:bg-[#f59e0b]/10 border-0 cursor-pointer hover:bg-amber-100 dark:hover:bg-[#f59e0b]/20 transition-colors"
          >
            ~{match.token.name} ({Math.round(match.distance)})
          </button>
        )}
      </div>

      {!match.exact && (
        <div className="flex items-center gap-1.5 text-[10px] pl-4">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm border border-gray-300 dark:border-[#5f6368]"
            style={{ backgroundColor: cssColor }}
          />
          <span className="text-red-500 dark:text-[#ef4444] font-mono">{cssColor}</span>
          <span className="text-gray-400 dark:text-[#9ba0a5]">&rarr;</span>
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm border border-gray-300 dark:border-[#5f6368]"
            style={{ backgroundColor: match.token.hex }}
          />
          <span className="text-green-600 dark:text-[#22c55e] font-mono">{match.token.hex}</span>
        </div>
      )}

      {showPicker && (
        <div className="pl-4 flex flex-wrap gap-1 py-1">
          {allTokens.map((t) => (
            <button
              key={t.hex}
              type="button"
              onClick={() => {
                onSelectToken(t);
                setShowPicker(false);
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-gray-50 dark:bg-[#27272a] border border-gray-200 dark:border-[#3f3f46] cursor-pointer hover:border-gray-400 dark:hover:border-[#52525b] transition-colors"
              title={`${t.name} (${t.hex})`}
            >
              <span
                className="w-2.5 h-2.5 rounded-sm border border-gray-300 dark:border-[#52525b]"
                style={{ backgroundColor: t.hex }}
              />
              <span className="text-gray-600 dark:text-[#a1a1aa] max-w-[80px] truncate">
                {t.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TextStyleMatchRow({
  match,
  allTokens,
  onSelectToken,
}: {
  match: TextStyleMatch | null;
  allTokens: TextStyleToken[];
  onSelectToken: (token: TextStyleToken) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  if (!match) return null;

  const devs = match.deviations;
  const hasDeviations = Object.keys(devs).length > 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-500 dark:text-[#9ba0a5]">Text Style</span>
        {match.exact ? (
          <span className="text-[10px] text-green-600 dark:text-[#22c55e] font-medium px-1.5 py-0.5 rounded bg-green-50 dark:bg-[#22c55e]/10">
            {match.token.name}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="text-[10px] text-amber-600 dark:text-[#f59e0b] font-medium px-1.5 py-0.5 rounded bg-amber-50 dark:bg-[#f59e0b]/10 border-0 cursor-pointer hover:bg-[#f59e0b]/20 transition-colors"
          >
            ~{match.token.name}
          </button>
        )}
      </div>

      {hasDeviations && (
        <div className="pl-2 flex flex-col gap-0.5">
          {devs.fontSize && (
            <DeviationBadge label="font-size" actual={devs.fontSize.actual} expected={devs.fontSize.expected} unit="px" />
          )}
          {devs.fontWeight && (
            <DeviationBadge label="font-weight" actual={devs.fontWeight.actual} expected={devs.fontWeight.expected} />
          )}
          {devs.lineHeight && (
            <DeviationBadge label="line-height" actual={devs.lineHeight.actual} expected={devs.lineHeight.expected} />
          )}
          {devs.fontFamily && (
            <DeviationBadge label="font-family" actual={devs.fontFamily.actual} expected={devs.fontFamily.expected} />
          )}
        </div>
      )}

      {showPicker && (
        <div className="flex flex-col gap-0.5 py-1 max-h-[150px] overflow-y-auto">
          {allTokens.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => {
                onSelectToken(t);
                setShowPicker(false);
              }}
              className="flex items-center justify-between px-2 py-1 rounded text-[10px] bg-gray-50 dark:bg-[#27272a] border border-gray-200 dark:border-[#3f3f46] cursor-pointer hover:border-gray-400 dark:hover:border-[#52525b] transition-colors text-left"
              title={t.name}
            >
              <span className="text-gray-600 dark:text-[#a1a1aa] truncate">{t.name}</span>
              <span className="text-gray-400 dark:text-[#52525b] shrink-0 ml-2 tabular-nums">
                {t.fontSize[0]}px / {t.fontWeight}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InspectPopupTokens({
  target,
}: {
  target: HTMLElement | SVGElement;
}) {
  const [tokens, setTokens] = useState<DesignTokens | null>(null);

  useEffect(() => {
    loadDesignTokens().then(setTokens);
  }, []);

  if (!tokens) return null;

  const cs = window.getComputedStyle(target);

  const colorMatch = findClosestColor(cs.color, tokens.colors);
  const bgMatch = findClosestColor(cs.backgroundColor, tokens.colors);
  const borderMatch = findClosestColor(cs.borderTopColor, tokens.colors);
  const textMatch = findClosestTextStyle(
    {
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight,
    },
    tokens.textStyles,
  );

  const hasAnyMatch = colorMatch || bgMatch || borderMatch || textMatch;
  if (!hasAnyMatch) return null;

  return (
    <div className="flex flex-col gap-1.5 text-[12px] font-mono mt-2 pt-2 border-t border-gray-200 dark:border-[#3c4043]">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[11px] text-gray-400 dark:text-[#9ba0a5] font-sans">
          Design Tokens
        </span>
        <span className="text-[10px] text-gray-400 dark:text-[#5f6368] font-sans">
          {tokens.colors.length}c / {tokens.textStyles.length}t
        </span>
      </div>

      <ColorMatchRow
        label="color"
        cssColor={cs.color}
        match={colorMatch}
        allTokens={tokens.colors}
        onSelectToken={() => {}}
      />
      <ColorMatchRow
        label="background"
        cssColor={cs.backgroundColor}
        match={bgMatch}
        allTokens={tokens.colors}
        onSelectToken={() => {}}
      />
      <ColorMatchRow
        label="border"
        cssColor={cs.borderTopColor}
        match={borderMatch}
        allTokens={tokens.colors}
        onSelectToken={() => {}}
      />

      {textMatch && (
        <div className="border-t border-gray-200 dark:border-[#3c4043] pt-1.5">
          <TextStyleMatchRow
            match={textMatch}
            allTokens={tokens.textStyles}
            onSelectToken={() => {}}
          />
        </div>
      )}
    </div>
  );
}
