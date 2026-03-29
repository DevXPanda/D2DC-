"use client";

import { usePathname } from "next/navigation";
import SupervisorShell from "@/components/supervisor-shell";

export default function SupervisorLayout({ children }) {
  const pathname = usePathname();
  if (pathname === "/supervisor/login") {
    return children;
  }
  return <SupervisorShell>{children}</SupervisorShell>;
}
