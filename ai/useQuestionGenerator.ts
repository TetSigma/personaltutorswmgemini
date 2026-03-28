import { useCallback, useState } from 'react';
import {
  LLAMA3_2_1B,
  useLLM,
} from 'react-native-executorch';
import type { ImageDescription } from './useImageDescriber';
import type { EmailSnippet } from './useGmailEmails';
import {
  DEFAULT_TARGET_LANGUAGE,
  EMAIL_QUESTION_GENERATOR_USER,
  QUESTION_GENERATOR_SYSTEM,
  QUESTION_GENERATOR_USER,
  TOPIC_EXTRACTION_USER,
} from './prompts';

const LANG_NAMES: Record<string, string> = {
  es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
  ar: 'Arabic', hi: 'Hindi', tr: 'Turkish', nl: 'Dutch',
  pl: 'Polish', uk: 'Ukrainian',
};

/** Resolve a BCP-47 code like "fr" → "French", or pass through if already a name. */
export function resolveLang(input: string): string {
  return LANG_NAMES[input] ?? input;
}

export type QuizQuestion = {
  description: string;
  sentence: string;
  correct: string;
  options: string[];
  source?: 'local' | 'gemini';
};

type RawPair = { sentence: string; correct: string };

function buildUserPrompt(description: string, lang: string): string {
  return QUESTION_GENERATOR_USER
    .replaceAll('{{TARGET_LANGUAGE}}', lang)
    .replace('{{DESCRIPTION}}', description);
}

function buildEmailPrompt(subject: string, snippet: string, lang: string): string {
  return EMAIL_QUESTION_GENERATOR_USER
    .replaceAll('{{TARGET_LANGUAGE}}', lang)
    .replace('{{SUBJECT}}', subject)
    .replace('{{SNIPPET}}', snippet);
}

/**
 * Extract an array of objects from the LLM reply.
 * Handles: proper JSON array, object wrapping an array,
 * comma-separated objects without brackets, and loose
 * objects separated by whitespace / extra braces.
 */
function extractArray(reply: string): unknown[] {
  // 1. Try a proper JSON array
  const arrMatch = reply.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]); } catch { /* fall through */ }
  }

  // 2. Try parsing the whole reply as a single object that wraps an array
  try {
    const obj = JSON.parse(reply);
    if (Array.isArray(obj)) return obj;
    const firstArr = Object.values(obj).find(Array.isArray);
    if (firstArr) return firstArr as unknown[];
  } catch { /* ignore */ }

  // 3. Try wrapping the reply in brackets (handles comma-separated objects)
  try { return JSON.parse(`[${reply}]`); } catch { /* ignore */ }

  // 4. Extract individual {...} objects via regex (handles space/newline separated)
  const objs: unknown[] = [];
  const objRegex = /\{[^{}]*\}/g;
  let m: RegExpExecArray | null;
  while ((m = objRegex.exec(reply)) !== null) {
    try { objs.push(JSON.parse(m[0])); } catch { /* skip malformed */ }
  }
  return objs;
}

function isValidPair(q: unknown): q is RawPair {
  if (!q || typeof q !== 'object') return false;
  const o = q as Record<string, unknown>;
  return typeof o.sentence === 'string' && o.sentence.length > 0
    && typeof o.correct === 'string' && o.correct.length > 0;
}

/** Shuffle array in place (Fisher-Yates). */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build 4 options for each question using correct answers from OTHER
 * questions as distractors. Falls back to light string mutations if
 * there aren't enough unique sibling answers.
 */
