/* @vitest-environment jsdom */

import type { ComponentProps } from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { OnlineUsersDrawer } from './OnlineUsersDrawer'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const baseUsers = [
  { _id: 'u1', username: 'melvin', isOnline: true, lastSeen: 1_700_000_000_000 },
  { _id: 'u2', username: 'stephanie', isOnline: true, lastSeen: 1_700_000_050_000 },
]

function mountDrawer(overrides?: Partial<ComponentProps<typeof OnlineUsersDrawer>>) {
  const onClose = vi.fn()
  const props: ComponentProps<typeof OnlineUsersDrawer> = {
    isOpen: true,
    users: baseUsers,
    currentUserId: 'u1',
    currentUsername: 'melvin',
    isLoading: false,
    error: null,
    onClose,
    ...overrides,
  }

  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  act(() => {
    root.render(<OnlineUsersDrawer {...props} />)
  })

  const cleanup = () => {
    act(() => {
      root.unmount()
    })
    container.remove()
  }

  return { onClose, container, cleanup }
}

describe('OnlineUsersDrawer', () => {
  it('renders welcome variant branch', () => {
    const { container, cleanup } = mountDrawer({ variant: 'welcome' })
    try {
      const drawer = container.querySelector('[data-testid="online-users-drawer"]')
      expect(drawer?.getAttribute('data-variant')).toBe('welcome')
      expect(container.textContent?.includes('2 online')).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('closes via escape', () => {
    const { onClose, cleanup } = mountDrawer()
    try {
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      })
      expect(onClose).toHaveBeenCalledTimes(1)
    } finally {
      cleanup()
    }
  })

  it('closes via backdrop click after debounce window', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
      const { onClose, container, cleanup } = mountDrawer()
      try {
        vi.setSystemTime(new Date('2026-01-01T00:00:01.000Z'))
        const backdrop = container.querySelectorAll('button[aria-label="Close online users sidebar"]')[0] as HTMLButtonElement
        act(() => {
          backdrop.click()
        })
        expect(onClose).toHaveBeenCalledTimes(1)
      } finally {
        cleanup()
      }
    } finally {
      vi.useRealTimers()
    }
  })

  it('renders non-clickable rows when onUserClick is not provided', () => {
    const { container, cleanup } = mountDrawer()
    try {
      const staticRow = container.querySelector('[data-testid="online-user-row-static-u2"]')
      const clickableRow = container.querySelector('[data-testid="online-user-row-button-u2"]')
      expect(staticRow).toBeTruthy()
      expect(clickableRow).toBeNull()
    } finally {
      cleanup()
    }
  })
})
