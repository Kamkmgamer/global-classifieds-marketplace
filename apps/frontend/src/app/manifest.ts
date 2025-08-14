import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Global Classifieds Marketplace",
    short_name: "Classifieds",
    description: "Buy and sell anything globally. Post listings, chat in real-time, and close deals fast.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" }
    ],
  };
}
