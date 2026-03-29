"use client";

import { usePathname } from "next/navigation";
import CollectorShell from "@/components/collector-shell";

export default function CollectorLayout({ children }) {
  const pathname = usePathname();
  if (pathname === "/collector/login") {
    return children;
  }
  return <CollectorShell>{children}</CollectorShell>;
}
