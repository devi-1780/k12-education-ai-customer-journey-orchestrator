import { env } from '../config/env.js';
import AIRun from '../models/AIRun.js';

const MODEL_VERSION = env.gemini.model;

/**
 * Thin wrapper around the Gemini API. Falls back to a clearly-labeled mock
 * response when no API key is configured, or when the live call fails, so the
 * app keeps working end-to-end in local/demo environments.
 */
async function callGemini(prompt, { jsonOutput = false } = {}) {
  if (!env.gemini.apiKey) {
    return { text: null, usedFallback: true };
  }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_VERSION}:generateContent?key=${env.gemini.apiKey}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      ...(jsonOutput ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Gemini API responded ${res.status}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    if (!text) throw new Error('Empty Gemini response');
    return { text, usedFallback: false };
  } catch (err) {
    return { text: null, usedFallback: true, error: err.message };
  }
}

async function withRunTracking({ capability, requestedBy, profile }, fn) {
  const start = Date.now();
  let status = 'success';
  let errorMessage = null;
  let result;
  try {
    result = await fn();
    if (result.usedFallback) status = 'fallback_mock';
  } catch (err) {
    status = 'failed';
    errorMessage = err.message;
    result = { output: null };
  }
  const latencyMs = Date.now() - start;
  await AIRun.create({
    capability,
    modelVersion: MODEL_VERSION,
    requestedBy: requestedBy?._id || requestedBy,
    profile: profile || null,
    status,
    latencyMs,
    errorMessage,
  });
  return { ...result, status, latencyMs };
}

export async function classifyIntentSentiment({ text, requestedBy, profile }) {
  return withRunTracking({ capability: 'intent_classification', requestedBy, profile }, async () => {
    const prompt = `Classify the intent (one of: admission_inquiry, complaint, academic_question, attendance_issue, billing, general) and sentiment (positive, neutral, negative) of this parent/student message. Respond as compact JSON: {"intent": "...", "sentiment": "...", "confidence": 0.0-1.0, "explanation": "one sentence"}.\n\nMessage: """${text}"""`;
    const { text: raw, usedFallback } = await callGemini(prompt, { jsonOutput: true });
    if (usedFallback || !raw) {
      return {
        output: mockIntentSentiment(text),
        usedFallback: true,
      };
    }
    try {
      return { output: JSON.parse(raw), usedFallback: false };
    } catch {
      return { output: mockIntentSentiment(text), usedFallback: true };
    }
  });
}

function mockIntentSentiment(text) {
  const lower = (text || '').toLowerCase();
  let intent = 'general';
  if (lower.includes('admission') || lower.includes('enroll')) intent = 'admission_inquiry';
  else if (lower.includes('fee') || lower.includes('invoice') || lower.includes('pay')) intent = 'billing';
  else if (lower.includes('absent') || lower.includes('attendance')) intent = 'attendance_issue';
  else if (lower.includes('grade') || lower.includes('exam') || lower.includes('homework')) intent = 'academic_question';
  else if (lower.includes('complain') || lower.includes('unhappy') || lower.includes('issue')) intent = 'complaint';

  let sentiment = 'neutral';
  if (/(thank|great|happy|good)/.test(lower)) sentiment = 'positive';
  if (/(angry|bad|disappoint|frustrat|worst)/.test(lower)) sentiment = 'negative';

  return {
    intent,
    sentiment,
    confidence: 0.62,
    explanation: `[MOCK] Rule-based fallback classification based on keyword matches (no live Gemini key configured).`,
  };
}

export async function scoreChurnPropensity({ profileSummary, requestedBy, profile }) {
  return withRunTracking({ capability: 'churn_propensity', requestedBy, profile }, async () => {
    const prompt = `Given this family/student profile summary, estimate churn risk (0-1) and conversion propensity (0-1) with one-sentence explanations. Respond as JSON: {"churnRisk":0.0,"conversionPropensity":0.0,"explanation":"..."}\n\nProfile: ${JSON.stringify(profileSummary)}`;
    const { text: raw, usedFallback } = await callGemini(prompt, { jsonOutput: true });
    if (usedFallback || !raw) {
      return { output: mockChurnScore(profileSummary), usedFallback: true };
    }
    try {
      return { output: JSON.parse(raw), usedFallback: false };
    } catch {
      return { output: mockChurnScore(profileSummary), usedFallback: true };
    }
  });
}

