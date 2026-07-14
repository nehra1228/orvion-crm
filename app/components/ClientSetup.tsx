"use client";
import { useEffect } from "react";
import { installTimeUppercase } from "@/lib/polyfills/time";

export default function ClientSetup() {
  useEffect(() => {
    installTimeUppercase();
  }, []);
  return null;
}
