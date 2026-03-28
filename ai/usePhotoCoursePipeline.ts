import { useCallback, useState } from 'react';
import type { GalleryPhoto } from './useGalleryPhotos';
import { useImageDescriber, type ImageDescription } from './useImageDescriber';
import { useQuestionGenerator, type QuizQuestion } from './useQuestionGenerator';
import { DEFAULT_TARGET_LANGUAGE } from './prompts';

export type PipelineStage =
  | 'idle'
  | 'describing_images'
  | 'generating_questions'
  | 'done'
  | 'error';

/**
 * Orchestrates: user-picked photos → descriptions → quiz questions.
 * Photos are selected externally and passed into `run()`.
 */
export function usePhotoCoursePipeline() {
  const describer = useImageDescriber();
  const questionGen = useQuestionGenerator();

  const [stage, setStage] = useState<PipelineStage>('idle');
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (
      selectedPhotos: GalleryPhoto[],
      targetLanguage = DEFAULT_TARGET_LANGUAGE,
    ) => {
      setError(null);
      setPhotos(selectedPhotos);

      if (selectedPhotos.length === 0) {
        setError('No photos selected.');
        setStage('error');
        return;
      }

      setStage('describing_images');
      const descriptions: ImageDescription[] =
        await describer.describeAll(selectedPhotos);
      if (descriptions.length === 0) {
        setError('Could not describe any images.');
        setStage('error');
        return;
      }

      setStage('generating_questions');
      const questions: QuizQuestion[] = await questionGen.generate(
        descriptions,
        targetLanguage,
      );
      if (questions.length === 0) {
        setError(questionGen.error ?? 'No questions generated.');
        setStage('error');
        return;
      }

      setStage('done');
    },
    [describer, questionGen],
  );

  const reset = useCallback(() => {
    setStage('idle');
    setError(null);
    setPhotos([]);
  }, []);

  return {
    stage,
    error,
    run,
    reset,

    photos,

    descriptions: describer.descriptions,
    describingProgress: describer.progress,
    vlmReady: describer.vlm.isReady,
    vlmDownloadProgress: describer.vlm.downloadProgress,

    questions: questionGen.questions,
    questionsGenerating: questionGen.generating,
    llmReady: questionGen.llm.isReady,
    llmDownloadProgress: questionGen.llm.downloadProgress,
  } as const;
}
