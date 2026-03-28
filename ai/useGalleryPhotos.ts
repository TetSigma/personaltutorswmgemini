import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export type GalleryPhoto = {
  id: string;
  uri: string;
  filename: string;
};

/**
 * Opens the native multi-select photo picker, converts selected images
 * to JPEG (VLMs can't read HEIC), and returns them.
 */
export function useGalleryPhotos() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.8,
      });

      if (result.canceled || result.assets.length === 0) {
        setLoading(false);
        return [];
      }

      const items: GalleryPhoto[] = [];
      for (let i = 0; i < result.assets.length; i++) {
        const asset = result.assets[i];
        const converted = await manipulateAsync(
          asset.uri,
          [{ resize: { width: 512 } }],
          { compress: 0.8, format: SaveFormat.JPEG },
        );
        items.push({
          id: asset.assetId ?? `pick-${i}`,
          uri: converted.uri,
          filename: (asset.fileName ?? `photo-${i}`).replace(/\.heic$/i, '.jpg'),
        });
      }

      setPhotos(items);
      setLoading(false);
      return items;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to pick photos';
      setError(msg);
      setLoading(false);
      return [];
    }
  }, []);

  return { photos, loading, error, pickPhotos } as const;
}
