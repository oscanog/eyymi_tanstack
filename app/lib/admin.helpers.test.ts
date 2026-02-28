import { describe, expect, it } from "vitest"
import {
  isLocalAppEnv,
  shouldShowDummyUsersModalTrigger,
  toNumberedDummyUsers,
  type DummyUsersStatus,
} from "./admin.helpers"

describe("admin helpers", () => {
  it("checks local app env gate", () => {
    expect(isLocalAppEnv("local")).toBe(true)
    expect(isLocalAppEnv("LOCAL")).toBe(true)
    expect(isLocalAppEnv("production")).toBe(false)
    expect(isLocalAppEnv(undefined)).toBe(false)
  })

  it("shows modal trigger only when deployment is active with exactly 40 users", () => {
    const activeForty: DummyUsersStatus = {
      isActive: true,
      startedAt: 1,
      expiresAt: 2,
      remainingMs: 1000,
      copyVisibilityEnabled: true,
      users: Array.from({ length: 40 }, (_, index) => ({
        slot: index + 1,
        userId: `id-${index + 1}`,
        username: `dummy_user_${String(index + 1).padStart(2, "0")}`,
      })),
    }

    expect(shouldShowDummyUsersModalTrigger(activeForty)).toBe(true)
    expect(shouldShowDummyUsersModalTrigger({ ...activeForty, isActive: false })).toBe(false)
    expect(
      shouldShowDummyUsersModalTrigger({ ...activeForty, users: activeForty.users.slice(0, 39) }),
    ).toBe(false)
  })

  it("formats numbered users by slot order", () => {
    const rows = toNumberedDummyUsers([
      { slot: 2, userId: "id-2", username: "dummy_user_02" },
      { slot: 1, userId: "id-1", username: "dummy_user_01" },
    ])

    expect(rows).toEqual([
      { number: 1, userId: "id-1", username: "dummy_user_01" },
      { number: 2, userId: "id-2", username: "dummy_user_02" },
    ])
  })
})
