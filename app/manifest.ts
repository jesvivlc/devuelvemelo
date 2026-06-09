import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Devuélvemelo",
    short_name: "Devuélvemelo",
    description: "Reclama lo que te deben, sin el drama.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f9fafb",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
