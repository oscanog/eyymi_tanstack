export interface DummyStatusUser {
  slot: number
  userId: string
  username: string
}

export interface DummyUsersStatus {
  isActive: boolean
  startedAt: number | null
  expiresAt: number | null
  remainingMs: number
  users: DummyStatusUser[]
}

export interface NumberedDummyUser {
  number: number
  userId: string
  username: string
}

export function isLocalAppEnv(appEnv: string | undefined): boolean {
  return (appEnv ?? "").trim().toLowerCase() === "local"
}

export function shouldShowDummyUsersModalTrigger(status: DummyUsersStatus | null | undefined): boolean {
  return Boolean(status?.isActive && status.users.length === 40)
}

export function toNumberedDummyUsers(users: DummyStatusUser[]): NumberedDummyUser[] {
  return [...users]
    .sort((a, b) => a.slot - b.slot)
    .map((user) => ({
      number: user.slot,
      userId: user.userId,
      username: user.username,
    }))
}

export function formatDurationMs(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}
