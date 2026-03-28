/**
 * All AI prompt constants used in the app.
 * Keep every prompt here so they're easy to tweak in one place.
 */

/** System prompt for the VLM that describes photos. */
export const IMAGE_DESCRIPTION_SYSTEM =
  'You are an image analyst. Describe the photo in one concise English sentence. ' +
  'Focus on: people, actions, objects, and setting. Do not speculate beyond what is visible.';

/** User prompt sent alongside each photo to the VLM. */
export const IMAGE_DESCRIPTION_USER =
  'Describe this photo in one sentence.';

/**
 * System prompt – kept to one line so the 1B model doesn't get confused.
 */
export const QUESTION_GENERATOR_SYSTEM =
  'You output JSON only. No extra text.';

/**
 * User prompt processed ONE description at a time.
 * Only asks for sentence + correct (no options – those are built in code).
 * One-shot example keeps the model on track.
 */
export const QUESTION_GENERATOR_USER =
  'Example:\n' +
  'Description: "A woman drinking coffee at a table with friends."\n' +
  'Language: German\n' +
  '[{"sentence":"How do you say \'coffee\' in German?","correct":"Kaffee"},{"sentence":"How do you say \'friends\' in German?","correct":"Freunde"},{"sentence":"How do you say \'table\' in German?","correct":"Tisch"}]\n\n' +
  'Now your turn. Use {{TARGET_LANGUAGE}} (not German).\n' +
  'Description: "{{DESCRIPTION}}"\n' +
  'Language: {{TARGET_LANGUAGE}}\n' +
  'Pick 3 different words from the description. For each word write "How do you say \'[word]\' in {{TARGET_LANGUAGE}}?" and the correct {{TARGET_LANGUAGE}} translation. Output exactly 3 items.\n' +
  'JSON array:';

/**
 * User prompt for email-based question generation.
 * Same structure as QUESTION_GENERATOR_USER but with email context.
 */
export const EMAIL_QUESTION_GENERATOR_USER =
  'Example:\n' +
  'Email subject: "Team lunch tomorrow"\n' +
  'Email text: "Hi everyone, lunch at the Italian restaurant at noon. Please confirm."\n' +
  'Language: German\n' +
  '[{"sentence":"How do you say \'lunch\' in German?","correct":"Mittagessen"},{"sentence":"How do you say \'restaurant\' in German?","correct":"Restaurant"},{"sentence":"How do you say \'confirm\' in German?","correct":"bestätigen"}]\n\n' +
  'Now your turn. Use {{TARGET_LANGUAGE}} (not German).\n' +
  'Email subject: "{{SUBJECT}}"\n' +
  'Email text: "{{SNIPPET}}"\n' +
  'Language: {{TARGET_LANGUAGE}}\n' +
  'Pick 3 different words from the email. For each word write "How do you say \'[word]\' in {{TARGET_LANGUAGE}}?" and the correct {{TARGET_LANGUAGE}} translation. Output exactly 3 items.\n' +
  'JSON array:';

/**
 * Topic extraction prompt for the local LLM.
 * Given quiz question descriptions, extract 2-3 generic topics.
 * Must NOT reveal personal info — only broad categories.
 */
export const TOPIC_EXTRACTION_USER =
  'Example:\n' +
  'Questions about: "coffee at a table with friends", "office meeting with laptops", "team presentation"\n' +
  'Topics: work, food, socializing\n\n' +
  'Questions about: {{DESCRIPTIONS}}\n' +
  'List 2-3 generic topic words (like: work, travel, food, technology, sports, nature, music). ' +
  'Do NOT include names, places, or personal details. Just broad categories.\n' +
  'Topics:';

/**
 * Gemini prompt for generating 10 quiz questions given topics and a target language.
 * Gemini is smart enough to handle a detailed prompt with proper JSON output.
 */
export const GEMINI_QUIZ_PROMPT =
  'You are a language tutor. The student is learning {{TARGET_LANGUAGE}}.\n\n' +
  'Topics of interest: {{TOPICS}}\n\n' +
  'Generate exactly 10 vocabulary quiz questions related to these topics.\n' +
  'Each question asks the student to translate a short English word or phrase into {{TARGET_LANGUAGE}}.\n\n' +
  'Return a JSON array. Each item has:\n' +
  '- "sentence": the question, e.g. "How do you say \'meeting\' in {{TARGET_LANGUAGE}}?"\n' +
  '- "correct": the correct translation in {{TARGET_LANGUAGE}}\n' +
  '- "options": exactly 4 strings in {{TARGET_LANGUAGE}} (including the correct one, shuffled)\n' +
  '- "description": a short context hint in English (5-10 words)\n\n' +
  'Rules:\n' +
  '- All options must be in {{TARGET_LANGUAGE}}\n' +
  '- Options should be plausible but only one correct\n' +
  '- Vary difficulty: mix simple and intermediate words\n' +
  '- Cover different aspects of the given topics\n\n' +
  'Output ONLY the JSON array, no other text.';

/** Default target language when the user hasn't picked one yet. */
export const DEFAULT_TARGET_LANGUAGE = 'Spanish';
