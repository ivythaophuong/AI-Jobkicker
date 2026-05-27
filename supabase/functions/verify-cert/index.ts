import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectPlatform(url: string): string | null {
  const u = url.toLowerCase();
  if (u.includes("coursera.org/verify/") || u.includes("coursera.org/account/accomplishments/")) return "coursera";
  if (u.includes("udemy.com/certificate/")) return "udemy";
  if (u.includes("credential.net/") || u.includes("accredible.com/")) return "accredible";
  if (u.includes("courses.edx.org/certificates/") || u.includes("edx.org/certificates/")) return "edx";
  if (u.includes("freecodecamp.org/certification/")) return "freecodecamp";
  return null;
}

function extractJsonLd(html: string): Record<string, unknown> | null {
  const m = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try { return JSON.parse(m[1].trim()); } catch { return null; }
}

function extractMeta(html: string, prop: string): string | null {
  const m =
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i")) ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i"));
  return m?.[1] ?? null;
}

function ok(platform: string, extra: Record<string, unknown>) {
  return { verified: true, platform, ...extra };
}

// ── Platform verifiers ────────────────────────────────────────────────────────

async function verifyCourseraPage(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`Coursera returned ${res.status}`);
  const html = await res.text();
  const ld = extractJsonLd(html) as Record<string, any> | null;

  return ok("coursera", {
    name: ld?.name ?? extractMeta(html, "og:title")?.replace(/ \| Coursera$/, "") ?? null,
    recipientName: ld?.awardedTo?.name ?? ld?.recipient?.name ?? null,
    issuer:
      ld?.recognizedBy?.name ??
      ld?.issuedBy?.name ??
      ld?.sourceOrganization?.name ??
      "Coursera",
    issuedAt: ld?.dateCreated ?? ld?.completionDate ?? ld?.datePublished ?? null,
    badgeUrl: url,
  });
}

async function verifyUdemyPage(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`Udemy returned ${res.status}`);
  const html = await res.text();
  const ld = extractJsonLd(html) as Record<string, any> | null;
  const title = extractMeta(html, "og:title") ?? "";

  return ok("udemy", {
    name:
      ld?.name ??
      (title.replace(/ \| Udemy$/, "").replace(/^Certificate of Completion: /, "") || null),
    recipientName: ld?.awardedTo?.name ?? null,
    issuer: "Udemy",
    issuedAt: ld?.dateCreated ?? null,
    badgeUrl: url,
  });
}

async function verifyAccrediblePage(url: string) {
  // Try the Accredible JSON API first (works for numeric IDs)
  const idMatch = url.match(/(?:credential\.net|accredible\.com)\/(?:credentials\/)?([a-zA-Z0-9-]+)/);
  if (idMatch) {
    const credId = idMatch[1];
    if (/^\d+$/.test(credId)) {
      try {
        const apiRes = await fetch(`https://api.accredible.com/v1/public/credential?id=${credId}`, {
          headers: { Accept: "application/json" },
        });
        if (apiRes.ok) {
          const data = (await apiRes.json()) as any;
          const c = data.credential;
          if (c) {
            return ok("accredible", {
              name: c.name ?? c.group_name ?? null,
              recipientName: c.recipient?.name ?? null,
              issuer: c.issuer?.name ?? "Accredible",
              issuedAt: c.issued_on ?? null,
              expiresAt: c.expired_on ?? null,
              imageUrl: c.badge?.url ?? null,
              badgeUrl: url,
            });
          }
        }
      } catch { /* fall through to HTML scrape */ }
    }
  }

  // Fallback: HTML scrape
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`Accredible returned ${res.status}`);
  const html = await res.text();
  const ld = extractJsonLd(html) as Record<string, any> | null;

  return ok("accredible", {
    name: ld?.name ?? extractMeta(html, "og:title") ?? null,
    recipientName: ld?.awardedTo?.name ?? null,
    issuer: ld?.issuedBy?.name ?? "Accredible",
    issuedAt: ld?.dateCreated ?? null,
    badgeUrl: url,
  });
}

async function verifyEdxPage(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`edX returned ${res.status}`);
  const html = await res.text();
  const ld = extractJsonLd(html) as Record<string, any> | null;

  return ok("edx", {
    name:
      ld?.name ??
      extractMeta(html, "og:title")?.replace(/ \| edX$/, "") ??
      null,
    recipientName: ld?.awardedTo?.name ?? null,
    issuer: ld?.issuedBy?.name ?? ld?.recognizedBy?.name ?? "edX",
    issuedAt: ld?.dateCreated ?? null,
    badgeUrl: url,
  });
}

async function verifyFreeCodeCampPage(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`freeCodeCamp returned ${res.status}`);
  const html = await res.text();
  const ld = extractJsonLd(html) as Record<string, any> | null;
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);

  return ok("freecodecamp", {
    name: ld?.name ?? titleMatch?.[1]?.replace(/ \| freeCodeCamp\.org$/, "") ?? null,
    recipientName: ld?.awardedTo?.name ?? null,
    issuer: "freeCodeCamp",
    issuedAt: ld?.dateCreated ?? null,
    badgeUrl: url,
  });
}

// ── Entry point ───────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "url required" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const platform = detectPlatform(url);
    if (!platform) {
      return new Response(JSON.stringify({ error: "Unsupported platform" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const verifiers: Record<string, (u: string) => Promise<unknown>> = {
      coursera: verifyCourseraPage,
      udemy: verifyUdemyPage,
      accredible: verifyAccrediblePage,
      edx: verifyEdxPage,
      freecodecamp: verifyFreeCodeCampPage,
    };

    const result = await verifiers[platform](url);

    return new Response(JSON.stringify(result), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
