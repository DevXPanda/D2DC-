"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function D2dcRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/collections");
  }, [router]);

  return null;
}