function attachOptions(pairs: { description: string; sentence: string; correct: string }[]): QuizQuestion[] {
  const allCorrect = [...new Set(pairs.map((p) => p.correct))];

  return pairs.map((p) => {
    const distractorPool = shuffle(allCorrect.filter((c) => c !== p.correct));
    const distractors = distractorPool.slice(0, 3);

    while (distractors.length < 3) {
      distractors.push(p.correct + ['a', 'o', 'es', 'os'][distractors.length] ?? p.correct + 's');
    }

    const options = shuffle([p.correct, ...distractors]);
    return { ...p, options, source: 'local' as const };
  });
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Processes image descriptions ONE AT A TIME through the text LLM.
 * Only asks for sentence + correct; options are built in code afterwards.
 */
export function useQuestionGenerator() {
  const llm = useLLM({ model: LLAMA3_2_1B });
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (
      imageDescriptions: ImageDescription[],
      targetLanguage = DEFAULT_TARGET_LANGUAGE
    ): Promise<QuizQuestion[]> => {
      if (!llm.isReady || imageDescriptions.length === 0) return [];

      setGenerating(true);
      setError(null);
      setQuestions([]);

      const lang = resolveLang(targetLanguage);
      console.log(`[QuizGen] Target language: ${lang} (raw: ${targetLanguage})`);

      const systemPrompt = QUESTION_GENERATOR_SYSTEM;
      const rawPairs: { description: string; sentence: string; correct: string }[] = [];

      for (let i = 0; i < imageDescriptions.length; i++) {
        const desc = imageDescriptions[i].description;
        const userPrompt = buildUserPrompt(desc, lang);

        try {
          console.log(`[QuizGen] Generating for image ${i + 1}/${imageDescriptions.length}`);

          const reply = await llm.generate([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ]);

          console.log(`[QuizGen] Raw reply ${i + 1}:`, reply);

          const items = extractArray(reply);
          for (const item of items) {
            if (isValidPair(item)) {
              rawPairs.push({ description: desc, sentence: item.sentence, correct: item.correct });
            }
          }
        } catch (e) {
          console.warn(`[QuizGen] Failed on image ${i + 1}:`, e);
        }

        if (i < imageDescriptions.length - 1) await delay(300);
      }

      const allQuestions = attachOptions(rawPairs);

      console.log('[QuizGen] Final questions:', JSON.stringify(allQuestions, null, 2));
      setQuestions(allQuestions);
      setGenerating(false);
      if (allQuestions.length === 0) {
        setError('Could not generate any valid questions.');
      }
      return allQuestions;
    },
    [llm]
  );

  const generateFromEmails = useCallback(
    async (
      emails: EmailSnippet[],
      targetLanguage = DEFAULT_TARGET_LANGUAGE
    ): Promise<QuizQuestion[]> => {
      if (!llm.isReady || emails.length === 0) return [];

      setGenerating(true);
      setError(null);
      setQuestions([]);

      const lang = resolveLang(targetLanguage);
      console.log(`[QuizGen:Email] Target language: ${lang} (raw: ${targetLanguage})`);

      const systemPrompt = QUESTION_GENERATOR_SYSTEM;
      const rawPairs: { description: string; sentence: string; correct: string }[] = [];

      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        const userPrompt = buildEmailPrompt(email.subject, email.snippet, lang);
        const context = `${email.subject}: ${email.snippet}`;

        try {
          console.log(`[QuizGen:Email] Generating for email ${i + 1}/${emails.length}: "${email.subject}"`);

          const reply = await llm.generate([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ]);

          console.log(`[QuizGen:Email] Raw reply ${i + 1}:`, reply);

          const items = extractArray(reply);
          for (const item of items) {
            if (isValidPair(item)) {
              rawPairs.push({ description: context, sentence: item.sentence, correct: item.correct });
            }
          }
        } catch (e) {
          console.warn(`[QuizGen:Email] Failed on email ${i + 1}:`, e);
        }

        if (i < emails.length - 1) await delay(300);
      }

      const allQuestions = attachOptions(rawPairs);

      console.log('[QuizGen:Email] Final questions:', JSON.stringify(allQuestions, null, 2));
      setQuestions(allQuestions);
      setGenerating(false);
      if (allQuestions.length === 0) {
        setError('Could not generate any valid questions.');
      }
      return allQuestions;
    },
    [llm]
  );

  const extractTopics = useCallback(
    async (descriptions: string[]): Promise<string[]> => {
      if (!llm.isReady || descriptions.length === 0) return [];

      try {
        const descList = descriptions
          .map((d) => `"${d.slice(0, 100)}"`)
          .join(', ');
        const prompt = TOPIC_EXTRACTION_USER.replace('{{DESCRIPTIONS}}', descList);

        console.log('[TopicExtract] Extracting topics…');
        const reply = await llm.generate([
          { role: 'system', content: QUESTION_GENERATOR_SYSTEM },
          { role: 'user', content: prompt },
        ]);

        console.log('[TopicExtract] Raw reply:', reply);

        // Strip markdown code fences if present
        const cleaned = reply.replace(/```[\s\S]*?```/g, (m) =>
          m.replace(/^```\w*\n?/, '').replace(/\n?```$/, ''),
        );

        let topics: string[] = [];

        // Try parsing as JSON first (model sometimes returns {"topics": [...]})
        try {
          const parsed = JSON.parse(cleaned.match(/\{[\s\S]*\}/)?.[0] ?? cleaned);
          const arr = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed?.topics)
              ? parsed.topics
              : Object.values(parsed).find(Array.isArray) ?? [];
          topics = (arr as string[])
            .map((t: string) => String(t).trim().toLowerCase())
            .filter((t) => t.length >= 2 && t.length <= 30);
        } catch {
          // Fall back to plain text parsing
          topics = cleaned
            .replace(/^topics:\s*/i, '')
            .split(/[,\n]+/)
            .map((t) => t.trim().toLowerCase().replace(/[^a-z\s]/g, ''))
            .filter((t) => t.length >= 2 && t.length <= 30);
        }

        const unique = [...new Set(topics)].slice(0, 3);
        console.log('[TopicExtract] Extracted:', unique);
        return unique;
      } catch (e) {
        console.warn('[TopicExtract] Failed:', e);
        return [];
      }
    },
    [llm],
  );

  return { llm, questions, generating, error, generate, generateFromEmails, extractTopics } as const;
}
