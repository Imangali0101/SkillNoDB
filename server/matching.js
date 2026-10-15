// Score = 0.35*S + 0.25*T + 0.20*R + 0.10*L + 0.10*P, каждый показатель 0..100.
// Кандидат без нужного навыка (отбирается в SQL) или без общего времени — исключается.
export function rank({ candidates, avail, myAvail, myFormat, goalLevel, mutual }) {
  const mine = new Set(myAvail.map((a) => a.day * 24 + a.hour));
  const byUser = {};
  avail.forEach((a) => (byUser[a.user_id] ||= []).push(a.day * 24 + a.hour));

  return candidates
    .map((c) => {
      const shared = (byUser[c.id] || []).filter((k) => mine.has(k)).sort((a, b) => a - b);
      if (!shared.length) return null;

      const S = 100; // преподаватель владеет нужным навыком
      const T = Math.min(100, shared.length * 20); // 5+ общих часов в неделю = 100
      const R = c.rating ? (c.rating / 5) * 100 : 60; // новичкам — нейтральные 60
      const diff = c.level - goalLevel;
      const L = diff >= 1 ? 100 : diff === 0 ? 70 : 30;
      const fmtOk = myFormat === 'any' || c.format === 'any' || myFormat === c.format;
      const isMutual = mutual.has(c.id);
      const P = (fmtOk ? 60 : 0) + (isMutual ? 40 : 0);

      const score = Math.round((0.35 * S + 0.25 * T + 0.2 * R + 0.1 * L + 0.1 * P) * 10) / 10;
      return {
        ...c,
        score,
        mutual: isMutual,
        breakdown: { S, T, R: Math.round(R), L, P },
        shared: shared.map((k) => ({ day: Math.floor(k / 24), hour: k % 24 })),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}
