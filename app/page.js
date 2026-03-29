"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session-store";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/admin/login");
      return;
    }
    router.replace(
      session.role === "collector"
        ? "/collector/dashboard"
        : session.role === "supervisor"
          ? "/supervisor/dashboard"
          : session.role === "citizen"
            ? "/citizen/dashboard"
          : "/dashboard"
    );
  }, [router]);

  return null;
}
