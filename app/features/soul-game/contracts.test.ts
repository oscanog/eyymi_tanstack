import { describe, expect, it } from "vitest";
import { soulGameTimingConfig } from "../../../data";
import { getSoulGameInlineMessageForState } from "./contracts";

describe("soul game demo contracts", () => {
  it("uses the 1.5 second hold and 3 second center window timing", () => {
    expect(soulGameTimingConfig.minHoldMs).toBe(1500);
    expect(soulGameTimingConfig.candidateRotateMs).toBe(3000);
    expect(soulGameTimingConfig.successIntroMs).toBe(0);
  });

  it("exposes the new reciprocal ring copy", () => {
    expect(getSoulGameInlineMessageForState("idle").description).toContain("1.5s");
    expect(getSoulGameInlineMessageForState("pressing").description).toContain("counter-clockwise");
    expect(getSoulGameInlineMessageForState("matched").description).toBe("eyymi match happened.");
  });
});
