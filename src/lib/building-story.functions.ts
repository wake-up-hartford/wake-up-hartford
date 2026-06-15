import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";


const Input = z.object({
  address: z.string(),
  neighborhood: z.string().optional().nullable(),
  yearBuilt: z.number().optional().nullable(),
  units: z.number().optional().nullable(),
  landlord: z.string().optional().nullable(),
  language: z.enum(["en", "es"]).optional().default("en"),
  building: z.object({
    openCodeViolations: z.number(),
    closedCodeViolations12mo: z.number(),
    recentViolations: z.array(z.string()).max(10),
    complaints311_12mo: z.number(),
    topComplaintCategory: z.string().optional().nullable(),
  }),
  landlordPortfolio: z.object({
    propertiesInHartford: z.number(),
    totalOpenCodeViolations: z.number(),
    totalComplaints311_12mo: z.number(),
  }).optional().nullable(),
});

export const generateBuildingStory = createServerFn({ method: "POST" })
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { story: null, error: "AI service is not configured." };

    const b = data.building;
    const p = data.landlordPortfolio;
    const facts = `
Building: ${data.address}
Neighborhood: ${data.neighborhood ?? "not available"}
Year built: ${data.yearBuilt ?? "not available"}
Units: ${data.units ?? "not available"}
Landlord/owner: ${data.landlord ?? "not on record"}

This building:
- Open code violations: ${b.openCodeViolations} (${b.closedCodeViolations12mo} closed in last 12 months)
- Recent violations: ${b.recentViolations.join("; ") || "none listed"}
- 311 complaints (last 12 months): ${b.complaints311_12mo}${b.topComplaintCategory ? ` (top category: ${b.topComplaintCategory})` : ""}

${p ? `Same owner's full Hartford portfolio:
- ${p.propertiesInHartford} buildings
- ${p.totalOpenCodeViolations} open code violations across all buildings
- ${p.totalComplaints311_12mo} 311 complaints in last 12 months` : "No owner portfolio data available."}
`.trim();

    const languageLine =
      data.language === "es"
        ? `\nWrite the entire response in Spanish (es-US, plain Hartford community Spanish, accessible and warm). Keep proper nouns, addresses, agency names, and place names (e.g. "Hartford", "311") in English. Do not include English translations in parentheses.`
        : "";

    const systemPrompt = `You are a community-data storyteller writing for Hartford, Connecticut tenants and neighbors.
Write at an 8th-grade reading level. Be warm, plain-spoken, honest, and hopeful.
Ground every claim in the numbers provided — never invent facts, history, names, or place details.
Tell the story of this specific building: what the records show, what residents likely experience, and how it compares to the owner's broader portfolio.
Write in third person about tenants and neighbors. Do NOT use "we," "us," or "our" — you are not a tenant or member of this community, you are an outside storyteller.
Length: 2 to 3 tight paragraphs, roughly 120-180 words total. Plain prose, no headings, no bullet lists. Be concise — cut anything that isn't essential.${languageLine}`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `${facts}\n\nWrite the story of this building based only on these records.` },
          ],
        }),
      });

      if (res.status === 429) return { story: null, error: "Too many requests — please try again in a moment." };
      if (res.status === 402) return { story: null, error: "AI credits depleted. Please contact the site administrator." };
      if (!res.ok) {
        console.error("AI gateway error", res.status, await res.text());
        return { story: null, error: `AI service error (${res.status}).` };
      }

      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const story = json.choices?.[0]?.message?.content?.trim() ?? null;
      if (!story) return { story: null, error: "AI returned an empty response." };
      return { story, error: null };
    } catch (err) {
      console.error("generateBuildingStory failed", err);
      return { story: null, error: "AI service is currently unavailable." };
    }
  });
