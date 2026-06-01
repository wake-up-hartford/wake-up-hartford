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
  stateFips: z.string().regex(/^\d{2}$/).optional(),
  tone: z.enum(["warm", "direct"]).optional().default("warm"),
  language: z.enum(["en", "es"]).optional().default("en"),
  indicators: z.array(IndicatorInput).min(1),
});

export type Tone = "warm" | "direct";


// FIPS state code → (name, abbr). Used to localize the AI story so it doesn't
// hardcode Connecticut when the user looked up a tract in another state.
const STATE_BY_FIPS: Record<string, { name: string; abbr: string }> = {
  "01": { name: "Alabama", abbr: "AL" }, "02": { name: "Alaska", abbr: "AK" },
  "04": { name: "Arizona", abbr: "AZ" }, "05": { name: "Arkansas", abbr: "AR" },
  "06": { name: "California", abbr: "CA" }, "08": { name: "Colorado", abbr: "CO" },
  "09": { name: "Connecticut", abbr: "CT" }, "10": { name: "Delaware", abbr: "DE" },
  "11": { name: "District of Columbia", abbr: "DC" }, "12": { name: "Florida", abbr: "FL" },
  "13": { name: "Georgia", abbr: "GA" }, "15": { name: "Hawaii", abbr: "HI" },
  "16": { name: "Idaho", abbr: "ID" }, "17": { name: "Illinois", abbr: "IL" },
  "18": { name: "Indiana", abbr: "IN" }, "19": { name: "Iowa", abbr: "IA" },
  "20": { name: "Kansas", abbr: "KS" }, "21": { name: "Kentucky", abbr: "KY" },
  "22": { name: "Louisiana", abbr: "LA" }, "23": { name: "Maine", abbr: "ME" },
  "24": { name: "Maryland", abbr: "MD" }, "25": { name: "Massachusetts", abbr: "MA" },
  "26": { name: "Michigan", abbr: "MI" }, "27": { name: "Minnesota", abbr: "MN" },
  "28": { name: "Mississippi", abbr: "MS" }, "29": { name: "Missouri", abbr: "MO" },
  "30": { name: "Montana", abbr: "MT" }, "31": { name: "Nebraska", abbr: "NE" },
  "32": { name: "Nevada", abbr: "NV" }, "33": { name: "New Hampshire", abbr: "NH" },
  "34": { name: "New Jersey", abbr: "NJ" }, "35": { name: "New Mexico", abbr: "NM" },
  "36": { name: "New York", abbr: "NY" }, "37": { name: "North Carolina", abbr: "NC" },
  "38": { name: "North Dakota", abbr: "ND" }, "39": { name: "Ohio", abbr: "OH" },
  "40": { name: "Oklahoma", abbr: "OK" }, "41": { name: "Oregon", abbr: "OR" },
  "42": { name: "Pennsylvania", abbr: "PA" }, "44": { name: "Rhode Island", abbr: "RI" },
  "45": { name: "South Carolina", abbr: "SC" }, "46": { name: "South Dakota", abbr: "SD" },
  "47": { name: "Tennessee", abbr: "TN" }, "48": { name: "Texas", abbr: "TX" },
  "49": { name: "Utah", abbr: "UT" }, "50": { name: "Vermont", abbr: "VT" },
  "51": { name: "Virginia", abbr: "VA" }, "53": { name: "Washington", abbr: "WA" },
  "54": { name: "West Virginia", abbr: "WV" }, "55": { name: "Wisconsin", abbr: "WI" },
  "56": { name: "Wyoming", abbr: "WY" }, "72": { name: "Puerto Rico", abbr: "PR" },
};

export const generateTractStory = createServerFn({ method: "POST" })
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { story: null, error: "AI service is not configured." };
    }

    const stateInfo = data.stateFips ? STATE_BY_FIPS[data.stateFips] : undefined;
    const isCT = data.stateFips === "09" || !data.stateFips;

    const indicatorLines = data.indicators
      .map((i) => {
        // Comparisons in the indicator payload are always against Connecticut.
        // Only include them when the tract is actually in CT.
        const cmp = isCT && i.stateAverage ? ` (CT average: ${i.stateAverage.value})` : "";
        return `- ${i.label}: ${i.value} [${i.severity}]${cmp}${i.note ? ` — ${i.note}` : ""}`;
      })
      .join("\n");

    const placePhrase = isCT
      ? "Hartford, Connecticut"
      : stateInfo
        ? stateInfo.name
        : "this community";

    const toneLine = data.tone === "direct"
      ? `Tone: direct and practical. Be matter-of-fact and unsentimental. Lead with the numbers and what they mean concretely for daily life. Skip warmth, encouragement, and hopeful framing — just describe what is true.`
      : `Tone: warm and hopeful. Be plain-spoken, honest, and hopeful. Acknowledge hardship without sensationalizing it, and close on what can be built on together.`;

    const closingLine = data.tone === "direct"
      ? `End with one short paragraph that names the most pressing practical needs the numbers point to. No pep talk.`
      : `End with one short paragraph about what residents and neighbors can build on together.`;

    const systemPrompt = isCT
      ? `You are a community-data storyteller writing for Hartford, Connecticut residents.
Write at an 8th-grade reading level.
${toneLine}
Ground every claim in the numbers provided — never invent facts, statistics, history, or place details.
Do not use hedge phrases like "according to the data." Just tell the story the numbers tell.
When a number is far from the Connecticut average, name the gap plainly.
Write in third person about residents and neighbors. Do NOT use "we," "us," or "our" — you are not a neighbor or member of this community, you are an outside storyteller.
${closingLine}
Length: 4 to 6 short paragraphs, roughly 250-400 words. Plain prose, no headings, no bullet lists.`
      : `You are a community-data storyteller writing for residents of ${placePhrase}.
Write at an 8th-grade reading level.
${toneLine}
Ground every claim in the numbers provided — never invent facts, statistics, history, or place details.
Do not use hedge phrases like "according to the data." Just tell the story the numbers tell.
Do NOT mention Connecticut, Hartford, or any CT-specific comparisons — this tract is not in Connecticut.
No statewide comparisons are provided, so describe the numbers on their own terms rather than comparing to an average.
Write in third person about residents and neighbors. Do NOT use "we," "us," or "our" — you are not a neighbor or member of this community, you are an outside storyteller.
${closingLine}
Length: 4 to 6 short paragraphs, roughly 250-400 words. Plain prose, no headings, no bullet lists.`;

    const userPrompt = `Census Tract ${data.tractName} — ${data.neighborhood}${isCT ? ", Hartford, CT" : stateInfo ? `, ${stateInfo.name}` : ""}.

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
