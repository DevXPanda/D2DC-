"use client";

import { useEffect } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export default function AppConvexProvider({ children }) {
  useEffect(() => {
    window.localStorage.removeItem("d2dc-demo-db");
  }, []);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
