import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** AsyncStorage-backed JSON storage for `persist` (React Native). */
export const zustandStorage = createJSONStorage(() => AsyncStorage);
