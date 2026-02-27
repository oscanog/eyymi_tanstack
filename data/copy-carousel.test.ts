import { describe, expect, it } from "vitest";
import { copyCarouselAvatars } from "./copy-carousel";

describe("copy carousel dummy data", () => {
  it("contains exactly 10 avatars", () => {
    expect(copyCarouselAvatars).toHaveLength(10);
  });

  it("uses unique ids", () => {
    const ids = copyCarouselAvatars.map((avatar) => avatar.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
