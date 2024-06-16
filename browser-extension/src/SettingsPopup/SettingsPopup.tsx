import React from 'react';
import '../popup.css';
import Section, {SectionAction, SectionBody} from "../core/Section";
import Button from "../core/Button";

export default function SettingsPopup () {
  return (
    <div>
      <Section>Test</Section>
      <SectionAction onClick={() => {}} icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M9.25 16V10.75H4V9.25H9.25V4H10.75V9.25H16V10.75H10.75V16H9.25Z" fill="currentColor"/>
      </svg>}>
        Link directory

      </SectionAction>
      <SectionBody>
        <Button>Test</Button>
        <input placeholder={"Filter"}
               className={"rounded-[4px] text-xs border-gray-300 py-[0.05rem] px-[0.2rem] placeholder:text-gray-400"} />
      </SectionBody>
    </div>
  )
}