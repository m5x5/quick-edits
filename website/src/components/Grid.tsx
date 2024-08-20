"use client";

import { useEffect, useRef } from "react";

export default function Grid() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const light = ref.current;
    if (!light) return;

    document.addEventListener("mousemove", (e) => {
      const { clientX: x, clientY: y } = e;
      light.classList.remove("faded-out");
      light.style.left = x + "px";
      light.style.top = y + "px";
    }, { passive: true });

    document.addEventListener("mouseleave", () => {
      light.classList.add("faded-out");
    }, { passive: true });
  }, [!ref.current]);

  return (
    <>
      <div className="m-w-[1200px] fixed left-0 right-0 h-full -z-10 hover-grid flex"></div>
      <div className="m-w-[1200px] fixed left-0 right-0 h-full -z-10 hover-grid--dark hidden"></div>
      <div id="light" ref={ref} className="faded-out"></div>
    </>
  );
}
