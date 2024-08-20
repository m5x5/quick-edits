import React from 'react';
import InspectPopupContainer from "./InspectPopupContainer";

export default function InspectPopup({children, targetSelectionActive, tagName}: {
  targetSelectionActive: boolean,
  tagName: string,
  children: React.ReactNode,
}) {
  return (
    <InspectPopupContainer targetSelectionActive={targetSelectionActive}>
      <span className="text-[#77006e] font-bold">{tagName?.toLowerCase()}</span>
      {children}
    </InspectPopupContainer>
  )
}