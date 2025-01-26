"use client";
import InspectPopup from "../browser-extension/core/InspectView/InspectPopup";
import InspectPopupClassList from "../browser-extension/core/InspectView/InspectPopup/InspectPopupClassList";
import InspectPopupAstroSection from "../browser-extension/core/InspectView/InspectPopup/InspectPopupAstroSection";
import { useEffect, useRef, useState } from "react";

export default function InspectionShowCase() {
  const ref = useRef<HTMLDivElement>(null);
  const [classes, setClasses] = useState<string>("text-lg underline");
  const [additionalClasses, setAdditionalClasses] = useState<string>("");

  useEffect(() => {
    if (!ref.current) return;
    
    // Update classes whenever ref is available or classes change
    const newClasses = `relative p-6 bg-white rounded-xl border-2 border-blue-300 border-dashed shadow-lg transition-all duration-200 hover:border-blue-400 hover:shadow-xl ${classes} ${additionalClasses}`;
    ref.current.className = newClasses;
    setClasses(newClasses);
  }, [ref.current]); // Remove ref.current from dependencies as it's an object reference

  return (
    <section className="py-16 w-full bg-gradient-to-b from-gray-50 to-white lg:py-24">
      <div className="container px-4 mx-auto">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Try it yourself</h2>
          <p className="text-lg text-gray-600">Experience the power of our intuitive class management interface</p>
        </div>
        <div className="grid gap-16 items-center lg:grid-cols-2">
          <section className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-900">DevTools-like Interface</h3>
              <p className="text-lg leading-relaxed text-gray-600">
                Manage your Tailwind CSS classes with a familiar DevTools-like interface.
                Edit, delete, and modify classes in real-time with our intuitive popup.
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4 items-center">
                <div className="flex-shrink-0 p-2.5 bg-blue-50 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Smart class variant selection</h4>
                  <p className="text-sm text-gray-500">Quickly switch between different variants of the same utility class</p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex-shrink-0 p-2.5 bg-blue-50 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Instant class removal</h4>
                  <p className="text-sm text-gray-500">Remove unwanted classes with a single click</p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex-shrink-0 p-2.5 bg-blue-50 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Undo/Redo support</h4>
                  <p className="text-sm text-gray-500">Quickly revert changes with ⌘Z shortcut</p>
                </div>
              </div>
            </div>
          </section>
          <div className="relative space-y-8">
            <div className="relative flex justify-center items-center min-h-[300px] bg-gray-50/50 rounded-xl p-8">
              <div ref={ref}>
                <p>Test</p>
              </div>
              {ref.current && (
                <InspectPopup targetSelectionActive={false} tagName={"div"}>
                  <InspectPopupClassList
                    key={"showcase"}
                    target={ref.current}
                    classes={classes}
                    setClasses={setClasses}
                    additionalClasses={additionalClasses}
                    setAdditionalClasses={setAdditionalClasses}
                    setShowSelectBox={() => {}}
                  />
                  <InspectPopupAstroSection target={ref.current} />
                </InspectPopup>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}