import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const IndicatorInput = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
  severity: z.string(),
  note: z.string().optional().default(""),
  stateAverage: z
    .object({ value: z.string(), label: z.string() })
    .nullable()
    .optional(),
});

const Input = z.object({
  tractName: z.string(),
  neighborhood: z.string(),
  audience: z.enum(["state_rep", "council"]).default("state_rep"),
  tone: z.enum(["urgent", "constructive", "personal"]).default("constructive"),
  senderName: z.string().optional().default(""),
  indicators: z.array(IndicatorInput).min(1),
});

export const draftAdvocacyLetter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { letter: null, error: "AI service is not configured." };
    }

    // Pull the worst 3 indicators (concern first, then watch).
    const ranked = [...data.indicators].sort((a, b) => {
      const order = { concern: 0, watch: 1, good: 2, neutral: 3 } as Record<string, number>;
      return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
    }).slice(0, 4);

    const indicatorLines = ranked
      .map((i) => {
        const cmp = i.stateAverage ? ` (CT average: ${i.stateAverage.value})` : "";
        return `- ${i.label}: ${i.value} [${i.severity}]${cmp}${i.note ? ` — ${i.note}` : ""}`;
      })
      .join("\n");

    const audienceLabel = data.audience === "council" ? "Hartford City Council member" : "Connecticut state representative";
    const salutation = data.audience === "council" ? "Dear Council Member," : "Dear Representative,";

    const toneLine =
      data.tone === "urgent"
        ? "Tone: urgent and direct. Make clear this is a crisis that demands action this session."
        : data.tone === "personal"
          ? "Tone: personal and grounded. Speak as a constituent who lives with these conditions, not as a policy analyst."
          : "Tone: constructive and respectful. Acknowledge complexity while pressing for concrete action.";

    const signature = data.senderName ? `\n\nSincerely,\n${data.senderName}` : "\n\nSincerely,\n[Your name]";

    const systemPrompt = `You are drafting a short advocacy email from a Hartford resident to their ${audienceLabel}.
Write at an 8th-grade reading level. ${toneLine}
Ground every claim in the indicators provided — never invent statistics.
Cite the specific numbers and the CT comparison when available.
Include ONE clear ask at the end (e.g., support a specific kind of legislation, hold a town hall in the tract, fund a specific program).
Length: 150–220 words. Use plain paragraphs — no headings, no bullet lists, no markdown.
Begin with the salutation "${salutation}" and end with the signature block: ${signature.replace(/\n/g, " / ")}.`;

    const userPrompt = `Census Tract ${data.tractName} — ${data.neighborhood}, Hartford, CT.

Indicators (U.S. Census Bureau ACS 2022 5-year + USDA):
${indicatorLines}

Draft the email now.`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (res.status === 429) return { letter: null, error: "Too many requests — try again shortly." };
      if (res.status === 402) return { letter: null, error: "AI credits depleted. Contact the site administrator." };
      if (!res.ok) {
        const text = await res.text();
        console.error("AI gateway error", res.status, text);
        return { letter: null, error: `AI service error (${res.status}).` };
      }

      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const letter = json.choices?.[0]?.message?.content?.trim() ?? null;
      if (!letter) return { letter: null, error: "AI returned an empty response." };
      return { letter, error: null };
    } catch (err) {
      console.error("draftAdvocacyLetter failed", err);
      return { letter: null, error: "AI service is currently unavailable." };
    }
  });
