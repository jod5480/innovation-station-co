import { createFileRoute } from "@tanstack/react-router";
import KinoTribeApp from "@/kinotribe/App";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Cinetribe — Film & Cinema Social Network" },
      {
        name: "description",
        content:
          "Connect with filmmakers, share showreels, and find regional and global casting calls.",
      },
      { property: "og:title", content: "Cinetribe — Film & Cinema Social Network" },
      {
        property: "og:description",
        content:
          "Connect with filmmakers, share showreels, and find regional and global casting calls.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <KinoTribeApp />;
}
