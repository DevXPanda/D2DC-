"use client";

import { usePathname } from "next/navigation";
import CitizenShell from "@/components/citizen-shell";

export default function CitizenLayout({ children }) {
  const pathname = usePathname();
  if (pathname === "/citizen/login") {
    return children;
  }
  return <CitizenShell>{children}</CitizenShell>;
}
