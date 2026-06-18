import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const HEADERS = {
    "Content-Type": "application/json",
    "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    // Try Instagram's internal JSON endpoint (public profile, no auth needed)
    const res = await fetch(
      "https://www.instagram.com/api/v1/users/web_profile_info/?username=refractiveaazain",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          Accept: "*/*",
          "x-ig-app-id": "936619743392459",
        },
      },
    );

    if (res.ok) {
      const json = (await res.json()) as any;
      const edges = json?.data?.user?.edge_owner_to_timeline_media?.edges ?? [];
      const codes: string[] = edges
        .slice(0, 6)
        .map((e: any) => e?.node?.shortcode)
        .filter(Boolean);
      if (codes.length) {
        return new Response(JSON.stringify({ codes }), { headers: HEADERS });
      }
    }

    // Fallback: try the legacy endpoint
    const res2 = await fetch(
      "https://www.instagram.com/refractiveaazain/?__a=1&__d=dis",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json, text/javascript, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    );

    if (res2.ok) {
      const text = await res2.text();
      try {
        const json = JSON.parse(text) as any;
        const edges =
          json?.graphql?.user?.edge_owner_to_timeline_media?.edges ??
          json?.data?.user?.edge_owner_to_timeline_media?.edges ??
          [];
        const codes: string[] = edges
          .slice(0, 6)
          .map((e: any) => e?.node?.shortcode)
          .filter(Boolean);
        if (codes.length) {
          return new Response(JSON.stringify({ codes }), { headers: HEADERS });
        }
      } catch {
        // Parse HTML for shortcodes
        const matches = text.match(/"shortcode"\s*:\s*"([A-Za-z0-9_-]{11})"/g);
        if (matches) {
          const codes = [
            ...new Set(
              matches
                .map((m) => m.match(/"([A-Za-z0-9_-]{11})"/)?.[1])
                .filter(Boolean),
            ),
          ] as string[];
          return new Response(JSON.stringify({ codes: codes.slice(0, 6) }), {
            headers: HEADERS,
          });
        }
      }
    }
  } catch {
    // Network or parse failure
  }

  return new Response(JSON.stringify({ codes: [] }), { headers: HEADERS });
};
