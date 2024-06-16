"use client";
import SplineScene from "@splinetool/react-spline";

export default function Spline() {
  "use no memo";

  return (
    <SplineScene
      scene="https://prod.spline.design/d8JOmvRPOnsJPtvS/scene.splinecode"
      className="hidden lg:flex max-h-64"
    />
  );
}
