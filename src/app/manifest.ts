import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Frontier Radar",
    short_name: "Radar",
    description: "个人前沿信息库",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f4ef",
    theme_color: "#173f35",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
