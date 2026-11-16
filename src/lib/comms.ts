/** Parse an environment comms string like "14m 20s" or "1.3s" into seconds. */
export function commsSeconds(s: string): number {
  const m = /(\d+)m/.exec(s)?.[1];
  const sec = /([\d.]+)s/.exec(s)?.[1];
  return (m ? Number(m) * 60 : 0) + (sec ? Number(sec) : 0);
}
export const fmtDelay = (sec: number) => {
  const t = Math.max(0, Math.ceil(sec));
  return t >= 60 ? `${Math.floor(t / 60)}m ${String(t % 60).padStart(2, "0")}s` : `${t}s`;
};
