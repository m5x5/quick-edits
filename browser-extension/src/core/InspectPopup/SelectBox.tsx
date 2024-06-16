import React, { useEffect } from "react";
import { ShadowDom } from "../ShadowDom";
import styles from "../../../dist/popup.css?inline";

export default function SelectBox({ target, classes }: {
  target: HTMLElement | SVGElement;
  classes: string
}) {
  const blueBoxRef = React.useRef<HTMLDivElement>(null);
  const upperMarginBoxRef = React.useRef<HTMLDivElement>(null);
  const lowerMarginBoxRef = React.useRef<HTMLDivElement>(null);
  const lowerPaddingBoxRef = React.useRef<HTMLDivElement>(null);
  const upperPaddingBoxRef = React.useRef<HTMLDivElement>(null);
  const leftPaddingBoxRef = React.useRef<HTMLDivElement>(null);
  const rightPaddingBoxRef = React.useRef<HTMLDivElement>(null);


  useEffect(() => {
    updateSelectBox();
  }, []);

  useEffect(() => {
    window.addEventListener("resize", updateSelectBox);
    window.addEventListener("scroll", updateSelectBox);
    return () => {
      window.removeEventListener("resize", updateSelectBox);
      window.removeEventListener("scroll", updateSelectBox);
    };
  }, []);


  const updateSelectBox = () => {
    const targetRect = target.getBoundingClientRect();
    const targetStyle = getComputedStyle(target);

    if (blueBoxRef.current) {
      blueBoxRef.current.style.position = "fixed";
      blueBoxRef.current.style.top = `calc(${targetRect.top}px + ${targetStyle.paddingTop})`;
      blueBoxRef.current.style.left = `${targetRect.left}px`;
      blueBoxRef.current.style.width = `${targetRect.width}px`;
      blueBoxRef.current.style.height = `calc(${targetRect.height}px - ${targetStyle.paddingBottom} - ${targetStyle.paddingTop})`;
      blueBoxRef.current.style.zIndex = "999999";
      blueBoxRef.current.style.pointerEvents = "none";
    }
    if (upperMarginBoxRef.current) {
      upperMarginBoxRef.current.style.position = "fixed";
      upperMarginBoxRef.current.style.top = `${targetRect.top}px`;
      upperMarginBoxRef.current.style.left = `${targetRect.left}px`;
      upperMarginBoxRef.current.style.width = `${targetRect.width}px`;
      upperMarginBoxRef.current.style.height = `${targetStyle.marginTop}`;
      upperMarginBoxRef.current.style.transform = "translateY(-100%)";
      upperMarginBoxRef.current.style.zIndex = "999998";
      upperMarginBoxRef.current.style.pointerEvents = "none";
    }
    if (lowerMarginBoxRef.current) {
      lowerMarginBoxRef.current.style.position = "fixed";
      lowerMarginBoxRef.current.style.top = `${targetRect.bottom}px`;
      lowerMarginBoxRef.current.style.left = `${targetRect.left}px`;
      lowerMarginBoxRef.current.style.width = `${targetRect.width}px`;
      lowerMarginBoxRef.current.style.height = `${targetStyle.marginBottom}`;
      lowerMarginBoxRef.current.style.zIndex = "999998";
      lowerMarginBoxRef.current.style.pointerEvents = "none";
    }
    if (lowerPaddingBoxRef.current) {
      lowerPaddingBoxRef.current.style.position = "fixed";
      lowerPaddingBoxRef.current.style.top = `calc(${targetRect.bottom}px - ${targetStyle.paddingBottom})`;
      lowerPaddingBoxRef.current.style.left = `${targetRect.left}px`;
      lowerPaddingBoxRef.current.style.width = `${targetRect.width}px`;
      lowerPaddingBoxRef.current.style.height = `${targetStyle.paddingBottom}`;
      lowerPaddingBoxRef.current.style.zIndex = "999998";
      lowerPaddingBoxRef.current.style.pointerEvents = "none";
    }

    if (leftPaddingBoxRef.current) {
      leftPaddingBoxRef.current.style.position = "fixed";
      leftPaddingBoxRef.current.style.top = `calc(${targetRect.top}px + ${targetStyle.paddingTop})`;
      leftPaddingBoxRef.current.style.left = `${targetRect.left}px`;
      leftPaddingBoxRef.current.style.width = `${targetStyle.paddingLeft}`;
      leftPaddingBoxRef.current.style.height = `calc(${targetRect.height}px - ${targetStyle.paddingBottom} - ${targetStyle.paddingTop})`;
      leftPaddingBoxRef.current.style.zIndex = "999998";
      leftPaddingBoxRef.current.style.pointerEvents = "none";
    }

    if (rightPaddingBoxRef.current) {
      rightPaddingBoxRef.current.style.position = "fixed";
      rightPaddingBoxRef.current.style.top = `calc(${targetRect.top}px + ${targetStyle.paddingTop})`;
      rightPaddingBoxRef.current.style.left = `calc(${targetRect.right}px - ${targetStyle.paddingRight})`;
      rightPaddingBoxRef.current.style.width = `${targetStyle.paddingRight}`;
      rightPaddingBoxRef.current.style.height = `calc(${targetRect.height}px - ${targetStyle.paddingBottom} - ${targetStyle.paddingTop})`;
      rightPaddingBoxRef.current.style.zIndex = "999998";
      rightPaddingBoxRef.current.style.pointerEvents = "none";
    }

    if (upperPaddingBoxRef.current) {
      upperPaddingBoxRef.current.style.position = "fixed";
      upperPaddingBoxRef.current.style.top = `${targetRect.top}px`;
      upperPaddingBoxRef.current.style.left = `${targetRect.left}px`;
      upperPaddingBoxRef.current.style.width = `${targetRect.width}px`;
      upperPaddingBoxRef.current.style.height = `${targetStyle.paddingTop}`;
      upperPaddingBoxRef.current.style.zIndex = "999998";
      upperPaddingBoxRef.current.style.pointerEvents = "none";
    }
  }

  return (
    <ShadowDom parentElement={document.body}>
      <style>{styles}</style>
      <div className={"opacity-30 bg-blue-500"} ref={blueBoxRef} />
      <div className={"opacity-30 bg-orange-500"} ref={upperMarginBoxRef} />
      <div className={"opacity-30 bg-orange-500"} ref={lowerMarginBoxRef} />
      <div className={"opacity-30 bg-green-500"} ref={lowerPaddingBoxRef} />
      <div className={"opacity-30 bg-green-500"} ref={leftPaddingBoxRef} />
      <div className={"opacity-30 bg-green-500"} ref={rightPaddingBoxRef} />
      <div className={"opacity-30 bg-green-500"} ref={upperPaddingBoxRef} />
    </ShadowDom>
  )
}
