import { useCallback, useState } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export type EmailSnippet = {
  id: string;
  subject: string;
  snippet: string;
};

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

async function getAccessToken(): Promise<string> {
  const { accessToken } = await GoogleSignin.getTokens();
  return accessToken;
}

async function fetchMessageIds(token: string, count: number): Promise<string[]> {
  const res = await fetch(`${GMAIL_BASE}/messages?maxResults=${count}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Gmail list failed: ${res.status}`);
  const data = await res.json();
  return (data.messages ?? []).map((m: { id: string }) => m.id);
}

async function fetchMessage(token: string, id: string): Promise<EmailSnippet> {
  const res = await fetch(
    `${GMAIL_BASE}/messages/${id}?format=metadata&metadataHeaders=Subject`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Gmail get failed: ${res.status}`);
  const msg = await res.json();

  const subjectHeader = (msg.payload?.headers ?? []).find(
    (h: { name: string }) => h.name === 'Subject',
  );

  return {
    id: msg.id,
    subject: subjectHeader?.value ?? '(no subject)',
    snippet: msg.snippet ?? '',
  };
}

/**
 * Fetches the most recent emails from the signed-in user's Gmail.
 * Uses the metadata+snippet format to keep payloads small.
 */
export function useGmailEmails() {
  const [emails, setEmails] = useState<EmailSnippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = useCallback(async (count = 15): Promise<EmailSnippet[]> => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      const ids = await fetchMessageIds(token, count);

      const results: EmailSnippet[] = [];
      for (const id of ids) {
        try {
          const email = await fetchMessage(token, id);
          if (email.snippet.length > 0) results.push(email);
        } catch (e) {
          console.warn(`[Gmail] Failed to fetch message ${id}:`, e);
        }
      }

      console.log(`[Gmail] Fetched ${results.length} emails`);
      setEmails(results);
      setLoading(false);
      return results;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch emails';
      console.warn('[Gmail] Error:', msg);
      setError(msg);
      setLoading(false);
      return [];
    }
  }, []);

  return { emails, loading, error, fetchEmails } as const;
}
