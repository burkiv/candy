import { kv } from '@vercel/kv';

const SCORE_KEY = 'candy-run:scores';

function normalizeName(name) {
  return String(name ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 24);
}

function normalizeEntry(entry) {
  return {
    name: normalizeName(entry?.name),
    score: Math.max(0, Math.floor(Number(entry?.score ?? 0))),
    date: normalizeDate(entry?.date),
  };
}

function normalizeDate(value) {
  const parsed = Date.parse(typeof value === 'string' ? value : '');
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
}

function shouldReplaceEntry(current, next) {
  if (next.score !== current.score) {
    return next.score > current.score;
  }

  return Date.parse(next.date) >= Date.parse(current.date);
}

function normalizeEntries(entries) {
  const bestEntriesByName = new Map();

  (Array.isArray(entries) ? entries : [])
    .map((entry) => normalizeEntry(entry))
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

async function readScores() {
  const scores = await kv.get(SCORE_KEY);
  return normalizeEntries(scores);
}

export default async function handler(req, res) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(503).json({
      error: 'KV is not configured.',
      scores: [],
    });
  }

  try {
    if (req.method === 'GET') {
      const scores = await readScores();
      return res.status(200).json({ scores });
    }

    if (req.method === 'POST') {
      const body =
        typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {};
      const nextEntry = normalizeEntry(body);

      if (!nextEntry.name) {
        return res.status(400).json({ error: 'Name is required.' });
      }

      const scores = normalizeEntries([nextEntry, ...(await readScores())]);
      await kv.set(SCORE_KEY, scores);
      return res.status(200).json({ scores });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown server error.',
    });
  }
}
