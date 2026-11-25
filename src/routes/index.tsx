import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panou produse" },
      { name: "description", content: "Creează și publică pagini de produs." },
      { property: "og:title", content: "Panou produse" },
      { property: "og:description", content: "Creează și publică pagini de produs." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
});
