import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GoogleSignin,
  isErrorWithCode,
  isNoSavedCredentialFoundResponse,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAuthStore, type AuthUser } from '../stores/authStore';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID!;

export function useGoogleAuth() {
  const configured = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storeSignIn = useAuthStore((s) => s.signIn);
  const storeSignOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (configured.current) return;
    configured.current = true;
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      iosClientId: IOS_CLIENT_ID,
      offlineAccess: false,
      scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    });
  }, []);

  const signIn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const { user: gUser, idToken } = response.data;
        const authUser: AuthUser = {
          id: gUser.id,
          email: gUser.email,
          displayName: gUser.name ?? null,
          photoUrl: gUser.photo ?? null,
        };
        storeSignIn(authUser, idToken ?? null);
      }
    } catch (err: unknown) {
      if (isErrorWithCode(err)) {
        switch (err.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            break;
          case statusCodes.IN_PROGRESS:
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            setError('Google Play Services not available.');
            break;
          default:
            setError(err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [storeSignIn]);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await GoogleSignin.signOut();
      storeSignOut();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [storeSignOut]);

  const trySilentSignIn = useCallback(async () => {
    try {
      const response = await GoogleSignin.signInSilently();
      if (isNoSavedCredentialFoundResponse(response)) return;
      if (isSuccessResponse(response)) {
        const { user: gUser, idToken } = response.data;
        const authUser: AuthUser = {
          id: gUser.id,
          email: gUser.email,
          displayName: gUser.name ?? null,
          photoUrl: gUser.photo ?? null,
        };
        storeSignIn(authUser, idToken ?? null);
      }
    } catch {
      // silent sign-in failed — that's fine
    }
  }, [storeSignIn]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const tokens = await GoogleSignin.getTokens();
      return tokens.accessToken;
    } catch {
      return null;
    }
  }, []);

  return { user, loading, error, signIn, signOut, trySilentSignIn, getAccessToken } as const;
}
