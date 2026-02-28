import { useEffect } from 'react'
import { convexMutation } from '@/lib/convex'
import { otpAuthStorage } from '@/lib/otpAuth'
import { storage } from '@/lib/storage'

const HEARTBEAT_INTERVAL_MS = 30000

interface UsePresenceHeartbeatOptions {
  restorePresence?: () => Promise<boolean>
}

export function usePresenceHeartbeat({ restorePresence }: UsePresenceHeartbeatOptions = {}) {
  const deviceId = storage.getDeviceId()

  useEffect(() => {
    if (typeof window === 'undefined' || !deviceId || !otpAuthStorage.hasValidSession()) return

    let isDisposed = false

    const sendHeartbeat = async () => {
      if (isDisposed) return

      try {
        const userId = await convexMutation<string | null>(
          'users:heartbeat',
          { deviceId },
          { maxRetries: 1, baseDelay: 250, maxDelay: 1000 }
        )
        if (!userId) {
          await restorePresence?.()
        }
      } catch {
        // Keep this silent; next tick retries automatically.
      }
    }

    const intervalId = window.setInterval(() => {
      void sendHeartbeat()
    }, HEARTBEAT_INTERVAL_MS)

    return () => {
      isDisposed = true
      window.clearInterval(intervalId)
    }
  }, [deviceId, restorePresence])
}
