import React from "react";
import type { DragHandlers } from "../PopupPositioning";
import useSelectedTarget from "../hooks/useSelectedTarget";
import InspectPopupContainer from "./InspectPopupContainer";

export default function InspectPopup({
  children,
  targetSelectionActive,
  tagName,
  dragHandlers,
  onMoveToDevTools,
  ...props
}: {
  targetSelectionActive: boolean;
  tagName: string;
  children: React.ReactNode;
  setShowSelectBox: (param: boolean) => void;
  showSelectBox: boolean;
  dragHandlers: DragHandlers;
  onMoveToDevTools?: () => void;
}) {
  const [showArrowControls, setShowArrowControls] = React.useState(false);
  const [showThumbMenu, setShowThumbMenu] = React.useState(false);
  const thumbMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['showArrowControls']).then(data => {
        setShowArrowControls(data.showArrowControls ?? true);
      }).catch(() => {
        setShowArrowControls(true);
      });
    } else {
      setShowArrowControls(true);
    }
  }, []);

  // Close thumb menu on outside click
  React.useEffect(() => {
    if (!showThumbMenu) return;
    const handler = (e: MouseEvent) => {
      if (thumbMenuRef.current && !thumbMenuRef.current.contains(e.target as Node)) {
        setShowThumbMenu(false);
      }
    };
    // Use timeout to avoid catching the same click that opened the menu
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handler);
    };
  }, [showThumbMenu]);

  const { left, up, down, right, ref } = useSelectedTarget();
  const handleRefresh = () => {
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(
        { action: "reload_extension" },
        () => {
          window.location.reload();
        },
      );
    } else {
      window.location.reload();
    }
  };

  // Track if a drag happened so we can suppress the click
  const wasDragging = React.useRef(false);
  React.useEffect(() => {
    if (dragHandlers.isDragging) {
      wasDragging.current = true;
    }
  }, [dragHandlers.isDragging]);

  const handleThumbClick = React.useCallback(() => {
    // If we just finished dragging, don't open menu
    if (wasDragging.current) {
      wasDragging.current = false;
      return;
    }
    setShowThumbMenu(prev => !prev);
  }, []);

  return (
    <InspectPopupContainer targetSelectionActive={targetSelectionActive}>
      <div className="">
        <div className="border-b border-gray-200 black:border-[#3c4043] flex justify-between items-center">
          {/* Drag thumb + tag name */}
          <div className="flex items-center gap-0 min-w-0">
            <div
              className="relative"
              ref={thumbMenuRef}
            >
              <div
                onPointerDown={dragHandlers.onPointerDown}
                onPointerMove={dragHandlers.onPointerMove}
                onPointerUp={dragHandlers.onPointerUp}
                onClick={handleThumbClick}
                className="flex items-center justify-center px-1.5 py-2 cursor-grab active:cursor-grabbing touch-none shrink-0 text-gray-300 dark:text-[#5f6368] hover:text-gray-400 dark:hover:text-[#9ba0a5] transition-colors"
                title="Drag to reposition, click for options"
              >
                <svg width="6" height="14" viewBox="0 0 6 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="1.5" cy="1.5" r="1" /><circle cx="4.5" cy="1.5" r="1" />
                  <circle cx="1.5" cy="5" r="1" /><circle cx="4.5" cy="5" r="1" />
                  <circle cx="1.5" cy="8.5" r="1" /><circle cx="4.5" cy="8.5" r="1" />
                  <circle cx="1.5" cy="12" r="1" /><circle cx="4.5" cy="12" r="1" />
                </svg>
              </div>

              {/* Thumb dropdown menu */}
              {showThumbMenu && (
                <div
                  className="absolute left-0 bg-white dark:bg-[#202124] border border-gray-200 dark:border-[#3c4043] rounded shadow-lg min-w-[160px] py-1"
                  style={{ top: '100%', zIndex: 9999 }}
                >
                  {onMoveToDevTools && (
                    <button
                      type="button"
                      className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-[12px] text-gray-600 dark:text-[#e8eaed] hover:bg-gray-100 dark:hover:bg-[#292a2d] bg-transparent border-0 cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowThumbMenu(false);
                        onMoveToDevTools();
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
                        <line x1="1" y1="3.5" x2="13" y2="3.5" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M4 6.5h6M4 8.5h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
                      </svg>
                      Move to DevTools
                    </button>
                  )}
                </div>
              )}
            </div>
            <span className="dark:text-blue-200 text-blue-500 font-mono text-[13px] p-1">{tagName?.toLowerCase()}</span>
          </div>

          <div className="flex items-center justify-between bg-white dark:bg-[#202124] text-black dark:text-white">
            <button
              type="button"
              onClick={handleRefresh}
              className="transition-colors dark:hover:bg-[#292a2d] p-1 bg-transparent border-0 rounded-sm text-gray-500 dark:text-[#9ba0a5] hover:text-gray-700 dark:hover:text-[#e8eaed]"
              title="Refresh extension"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2a6 6 0 1 0 6 6h-1.5A4.5 4.5 0 1 1 8 3.5V6l3.5-3L8 0v2Z" fill="currentColor" />
              </svg>
            </button>
            {showArrowControls && (
              <div className="flex items-center">
                <button type="button" onClick={left} ref={ref} className="dark:hover:bg-[#292a2d] p-1 bg-transparent border-0 rounded-sm transition-colors text-gray-500 dark:text-[#9ba0a5] hover:text-gray-700 dark:hover:text-[#e8eaed]" title="Previous sibling">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </button>
                <button type="button" onClick={up} className="dark:hover:bg-[#292a2d] p-1 bg-transparent border-0 rounded-sm transition-colors text-gray-500 dark:text-[#9ba0a5] hover:text-gray-700 dark:hover:text-[#e8eaed]" title="Parent element">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 10l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </button>
                <button type="button" onClick={down} className="dark:hover:bg-[#292a2d] p-1 bg-transparent border-0 rounded-sm transition-colors text-gray-500 dark:text-[#9ba0a5] hover:text-gray-700 dark:hover:text-[#e8eaed]" title="First child">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </button>
                <button type="button" onClick={right} className="dark:hover:bg-[#292a2d] p-1 bg-transparent border-0 rounded-sm transition-colors text-gray-500 dark:text-[#9ba0a5] hover:text-gray-700 dark:hover:text-[#e8eaed]" title="Next sibling">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => { props.setShowSelectBox(!props.showSelectBox); }}
              className={`transition-colors dark:hover:bg-[#292a2d] p-1 bg-transparent border-0 rounded-sm ${props.showSelectBox ? 'text-blue-500' : 'text-gray-400 dark:text-[#9ba0a5]'}`}
              title={props.showSelectBox ? "Hide select box overlay" : "Show select box overlay"}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <rect x="4" y="4" width="8" height="8" rx="1" fill="currentColor" opacity="0.25" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-3">{children}</div>
      </div>
    </InspectPopupContainer>
  );
}
