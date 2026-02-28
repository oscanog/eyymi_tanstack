import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { convexMutation } from '@/lib/convex'
import { otpAuthStorage } from '@/lib/otpAuth'
import { storage } from '@/lib/storage'
import {
  parseSuggestedUsername,
  sanitizeUsernameInput,
  USERNAME_MIN_LENGTH,
} from '@/lib/username'

interface RestoredUser {
  _id: string
  username: string
}

interface TouchSessionResult {
  ok: boolean
  reason?: 'not_found' | 'revoked' | 'expired'
}

export interface PresenceRecoveryState {
  deviceId: string
  lastUsername: string
}

interface RestoreOptions {
  surfaceUnexpectedErrors?: boolean
}

function buildUsernameConflictMessage(username: string): string {
  return `"${username}" is active right now. Please choose another username.`
}

export function usePresenceLifecycle() {
  const navigate = useNavigate()
  const [isRestoringPresence, setIsRestoringPresence] = useState(false)
  const [recoveryState, setRecoveryState] = useState<PresenceRecoveryState | null>(null)
  const [recoveryError, setRecoveryError] = useState<string | null>(null)
  const restorePromiseRef = useRef<Promise<boolean> | null>(null)
  const hasValidSession = otpAuthStorage.hasValidSession()

  const clearAuthState = useCallback(() => {
    otpAuthStorage.clear()
    storage.clear()
    setRecoveryState(null)
    setRecoveryError(null)
  }, [])

  const restorePresence = useCallback((options?: RestoreOptions): Promise<boolean> => {
    if (restorePromiseRef.current) {
      return restorePromiseRef.current
    }

    const restoreTask = (async () => {
      const session = otpAuthStorage.getSession()
      if (!session || session.expiresAt <= Date.now()) {
        setRecoveryState(null)
        setRecoveryError(null)
        return false
      }

      const auth = storage.getAuth()
      const recoveryUsername = sanitizeUsernameInput(storage.getRecoveryUsername() ?? '')
      if (!auth.deviceId || recoveryUsername.length < USERNAME_MIN_LENGTH) {
        setRecoveryState(null)
        setRecoveryError(null)
        return false
      }
      const deviceId = auth.deviceId

      setIsRestoringPresence(true)

      try {
        const touchResult = await convexMutation<TouchSessionResult>(
          'authSessions:touch',
          { sessionToken: session.sessionToken },
          { maxRetries: 1, baseDelay: 250, maxDelay: 1000 },
        )

        if (!touchResult.ok) {
          clearAuthState()
          return false
        }

        const restoredUser = await convexMutation<RestoredUser>(
          'users:upsert',
          {
            deviceId,
            username: recoveryUsername,
          },
          { maxRetries: 1, baseDelay: 250, maxDelay: 1000 },
        )

        storage.setAuthData(deviceId, restoredUser.username, restoredUser._id)
        setRecoveryState(null)
        setRecoveryError(null)
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const usernameSuggestion = parseSuggestedUsername(message)

        if (usernameSuggestion) {
          setRecoveryState({
            deviceId,
            lastUsername: recoveryUsername,
          })
          setRecoveryError(buildUsernameConflictMessage(recoveryUsername))
          return false
        }

        if (options?.surfaceUnexpectedErrors) {
          setRecoveryState((current) => current ?? {
            deviceId,
            lastUsername: recoveryUsername,
          })
          setRecoveryError(message)
        }

        return false
      } finally {
        setIsRestoringPresence(false)
        restorePromiseRef.current = null
      }
    })()

    restorePromiseRef.current = restoreTask
    return restoreTask
  }, [clearAuthState])

  const retryRecovery = useCallback(async () => {
    await restorePresence({ surfaceUnexpectedErrors: true })
  }, [restorePresence])

  const abandonRecovery = useCallback(() => {
    storage.clear()
    setRecoveryState(null)
    setRecoveryError(null)
    void navigate({ to: '/' })
  }, [navigate])

  useEffect(() => {
    if (!hasValidSession) {
      setRecoveryState(null)
      setRecoveryError(null)
      return
    }

    void restorePresence()

    const handleFocus = () => {
      void restorePresence()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void restorePresence()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [hasValidSession, restorePresence])

  return {
    isRestoringPresence,
    recoveryState,
    recoveryError,
    restorePresence,
    retryRecovery,
    abandonRecovery,
  }
}
