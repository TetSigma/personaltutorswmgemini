import type { QuizQuestion } from './useQuestionGenerator';
import { GEMINI_QUIZ_PROMPT } from './prompts';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${GEMINI_API_KEY}`;

type GeminiRawQuestion = {
  sentence?: string;
  correct?: string;
  options?: string[];
  description?: string;
};

function isValidGeminiQuestion(q: unknown): q is Required<GeminiRawQuestion> {
  if (!q || typeof q !== 'object') return false;
  const o = q as Record<string, unknown>;
  return (
    typeof o.sentence === 'string' &&
    typeof o.correct === 'string' &&
    typeof o.description === 'string' &&
    Array.isArray(o.options) &&
    o.options.length >= 4 &&
    o.options.includes(o.correct)
  );
}

function buildPrompt(topics: string[], language: string): string {
  return GEMINI_QUIZ_PROMPT
    .replaceAll('{{TARGET_LANGUAGE}}', language)
    .replace('{{TOPICS}}', topics.join(', '));
}

/**
 * Plain async function — no hooks, can be called from anywhere.
 * Calls Gemini REST API to generate quiz questions from topics.
 * Returns questions tagged with source: 'gemini'.
 * Gracefully returns [] if no API key or on failure.
 */
export async function fetchGeminiQuestions(
  topics: string[],
  language: string,
): Promise<QuizQuestion[]> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    console.warn('[Gemini] No API key configured, skipping.');
    return [];
  }

  if (topics.length === 0) return [];

  try {
    const prompt = buildPrompt(topics, language);
    console.log('[Gemini] Requesting questions for topics:', topics.join(', '));

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    console.log('[Gemini] Raw response:', text.slice(0, 500));

    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (!arrMatch) {
      console.warn('[Gemini] No JSON array found in response.');
      return [];
    }

    const parsed: unknown[] = JSON.parse(arrMatch[0]);
    const questions: QuizQuestion[] = [];

    for (const item of parsed) {
      if (isValidGeminiQuestion(item)) {
        questions.push({
          description: item.description,
          sentence: item.sentence,
          correct: item.correct,
          options: item.options.slice(0, 4),
          source: 'gemini',
        });
      }
    }

    console.log(`[Gemini] Parsed ${questions.length} valid questions`);
    return questions;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Gemini request failed';
    console.warn('[Gemini] Error:', msg);
    return [];
  }
}