function mockChurnScore(profileSummary) {
  const openTickets = profileSummary?.openTicketCount || 0;
  const negativeInteractions = profileSummary?.negativeInteractionCount || 0;
  const attendanceRate = profileSummary?.attendanceRate ?? 0.95;
  let risk = 0.15 + openTickets * 0.08 + negativeInteractions * 0.06 + (1 - attendanceRate) * 0.4;
  risk = Math.min(Math.max(risk, 0.02), 0.97);
  return {
    churnRisk: Number(risk.toFixed(2)),
    conversionPropensity: Number((1 - risk * 0.6).toFixed(2)),
    explanation: `[MOCK] Deterministic scoring from open tickets (${openTickets}), negative interactions (${negativeInteractions}), and attendance rate (${Math.round(attendanceRate * 100)}%).`,
  };
}

export async function recommendNextBestAction({ profileSummary, requestedBy, profile }) {
  return withRunTracking({ capability: 'next_best_action', requestedBy, profile }, async () => {
    const prompt = `Given this profile summary, recommend the single next-best-action from this set: [schedule_check_in_call, send_attendance_reminder, offer_academic_support, send_satisfaction_survey, escalate_to_counsellor, no_action_needed]. Respond as JSON: {"action":"...","confidence":0.0,"explanation":"..."}\n\nProfile: ${JSON.stringify(profileSummary)}`;
    const { text: raw, usedFallback } = await callGemini(prompt, { jsonOutput: true });
    if (usedFallback || !raw) {
      return { output: mockNextBestAction(profileSummary), usedFallback: true };
    }
    try {
      return { output: JSON.parse(raw), usedFallback: false };
    } catch {
      return { output: mockNextBestAction(profileSummary), usedFallback: true };
    }
  });
}

function mockNextBestAction(profileSummary) {
  const risk = profileSummary?.churnRisk ?? 0.3;
  let action = 'no_action_needed';
  if (risk > 0.7) action = 'escalate_to_counsellor';
  else if (risk > 0.5) action = 'schedule_check_in_call';
  else if ((profileSummary?.attendanceRate ?? 1) < 0.85) action = 'send_attendance_reminder';
  else if (risk > 0.3) action = 'send_satisfaction_survey';
  return {
    action,
    confidence: 0.6,
    explanation: `[MOCK] Rule-based recommendation derived from churn risk (${risk}) and attendance rate.`,
  };
}

export async function draftResponse({ context, requestedBy, profile }) {
  return withRunTracking({ capability: 'response_draft', requestedBy, profile }, async () => {
    const prompt = `Draft a warm, professional, channel-appropriate reply from a school service agent to a parent, given this ticket context: ${JSON.stringify(context)}. Keep it under 120 words. Respond as JSON: {"draft":"...","confidence":0.0}`;
    const { text: raw, usedFallback } = await callGemini(prompt, { jsonOutput: true });
    if (usedFallback || !raw) {
      return { output: mockDraft(context), usedFallback: true };
    }
    try {
      return { output: JSON.parse(raw), usedFallback: false };
    } catch {
      return { output: mockDraft(context), usedFallback: true };
    }
  });
}

function mockDraft(context) {
  return {
    draft: `[MOCK DRAFT] Hi, thank you for reaching out about "${context?.subject || 'your query'}". We've reviewed the details and a member of our team will follow up shortly with next steps. In the meantime, please let us know if there's anything urgent we should prioritise.`,
    confidence: 0.55,
  };
}

export async function summarizeConversation({ messages, requestedBy, profile }) {
  return withRunTracking({ capability: 'summarisation', requestedBy, profile }, async () => {
    const prompt = `Summarise this support conversation in 2-3 sentences, noting the core issue and current status. Respond as JSON: {"summary":"...","confidence":0.0}\n\nMessages: ${JSON.stringify(messages)}`;
    const { text: raw, usedFallback } = await callGemini(prompt, { jsonOutput: true });
    if (usedFallback || !raw) {
      return { output: mockSummary(messages), usedFallback: true };
    }
    try {
      return { output: JSON.parse(raw), usedFallback: false };
    } catch {
      return { output: mockSummary(messages), usedFallback: true };
    }
  });
}

function mockSummary(messages) {
  const count = messages?.length || 0;
  return {
    summary: `[MOCK] Conversation contains ${count} message(s). No live Gemini key configured; this is a deterministic placeholder summary describing volume only.`,
    confidence: 0.4,
  };
}
