import { useCallback, useRef, useState } from 'react';
import {
  LFM2_VL_1_6B_QUANTIZED,
  useLLM,
} from 'react-native-executorch';
import type { GalleryPhoto } from './useGalleryPhotos';
import { IMAGE_DESCRIPTION_SYSTEM, IMAGE_DESCRIPTION_USER } from './prompts';

export type ImageDescription = {
  photo: GalleryPhoto;
  description: string;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Uses the LFM2 VL (vision-language) model running on-device to describe images.
 *
 * Uses `generate()` instead of `sendMessage()` so each image gets a fresh
 * context -- no conversation history accumulates, keeping memory stable.
 */
export function useImageDescriber() {
  const vlm = useLLM({ model: LFM2_VL_1_6B_QUANTIZED });
  const [descriptions, setDescriptions] = useState<ImageDescription[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const abortRef = useRef(false);

  const describeAll = useCallback(
    async (photos: GalleryPhoto[]): Promise<ImageDescription[]> => {
      if (!vlm.isReady || photos.length === 0) return [];

      abortRef.current = false;
      setProcessing(true);
      setProgress({ current: 0, total: photos.length });
      setDescriptions([]);

      const results: ImageDescription[] = [];

      for (let i = 0; i < photos.length; i++) {
        if (abortRef.current) break;

        setProgress({ current: i + 1, total: photos.length });

        try {
          const reply = await vlm.generate([
            { role: 'system', content: IMAGE_DESCRIPTION_SYSTEM },
            {
              role: 'user',
              content: `<image>\n${IMAGE_DESCRIPTION_USER}`,
              mediaPath: photos[i].uri,
            },
          ]);

          const desc: ImageDescription = {
            photo: photos[i],
            description: reply.trim(),
          };
          console.log(`[ImageDescriber] ${i + 1}/${photos.length} "${photos[i].filename}": ${desc.description}`);
          results.push(desc);
          setDescriptions((prev) => [...prev, desc]);
        } catch (e) {
          console.warn(`[ImageDescriber] Failed on "${photos[i].filename}":`, e);
          results.push({
            photo: photos[i],
            description: '(could not describe image)',
          });
        }

        // Brief pause between images to let the system reclaim memory
        if (i < photos.length - 1) {
          await delay(500);
        }
      }

      setProcessing(false);
      return results;
    },
    [vlm],
  );

  const abort = useCallback(() => {
    abortRef.current = true;
    vlm.interrupt();
  }, [vlm]);

  return {
    vlm,
    descriptions,
    processing,
    progress,
    describeAll,
    abort,
  } as const;
}
