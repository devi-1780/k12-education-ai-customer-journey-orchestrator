import { env } from '../config/env.js';

const GEMINI_ENDPOINT = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

/**
 * Thin wrapper around the Gemini API. If no API key is configured (or the
 * call fails), returns a clearly labeled mock response so the app keeps
 * working end-to-end in demo/dev environments.
 */
export async function callGemini(prompt, { jsonMode = false } = {}) {
  if (!env.gemini.apiKey) {
    return { text: mockText(prompt), isMock: true };
  }

  try {
    const res = await fetch(`${GEMINI_ENDPOINT(env.gemini.model)}?key=${env.gemini.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        ...(jsonMode ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
      }),
    });
    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || mockText(prompt);
    return { text, isMock: false };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[GEMINI] falling back to mock response:', err.message);
    return { text: mockText(prompt), isMock: true };
  }
}

function mockText(prompt) {
  return `[MOCK AI RESPONSE - no GEMINI_API_KEY configured] Generated a placeholder result for: "${String(
    prompt
  ).slice(0, 120)}..."`;
}

// --- Higher level AI capabilities used by the AI controller ---

export async function classifyIntentSentiment(text) {
  const prompt = `Classify the intent and sentiment of this parent/student message. Respond as JSON with keys intent, sentiment, confidence (0-1). Message: """${text}"""`;
  const { text: out, isMock } = await callGemini(prompt, { jsonMode: true });
  const parsed = safeJson(out) || { intent: 'general_inquiry', sentiment: 'neutral', confidence: 0.5 };
  return { ...parsed, isMock };
}

export async function scoreChurnPropensity(profileSummary) {
  const prompt = `Given this family engagement summary, estimate churn risk (0-1) and 2 contributing factors. Summary: ${JSON.stringify(
    profileSummary
  )}`;
  const { text: out, isMock } = await callGemini(prompt, { jsonMode: true });
  const parsed = safeJson(out) || { churnScore: 0.35, factors: ['limited data'] };
  return { ...parsed, isMock };
}

export async function recommendNextBestAction(context) {
  const prompt = `Recommend the single best next action for this family's journey stage and context. Respond as JSON {action, channel, rationale, confidence}. Context: ${JSON.stringify(
    context
  )}`;
  const { text: out, isMock } = await callGemini(prompt, { jsonMode: true });
  const parsed = safeJson(out) || {
    action: 'Schedule a check-in call',
    channel: 'call',
    rationale: 'Default fallback recommendation',
    confidence: 0.4,
  };
  return { ...parsed, isMock };
}

export async function draftResponse(ticketContext) {
  const prompt = `Draft a warm, professional reply from a school service agent to this parent ticket. Ticket: ${JSON.stringify(
    ticketContext
  )}`;
  const { text: out, isMock } = await callGemini(prompt);
  return { draft: out, isMock };
}

export async function summarizeConversation(messages) {
  const prompt = `Summarise this conversation thread in 3 concise sentences for a school agent handoff: ${JSON.stringify(
    messages
  )}`;
  const { text: out, isMock } = await callGemini(prompt);
  return { summary: out, isMock };
}

function safeJson(text) {
  try {
    const cleaned = String(text).replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
