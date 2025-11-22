"use client";
import { useSyncFcmOnMount } from "@/hooks/useSyncFcmOnMount";

export function FcmSyncer() {
  useSyncFcmOnMount();
  return null;
}
