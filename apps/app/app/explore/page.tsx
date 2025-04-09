"use client";

import BentoGrids from "./BentoGrids";
import Header from "./Header";

export default function Explore() {
  return (
    <>
      <div className="bg-gray-50 relative isolate">
        <Header />
        <BentoGrids />
      </div>
    </>
  );
}
