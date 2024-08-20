import React from 'react'

export default function InspectPopupContainer({ children, targetSelectionActive }: { children: React.ReactNode, targetSelectionActive: boolean }) {

  return (
    <div
      role="tooltip"
      className="bg-white p-[10px] absolute top-0 left-0 z-[9999] max-w-[400px] rounded-md shadow-md border-[#ccc] border font-bold overflow-x-scroll m-2 border-solid"
      style={{
        pointerEvents: targetSelectionActive ? "none" : "auto",
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}
