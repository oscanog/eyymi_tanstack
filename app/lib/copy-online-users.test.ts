import { describe, expect, it } from "vitest";
import {
  buildCopyCarouselUsers,
  isCopyCarouselSelfUser,
  resolveCopyCarouselAvatar,
} from "./copy-online-users";
import type { OnlineUser } from "@/hooks/useOnlineUsers";

const baseUsers: OnlineUser[] = [
  {
    _id: "users:self",
    username: "Melvin",
    isOnline: true,
    lastSeen: 1000,
    avatarId: "copy-ava-01",
  },
  {
    _id: "users:other-1",
    username: "Ari",
    isOnline: true,
    lastSeen: 900,
    avatarId: "copy-ava-03",
  },
];

describe("copy online users helpers", () => {
  it("excludes self by user id when available", () => {
    const users = buildCopyCarouselUsers(baseUsers, "users:self", "Melvin");
    expect(users).toHaveLength(1);
    expect(users[0]?._id).toBe("users:other-1");
  });

  it("falls back to username self-check when user id is missing", () => {
    expect(isCopyCarouselSelfUser(baseUsers[0], null, " melvin ")).toBe(true);
    expect(isCopyCarouselSelfUser(baseUsers[1], null, "melvin")).toBe(false);
  });

  it("still excludes self by username when self id does not match", () => {
    expect(isCopyCarouselSelfUser(baseUsers[0], "users:some-other-id", "melvin")).toBe(true);
  });

  it("returns empty list when only self is online", () => {
    const users = buildCopyCarouselUsers([baseUsers[0]], "users:self", "Melvin");
    expect(users).toEqual([]);
  });

  it("uses explicit avatar id when valid", () => {
    const users = buildCopyCarouselUsers(baseUsers, "users:self", "Melvin");
    expect(users[0]?.avatar.id).toBe("copy-ava-03");
  });

  it("uses deterministic fallback avatar for unknown avatar ids", () => {
    const fallbackA = resolveCopyCarouselAvatar("unknown-id", "users:other-2:Alex");
    const fallbackB = resolveCopyCarouselAvatar("unknown-id", "users:other-2:Alex");
    expect(fallbackA.id).toBe(fallbackB.id);
    expect(fallbackA.id.startsWith("copy-ava-")).toBe(true);
  });
});
