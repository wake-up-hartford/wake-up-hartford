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
  indicators: z.array(IndicatorInput).min(1),
});

export const generateTractStory = createServerFn({ method: "POST" })
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { story: null, error: "AI service is not configured." };
    }

    const indicatorLines = data.indicators
      .map((i) => {
        const cmp = i.stateAverage ? ` (CT average: ${i.stateAverage.value})` : "";
        return `- ${i.label}: ${i.value} [${i.severity}]${cmp}${i.note ? ` — ${i.note}` : ""}`;
      })
      .join("\n");

    const systemPrompt = `You are a community-data storyteller writing for Hartford, Connecticut residents.
Write at an 8th-grade reading level. Be warm, plain-spoken, honest, and hopeful.
Ground every claim in the numbers provided — never invent facts, statistics, history, or place details.
Do not use hedge phrases like "according to the data." Just tell the story the numbers tell.
When a number is far from the Connecticut average, name the gap plainly.
End with one short paragraph about what residents and neighbors can build on together.
Length: 4 to 6 short paragraphs, roughly 250-400 words. Plain prose, no headings, no bullet lists.`;

    const userPrompt = `Census Tract ${data.tractName} — ${data.neighborhood}, Hartford, CT.

Indicators from the U.S. Census Bureau (American Community Survey) and USDA:
${indicatorLines}

Write the story of this neighborhood based only on these indicators.`;

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

      if (res.status === 429) {
        return { story: null, error: "Too many requests right now — please try again in a moment." };
      }
      if (res.status === 402) {
        return { story: null, error: "AI credits depleted. Please contact the site administrator." };
      }
      if (!res.ok) {
        const text = await res.text();
        console.error("AI gateway error", res.status, text);
        return { story: null, error: `AI service error (${res.status}).` };
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const story = json.choices?.[0]?.message?.content?.trim() ?? null;
      if (!story) return { story: null, error: "AI returned an empty response." };
      return { story, error: null };
    } catch (err) {
      console.error("generateTractStory failed", err);
      return { story: null, error: "AI service is currently unavailable." };
    }
  });
