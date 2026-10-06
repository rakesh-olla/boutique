"use client";

import { useTopLoader } from "nextjs-toploader";
import { useCallback } from "react";

/** Runs async work with the global top progress bar (fetch + navigation feedback). */
export function useRunWithTopProgress() {
  const tl = useTopLoader();
  return useCallback(
    async <T,>(work: () => Promise<T>): Promise<T> => {
      tl.start();
      try {
        return await work();
      } finally {
        tl.done();
      }
    },
    [tl],
  );
}
