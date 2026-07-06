import { createFileRoute } from "@tanstack/react-router";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

export const Route = createFileRoute("/api/street-view")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const lovableKey = process.env.LOVABLE_API_KEY;
        const gmapsKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!lovableKey || !gmapsKey) {
          return new Response("Not configured", { status: 503 });
        }

        const url = new URL(request.url);
        const address = url.searchParams.get("address")?.trim();
        if (!address || address.length > 200) {
          return new Response("Bad request", { status: 400 });
        }

        const size = "800x600";
        const auth = {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": gmapsKey,
        };

        // 1) Confirm imagery exists before charging for the image.
        const metaUrl = `${GATEWAY_URL}/maps/api/streetview/metadata?size=${size}&location=${encodeURIComponent(address)}`;
        const metaRes = await fetch(metaUrl, { headers: auth });
        if (!metaRes.ok) {
          return new Response("Upstream metadata error", { status: 502 });
        }
        const meta = (await metaRes.json()) as { status?: string };
        if (meta.status !== "OK") {
          return new Response("No imagery", { status: 404 });
        }

        // 2) Fetch the image and stream it back.
        const imgUrl = `${GATEWAY_URL}/maps/api/streetview?size=${size}&location=${encodeURIComponent(address)}&fov=80&pitch=0`;
        const imgRes = await fetch(imgUrl, { headers: auth });
        if (!imgRes.ok || !imgRes.body) {
          return new Response("Upstream image error", { status: 502 });
        }

        return new Response(imgRes.body, {
          status: 200,
          headers: {
            "Content-Type": imgRes.headers.get("Content-Type") ?? "image/jpeg",
            "Cache-Control": "public, max-age=604800, s-maxage=604800, immutable",
          },
        });
      },
    },
  },
});
