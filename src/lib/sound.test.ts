import { describe, it, expect } from "vitest";
import { readSoundPref, writeSoundPref } from "./sound";
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };
describe("sound preference", () => {
  it("is on by default", () => expect(readSoundPref(mem())).toBe(true));
  it("remembers turning sound off", () => { const s = mem(); writeSoundPref(s, false); expect(readSoundPref(s)).toBe(false); });
});
