import type { LeaderboardEntry } from '../types';

const PLAYER_NAME_KEY = 'candy-run-player-name';
const LOCAL_SCORES_KEY = 'candy-run-local-scores';

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ').slice(0, 24);
}

function normalizeEntries(entries: LeaderboardEntry[]) {
  return entries
    .map((entry) => ({
      name: normalizeName(entry.name),
      score: Math.max(0, Math.floor(entry.score)),
      date: entry.date || new Date().toISOString(),
    }))
    .filter((entry) => entry.name.length > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return Date.parse(right.date) - Date.parse(left.date);
    })
    .slice(0, 20);
}

function readLocalScores() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_SCORES_KEY);
    if (!raw) {
      return [];
    }

    return normalizeEntries(JSON.parse(raw) as LeaderboardEntry[]);
  } catch {
    return [];
  }
}

function writeLocalScores(entries: LeaderboardEntry[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(entries));
}

export function readStoredPlayerName() {
  if (typeof window === 'undefined') {
    return '';
  }

  return normalizeName(window.localStorage.getItem(PLAYER_NAME_KEY) ?? '');
}

export function writeStoredPlayerName(name: string) {
  const normalized = normalizeName(name);

  if (typeof window !== 'undefined') {
    if (normalized) {
      window.localStorage.setItem(PLAYER_NAME_KEY, normalized);
    } else {
      window.localStorage.removeItem(PLAYER_NAME_KEY);
    }
  }

  return normalized;
}

export async function fetchLeaderboardEntries() {
  try {
    const response = await fetch('/api/scores');
    if (!response.ok) {
      throw new Error(`scores:${response.status}`);
    }

    const payload = (await response.json()) as { scores?: LeaderboardEntry[] };
    return normalizeEntries(payload.scores ?? []);
  } catch {
    return readLocalScores();
  }
}

export async function submitLeaderboardEntry(entry: LeaderboardEntry) {
  const normalizedEntry = {
    name: normalizeName(entry.name),
    score: Math.max(0, Math.floor(entry.score)),
    date: entry.date || new Date().toISOString(),
  };

  if (!normalizedEntry.name) {
    return fetchLeaderboardEntries();
  }

  try {
    const response = await fetch('/api/scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(normalizedEntry),
    });

    if (!response.ok) {
      throw new Error(`scores:${response.status}`);
    }

    const payload = (await response.json()) as { scores?: LeaderboardEntry[] };
    return normalizeEntries(payload.scores ?? []);
  } catch {
    const localEntries = normalizeEntries([
      normalizedEntry,
      ...readLocalScores(),
    ]);
    writeLocalScores(localEntries);
    return localEntries;
  }
}
