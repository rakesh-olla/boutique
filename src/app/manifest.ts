import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Boutique Management",
    short_name: "Boutique",
    description: "Tailoring & boutique operations",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#0a0a0a",
  };
}
