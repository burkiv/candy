import type { LeaderboardEntry } from '../types';

const PLAYER_NAME_KEY = 'candy-run-player-name';
const LOCAL_SCORES_KEY = 'candy-run-local-scores';

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ').slice(0, 24);
}

function normalizeDate(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
}

function shouldReplaceEntry(current: LeaderboardEntry, next: LeaderboardEntry) {
  if (next.score !== current.score) {
    return next.score > current.score;
  }

  return Date.parse(next.date) >= Date.parse(current.date);
}

function normalizeEntries(entries: LeaderboardEntry[]) {
  const bestEntriesByName = new Map<string, LeaderboardEntry>();

  entries
    .map((entry) => ({
      name: normalizeName(entry.name),
      score: Math.max(0, Math.floor(entry.score)),
      date: normalizeDate(entry.date || new Date().toISOString()),
    }))
    .filter((entry) => entry.name.length > 0)
    .forEach((entry) => {
      const current = bestEntriesByName.get(entry.name);

      if (!current || shouldReplaceEntry(current, entry)) {
        bestEntriesByName.set(entry.name, entry);
      }
    });

  return [...bestEntriesByName.values()]
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
    date: normalizeDate(entry.date || new Date().toISOString()),
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
