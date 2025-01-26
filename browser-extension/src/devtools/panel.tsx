import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Section, { SectionBody } from "../core/Section";
import "../popup.css";
import styles from "../../../dist/popup.css?inline";

interface ClassChange {
  element: string;
  oldClasses: string;
  newClasses: string;
  timestamp: number;
}

const DevToolsPanel = () => {
  const [changes, setChanges] = useState<ClassChange[]>([]);

  useEffect(() => {
    const messageListener = (message: any) => {
      if (message.type === "class_change") {
        const newChange = {
          element: message.element,
          oldClasses: message.oldClasses.trim(),
          newClasses: message.newClasses.trim(),
          timestamp: Date.now()
        };
        
        // Only add the change if classes are actually different
        if (newChange.oldClasses !== newChange.newClasses) {
          setChanges(prev => [newChange, ...prev]);
        }
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const getClassChanges = (oldClasses: string, newClasses: string) => {
    const oldClassArray = oldClasses.split(' ').filter(Boolean);
    const newClassArray = newClasses.split(' ').filter(Boolean);
    
    const removed = oldClassArray.filter(c => !newClassArray.includes(c));
    const added = newClassArray.filter(c => !oldClassArray.includes(c));
    
    // Only consider as swapped if the number of additions equals removals
    const swapped = added.length === removed.length && added.length > 0
      ? added.map((newClass, i) => ({ from: removed[i], to: newClass }))
      : [];
    
    return { removed, added, swapped };
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 dark:text-white">
      <Section>Quick Edits - Class Changes</Section>
      <div className="space-y-4">
        {changes.map((change, index) => {
          const { removed, added, swapped } = getClassChanges(change.oldClasses, change.newClasses);
          return (
            <div key={index} className="p-4 bg-white rounded-lg shadow dark:bg-gray-700">
              <div className="flex gap-2 items-center text-sm text-gray-500 dark:text-gray-400">
                <span>{new Date(change.timestamp).toLocaleTimeString()}</span>
                <span className="text-gray-400">•</span>
                <span>{change.element}</span>
              </div>
              <div className="mt-2 space-y-1 font-mono">
                {swapped.length > 0 ? (
                  swapped.map((swap, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-amber-500">{swap.from}</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className="text-amber-500">{swap.to}</span>
                    </div>
                  ))
                ) : (
                  <>
                    {removed.map((cls, i) => (
                      <div key={`removed-${i}`} className="flex gap-1 items-center text-red-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                        {cls}
                      </div>
                    ))}
                    {added.map((cls, i) => (
                      <div key={`added-${i}`} className="flex gap-1 items-center text-green-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {cls}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          );
        })}
        {changes.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No class changes detected yet. Start editing classes to see them here.
          </div>
        )}
      </div>
    </div>
  );
};

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<DevToolsPanel />);
} else {
  console.error("Root element not found");
}

chrome.devtools.panels.create(
  "Quick Edits",
  "icon16.png",
  "devtools.html",
  (panel) => {
    console.log("Quick Edits DevTools panel created");
  }
);
