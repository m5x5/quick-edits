// Chrome mock must be the first import — sets globalThis.chrome before any
// component module runs React effects or event handlers.
import "./chrome-mock";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./popup.css";
import InspectPopup from "./core/InspectView/InspectPopup";
import InspectPopupClassList from "./core/InspectView/InspectPopup/InspectPopupClassList";
import InspectPopupResults from "./core/InspectView/InspectPopup/InspectPopupResults";

const queryClient = new QueryClient();

function PopupPreview({
  target,
  classes,
  setClasses,
}: {
  target: HTMLElement;
  classes: string;
  setClasses: (c: string) => void;
}) {
  const [additionalClasses, setAdditionalClasses] = useState("");
  const [showSelectBox, setShowSelectBox] = useState(true);

  return (
    <InspectPopup
      targetSelectionActive={false}
      tagName={target.tagName}
      showSelectBox={showSelectBox}
      setShowSelectBox={setShowSelectBox}
    >
      <InspectPopupClassList
        target={target}
        classes={classes}
        setClasses={setClasses}
        additionalClasses={additionalClasses}
        setAdditionalClasses={setAdditionalClasses}
        setShowSelectBox={setShowSelectBox}
      />
      <InspectPopupResults
        target={target}
        classes={classes}
        additionalClasses={additionalClasses}
      />
    </InspectPopup>
  );
}

function DemoSection({
  id,
  label,
  initialClasses,
  children,
}: {
  id: string;
  label: string;
  initialClasses: string;
  children: (
    ref: React.RefObject<HTMLDivElement | null>,
    classes: string,
    setClasses: (c: string) => void,
  ) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [classes, setClasses] = useState(initialClasses);

  useEffect(() => {
    setTarget(ref.current);
  }, []);

  return (
    <section id={id} className="flex flex-col gap-4">
      <div className="text-xs font-mono text-gray-400 uppercase tracking-wider">
        {label}
      </div>
      {children(ref, classes, setClasses)}
      {target && (
        <QueryClientProvider client={queryClient}>
          <PopupPreview
            target={target}
            classes={classes}
            setClasses={setClasses}
          />
        </QueryClientProvider>
      )}
    </section>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#1a1b1e] text-gray-900 dark:text-white p-8 flex flex-col gap-12">
      <header>
        <h1 className="text-lg font-bold font-mono">Quick Edits — Dev Page</h1>
        <p className="text-sm text-gray-500 mt-1">
          Alt+hover elements (with the extension active) to inspect them. The
          popup below is a live preview connected to each demo element.
        </p>
      </header>

      <DemoSection
        id="class-list"
        label="InspectPopupClassList"
        initialClasses="flex flex-wrap gap-1 p-3 bg-white dark:bg-[#292a2d] rounded-lg border border-gray-200 dark:border-[#3c4043]"
      >
        {(ref, classes) => (
          <div ref={ref} className={classes}>
            class list demo element
          </div>
        )}
      </DemoSection>

      <DemoSection
        id="results"
        label="InspectPopupResults"
        initialClasses="text-left p-4 bg-white dark:bg-[#292a2d] rounded-lg border border-gray-200 dark:border-[#3c4043] font-medium"
      >
        {(ref, classes) => (
          <div ref={ref} className={classes}>
            results demo element
          </div>
        )}
      </DemoSection>

      <DemoSection
        id="container"
        label="InspectPopupContainer"
        initialClasses="bg-white dark:bg-[#202124] rounded-lg shadow-lg border border-gray-200 dark:border-[#3c4043] font-medium p-3 max-w-[400px]"
      >
        {(ref, classes) => (
          <div ref={ref} className={classes}>
            container demo element
          </div>
        )}
      </DemoSection>
    </div>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
