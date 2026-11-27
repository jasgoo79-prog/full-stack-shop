import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panou produse" },
      { name: "description", content: "Creează și publică pagini de produs." },
      { property: "og:title", content: "Panou produse" },
      { property: "og:description", content: "Creează și publică pagini de produs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
});
