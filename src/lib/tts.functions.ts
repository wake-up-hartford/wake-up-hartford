import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().min(1).max(64).optional(),
});

export const synthesizeStory = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<{ audioBase64: string; mimeType: string } | { error: string }> => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return { error: "Text-to-speech is not configured." };
    }

    const voiceId = data.voiceId ?? "YjlcD3XHztjJEo2wNszv";

    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: data.text,
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
