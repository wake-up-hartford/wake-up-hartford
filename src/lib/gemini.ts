// Settings for calling Google Gemini directly from server functions
// (replaces Lovable's AI gateway). The API key stays on the server: read
// process.env.GEMINI_API_KEY inside a server function handler.
//
// This is Gemini's OpenAI-compatible endpoint, so requests and responses
// keep the same shape the app used with the gateway.
export const GEMINI_CHAT_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

// Pinned stable Gemini Flash model. Change it on purpose, not through an
// alias such as gemini-flash-latest, so the writing doesn't shift unannounced.
export const GEMINI_MODEL = "gemini-3.8-flash";
