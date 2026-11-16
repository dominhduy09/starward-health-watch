import { describe, it, expect } from "vitest";
import { commsSeconds, fmtDelay } from "./comms";
describe("comms delay", () => {
  it("Mars/transit latency is 14m 20s = 860s", () => expect(commsSeconds("14m 20s")).toBe(860));
  it("ISS latency is sub-second", () => expect(commsSeconds("0.5s")).toBe(0.5));
  it("formats countdown", () => expect(fmtDelay(860)).toBe("14m 20s"));
});
