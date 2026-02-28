/* @vitest-environment jsdom */

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { convexMutation } from '@/lib/convex'
import { otpAuthStorage } from '@/lib/otpAuth'
import { storage } from '@/lib/storage'
import { usePresenceHeartbeat } from './usePresenceHeartbeat'

vi.mock('@/lib/convex', () => ({
  convexMutation: vi.fn(),
}))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let localStorageState = new Map<string, string>()

function installLocalStorageMock() {
  localStorageState = new Map<string, string>()
  const mockStorage = {
    getItem(key: string) {
      return localStorageState.get(key) ?? null
    },
    setItem(key: string, value: string) {
      localStorageState.set(key, String(value))
    },
    removeItem(key: string) {
      localStorageState.delete(key)
    },
    clear() {
      localStorageState.clear()
    },
  }

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: mockStorage,
  })
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: mockStorage,
  })
}

const STORAGE_KEYS = [
  'man2man_device_id',
  'man2man_username',
  'man2man_user_id',
  'man2man_last_username',
  'eyymi_auth_session_token',
  'eyymi_auth_user_id',
  'eyymi_auth_phone_e164',
  'eyymi_auth_expires_at',
  'eyymi_auth_post_route_intent',
] as const

interface HarnessProps {
  restorePresence: () => Promise<boolean>
}

function HookHarness({ restorePresence }: HarnessProps) {
  usePresenceHeartbeat({ restorePresence })
  return null
}

function mountHarness(restorePresence: () => Promise<boolean>) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  act(() => {
    root.render(<HookHarness restorePresence={restorePresence} />)
  })

  return () => {
    act(() => {
      root.unmount()
    })
    container.remove()
  }
}

async function flushAsync() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

function resetLocalState() {
  for (const key of STORAGE_KEYS) {
    window.localStorage?.removeItem?.(key)
  }
}

describe('usePresenceHeartbeat', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    installLocalStorageMock()
    resetLocalState()
    otpAuthStorage.setSession({
      sessionToken: 'session-token',
      authUserId: 'auth-user-1',
      phoneE164: '+639123456789',
      expiresAt: Date.now() + 60_000,
    })
    storage.setAuthData('device-1', 'melvin', 'user-1')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    resetLocalState()
  })

  it('falls back to presence restore when heartbeat cannot find the user row', async () => {
    const restorePresence = vi.fn().mockResolvedValue(true)
    const convexMutationMock = vi.mocked(convexMutation)
    convexMutationMock.mockResolvedValue(null)

    const cleanup = mountHarness(restorePresence)
    try {
      await act(async () => {
        vi.advanceTimersByTime(30_000)
      })
      await flushAsync()

      expect(convexMutationMock).toHaveBeenCalledWith(
        'users:heartbeat',
        { deviceId: 'device-1' },
        { maxRetries: 1, baseDelay: 250, maxDelay: 1000 },
      )
      expect(restorePresence).toHaveBeenCalledTimes(1)
    } finally {
      cleanup()
    }
  })
})
