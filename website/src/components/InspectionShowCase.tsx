"use client";
import Image from "next/image";
import InspectPopup from "../browser-extension/core/InspectView/InspectPopup";
import InspectPopupClassList from "../browser-extension/core/InspectView/InspectPopup/InspectPopupClassList";
import InspectPopupAstroSection from "../browser-extension/core/InspectView/InspectPopup/InspectPopupAstroSection";
import InspectPopupResults from "../browser-extension/core/InspectView/InspectPopup/InspectPopupResults";

export default function InspectionShowCase() {
const target = document.getElementsByTagName("div")[0]
  return (
    <section className="w-full py-12 lg:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Powerful Class Management</h2>
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="relative rounded-lg overflow-hidden shadow-xl">
            <InspectPopup
          targetSelectionActive={false}
          tagName={"div"}
        >
          <div className="border-y border-[#3c4043] flex items-center bg-[#202124] px-2 py-1 dark:text-white">
            <button type="button" onClick={() => {}} ref={null} className="hover:bg-[#292a2d] p-1 rounded-sm transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Left</title>
                <path
                  d="M10 15L5 10L10 5L11.062 6.062L7.125 10L11.062 13.938L10 15Z"
                  fill="black"
                />
                <circle cx="12.5" cy="10.125" r="1.25" fill="black" />
              </svg>
            </button>
            <button type="button" onClick={() => {}} className="hover:bg-[#292a2d] p-1 rounded-sm transition-colors">
              <svg
                width="20"
                height="20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Out</title>
                <path
                  d="M10 18a2.411 2.411 0 0 1-1.771-.729A2.411 2.411 0 0 1 7.5 15.5c0-.695.243-1.285.729-1.771A2.411 2.411 0 0 1 10 13c.695 0 1.285.243 1.771.729s.729 1.076.729 1.771c0 .695-.243 1.285-.729 1.771A2.411 2.411 0 0 1 10 18Zm-.75-6.5V4.875L7.062 7.062 6 6l4-4 4 4-1.062 1.062-2.188-2.187V11.5h-1.5Z"
                  fill="#000"
                />
              </svg>
            </button>
            <button type="button" onClick={() => {}} className="hover:bg-[#292a2d] p-1 rounded-sm transition-colors">
              <svg
                width="20"
                height="20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>In</title>
                <path
                  d="M10 18a2.411 2.411 0 0 1-1.771-.729A2.411 2.411 0 0 1 7.5 15.5c0-.695.243-1.285.729-1.771A2.411 2.411 0 0 1 10 13c.695 0 1.285.243 1.771.729s.729 1.076.729 1.771c0 .695-.243 1.285-.729 1.771A2.411 2.411 0 0 1 10 18Zm0-6.5-4-4 1.062-1.062L9.25 8.625V2h1.5v6.625l2.188-2.187L14 7.5l-4 4Z"
                  fill="#000"
                />
              </svg>
            </button>
            <button type="button" onClick={() => {}} className="hover:bg-[#292a2d] p-1 rounded-sm transition-colors">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Right</title>
                <path
                  d="M7.99999 15L6.93799 13.938L10.875 10L6.93799 6.062L7.99999 5L13 10L7.99999 15Z"
                  fill="black"
                />
              </svg>
            </button>
            <button
            onClick={() => {
            }}
            >
              Toggle Select box
            </button>
          </div>
          <InspectPopupClassList
            key={"ljlksjs"}
            target={target}
            classes={""}
            setClasses={() => {}}
            additionalClasses={""}
            setAdditionalClasses={() => {}}
            setShowSelectBox={() => {}}
          />
          <InspectPopupAstroSection target={target} />
          {/* <InspectPopupResults target={target} classes={""} additionalClasses={""} /> */}
        </InspectPopup>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">DevTools-like Interface</h3>
            <p className="text-gray-600">
              Manage your Tailwind CSS classes with a familiar DevTools-like interface.
              Edit, delete, and modify classes in real-time with our intuitive popup.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Smart class variant selection</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Instant class removal</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Undo/Redo support (⌘Z)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}