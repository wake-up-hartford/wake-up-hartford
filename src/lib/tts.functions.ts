import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().min(1).max(64).optional(),
});

export const synthesizeStory = createServerFn({ method: "POST", response: "raw" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return new Response("ELEVENLABS_API_KEY is not configured", { status: 500 });
    }

    const voiceId = data.voiceId ?? "EXAVITQu4vr4xnSDxMaL"; // Sarah — warm, clear

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
      const errText = await upstream.text();
      return new Response(errText || "TTS failed", { status: upstream.status });
    }

    const buf = await upstream.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  });
