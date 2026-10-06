"use client";

import NextTopLoader from "nextjs-toploader";
import { useTheme } from "next-themes";

export function NavigationProgress() {
  const { resolvedTheme } = useTheme();
  const color = resolvedTheme === "dark" ? "#fafafa" : "#18181b";

  return (
    <NextTopLoader
      color={color}
      height={3}
      showSpinner={false}
      crawlSpeed={280}
      speed={450}
      shadow={false}
      zIndex={99999}
    />
  );
}
