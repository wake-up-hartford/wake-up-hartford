import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().min(1).max(64).optional(),
  language: z.enum(["en", "es"]).optional().default("en"),
});

// Default voices per language. EN keeps the existing warm voice.
// ES uses a Spanish-capable ElevenLabs voice (multilingual v2 already supports
// Spanish, so any voice works — picking a warm female community voice).
const DEFAULT_VOICE_EN = "YjlcD3XHztjJEo2wNszv";
const DEFAULT_VOICE_ES = "FGY2WhTYpPnrIDTdsKH5"; // Laura — warm, multilingual

// --- Number-to-words helpers so the TTS voice reads "4,567" as
// "four thousand five hundred sixty-seven" instead of stumbling over digits.
const ONES = [
  "zero","one","two","three","four","five","six","seven","eight","nine",
  "ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen",
  "seventeen","eighteen","nineteen",
];
const TENS = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];

function under1000ToWords(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return o === 0 ? TENS[t] : `${TENS[t]}-${ONES[o]}`;
  }
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return rest === 0 ? `${ONES[h]} hundred` : `${ONES[h]} hundred ${under1000ToWords(rest)}`;
}

function integerToWords(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (n < 0) return `negative ${integerToWords(-n)}`;
  if (n === 0) return "zero";
  const units = ["", "thousand", "million", "billion", "trillion"];
  const parts: string[] = [];
  let i = 0;
  let rem = Math.floor(n);
  while (rem > 0 && i < units.length) {
    const chunk = rem % 1000;
    if (chunk > 0) {
      parts.unshift(units[i] ? `${under1000ToWords(chunk)} ${units[i]}` : under1000ToWords(chunk));
    }
    rem = Math.floor(rem / 1000);
    i++;
  }
  return parts.join(" ").trim();
}

function numberTokenToWords(token: string): string {
  // Strip commas; keep optional decimal.
  const clean = token.replace(/,/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(clean)) return token;
  const [intPart, decPart] = clean.split(".");
  const intWords = integerToWords(Number(intPart));
  if (decPart == null) return intWords;
  const decWords = decPart.split("").map((d) => ONES[Number(d)]).join(" ");
  return `${intWords} point ${decWords}`;
}

function spokenifyNumbers(text: string): string {
  // Currency: $4,567 / $1.2 million
  let out = text.replace(/\$\s?(-?\d{1,3}(?:,\d{3})+|\-?\d+(?:\.\d+)?)/g, (_m, num: string) => {
    return `${numberTokenToWords(num)} dollars`;
  });
  // Percent: 25% / 25.5%
  out = out.replace(/(-?\d+(?:\.\d+)?)\s?%/g, (_m, num: string) => `${numberTokenToWords(num)} percent`);
  // Plain comma-grouped or large bare numbers: 4,567 or 12345
  out = out.replace(/\b-?\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g, (m) => numberTokenToWords(m));
  out = out.replace(/\b\d{4,}(?:\.\d+)?\b/g, (m) => numberTokenToWords(m));
  return out;
}

export const synthesizeStory = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<{ audioBase64: string; mimeType: string } | { error: string }> => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return { error: "Text-to-speech is not configured." };
    }

    const voiceId =
      data.voiceId ?? (data.language === "es" ? DEFAULT_VOICE_ES : DEFAULT_VOICE_EN);
    // The English number-to-words expander would mispronounce in Spanish; pass
    // the raw text through and let the multilingual voice handle digits.
    const spokenText = data.language === "es" ? data.text : spokenifyNumbers(data.text);


    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: spokenText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0.25,
            use_speaker_boost: true,
            speed: 1.0,
          },
        }),
      },
    );

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      console.error("ElevenLabs TTS error", upstream.status, errText);
      return { error: `TTS failed (${upstream.status}).` };
    }

    const buf = await upstream.arrayBuffer();
    const audioBase64 = Buffer.from(buf).toString("base64");
    return { audioBase64, mimeType: "audio/mpeg" };
  });
