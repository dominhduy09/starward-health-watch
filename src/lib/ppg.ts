/** Camera fingertip pulse estimate (photoplethysmography). Rough estimate, not medical. */
export function estimateBpm(samples: number[], fps: number): { bpm: number; quality: number } | null {
  if (samples.length < fps * 8) return null;
  // Remove slow drift with a ~1 s moving average, then smooth with ~0.15 s window (≈0.7–3.5 Hz band).
  const ma = (a: number[], w: number) => a.map((_, i) => {
    const s = Math.max(0, i - w), e = Math.min(a.length, i + w + 1);
    let t = 0; for (let j = s; j < e; j++) t += a[j]!; return t / (e - s);
  });
  const trend = ma(samples, Math.round(fps / 2));
  const sig = ma(samples.map((v, i) => v - trend[i]!), Math.max(1, Math.round(fps * 0.07)));
  const minGap = Math.round(fps / 3.5);
  const peaks: number[] = [];
  for (let i = 1; i < sig.length - 1; i++) {
    if (sig[i]! > 0 && sig[i]! >= sig[i - 1]! && sig[i]! > sig[i + 1]!) {
      const last = peaks[peaks.length - 1];
      if (last === undefined || i - last >= minGap) peaks.push(i);
      else if (sig[i]! > sig[last]!) peaks[peaks.length - 1] = i;
    }
  }
  if (peaks.length < 5) return null;
  const iv = peaks.slice(1).map((p, i) => p - peaks[i]!).sort((a, b) => a - b);
  const med = iv[Math.floor(iv.length / 2)]!;
  const mean = iv.reduce((a, b) => a + b, 0) / iv.length;
  const cv = Math.sqrt(iv.reduce((a, b) => a + (b - mean) ** 2, 0) / iv.length) / mean;
  const bpm = Math.round((60 * fps) / med);
  if (bpm < 40 || bpm > 200) return null;
  return { bpm, quality: Math.max(0, Math.min(1, 1 - cv * 2.5)) };
}
