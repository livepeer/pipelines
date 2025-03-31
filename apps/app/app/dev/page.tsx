"use client";

import { useState } from "react";

const Page = () => {
  const [s, setS] = useState(1);

  if (s === 1) {
    setS(s => s + 1);
    useState(3);
    console.log(s);
  }
};

export default Page;
