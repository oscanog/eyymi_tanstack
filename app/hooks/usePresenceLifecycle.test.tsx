/* @vitest-environment jsdom */

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { otpAuthStorage } from '@/lib/otpAuth'
import { storage } from '@/lib/storage'
import { convexMutation } from '@/lib/convex'
import { usePresenceLifecycle } from './usePresenceLifecycle'

const mockNavigate = vi.fn()

vi.mock('@/lib/convex', () => ({
  convexMutation: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type PresenceLifecycleResult = ReturnType<typeof usePresenceLifecycle>

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

let latestHookState: PresenceLifecycleResult | null = null
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

function HookHarness() {
  latestHookState = usePresenceLifecycle()
  return null
}

function mountHarness() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  act(() => {
    root.render(<HookHarness />)
  })

  return () => {
    act(() => {
      root.unmount()
    })
    container.remove()
    latestHookState = null
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

function seedAuthState() {
  otpAuthStorage.setSession({
    sessionToken: 'session-token',
    authUserId: 'auth-user-1',
    phoneE164: '+639123456789',
    expiresAt: Date.now() + 60_000,
  })
  storage.setAuthData('device-1', 'melvin', 'stale-user')
}

describe('usePresenceLifecycle', () => {
  beforeEach(() => {
    installLocalStorageMock()
    resetLocalState()
    mockNavigate.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
    resetLocalState()
    latestHookState = null
  })

  it('restores presence on mount and repairs stale local user ids', async () => {
    seedAuthState()
    const convexMutationMock = vi.mocked(convexMutation)
    convexMutationMock.mockImplementation(async (path) => {
      if (path === 'authSessions:touch') {
        return { ok: true }
      }
      if (path === 'users:upsert') {
        return { _id: 'fresh-user', username: 'melvin' }
      }
      throw new Error(`Unexpected path: ${path}`)
    })

    const cleanup = mountHarness()
    try {
      await flushAsync()

      expect(convexMutationMock.mock.calls.map(([path]) => path)).toEqual([
        'authSessions:touch',
        'users:upsert',
      ])
      expect(storage.getUserId()).toBe('fresh-user')
      expect(latestHookState?.recoveryState).toBeNull()
    } finally {
      cleanup()
    }
  })

  it('retries restore when the app becomes visible and focused', async () => {
    seedAuthState()
    const convexMutationMock = vi.mocked(convexMutation)
    convexMutationMock.mockImplementation(async (path) => {
      if (path === 'authSessions:touch') {
        return { ok: true }
      }
      if (path === 'users:upsert') {
        return { _id: 'fresh-user', username: 'melvin' }
      }
      throw new Error(`Unexpected path: ${path}`)
    })

    const cleanup = mountHarness()
    try {
      await flushAsync()
      convexMutationMock.mockClear()

      act(() => {
        window.dispatchEvent(new Event('focus'))
      })
      await flushAsync()

      expect(convexMutationMock.mock.calls.map(([path]) => path)).toEqual([
        'authSessions:touch',
        'users:upsert',
      ])

      convexMutationMock.mockClear()
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'visible',
      })

      act(() => {
        document.dispatchEvent(new Event('visibilitychange'))
      })
      await flushAsync()

      expect(convexMutationMock.mock.calls.map(([path]) => path)).toEqual([
        'authSessions:touch',
        'users:upsert',
      ])
    } finally {
      cleanup()
    }
  })

  it('clears local auth when the server session is no longer valid', async () => {
    seedAuthState()
    const convexMutationMock = vi.mocked(convexMutation)
    convexMutationMock.mockResolvedValue({ ok: false, reason: 'expired' })

    const cleanup = mountHarness()
    try {
      await flushAsync()

      expect(convexMutationMock).toHaveBeenCalledTimes(1)
      expect(otpAuthStorage.getSession()).toBeNull()
      expect(storage.getAuth()).toEqual({
        deviceId: null,
        username: null,
        userId: null,
      })
    } finally {
      cleanup()
    }
  })

  it('surfaces username conflicts through recovery state', async () => {
    seedAuthState()
    const convexMutationMock = vi.mocked(convexMutation)
    convexMutationMock.mockImplementation(async (path) => {
      if (path === 'authSessions:touch') {
        return { ok: true }
      }
      if (path === 'users:upsert') {
        throw new Error('USERNAME_IN_USE:melvin321')
      }
      throw new Error(`Unexpected path: ${path}`)
    })

    const cleanup = mountHarness()
    try {
      await flushAsync()

      expect(latestHookState?.recoveryState).toEqual({
        deviceId: 'device-1',
        lastUsername: 'melvin',
      })
      expect(latestHookState?.recoveryError).toBe(
        '"melvin" is active right now. Please choose another username.',
      )
    } finally {
      cleanup()
    }
  })

  it('abandons recovery by clearing local identity and routing to onboarding', async () => {
    seedAuthState()
    const convexMutationMock = vi.mocked(convexMutation)
    convexMutationMock.mockImplementation(async (path) => {
      if (path === 'authSessions:touch') {
        return { ok: true }
      }
      if (path === 'users:upsert') {
        throw new Error('USERNAME_IN_USE:melvin321')
      }
      throw new Error(`Unexpected path: ${path}`)
    })

    const cleanup = mountHarness()
    try {
      await flushAsync()

      act(() => {
        latestHookState?.abandonRecovery()
      })

      expect(storage.getAuth()).toEqual({
        deviceId: null,
        username: null,
        userId: null,
      })
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
    } finally {
      cleanup()
    }
  })
})
