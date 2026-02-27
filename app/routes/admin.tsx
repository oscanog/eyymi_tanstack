import { Navigate, createFileRoute } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import { convexMutation } from "@/lib/convex"
import {
  formatDurationMs,
  isLocalAppEnv,
  shouldShowDummyUsersModalTrigger,
  toNumberedDummyUsers,
  type DummyUsersStatus,
} from "@/lib/admin.helpers"
import { useConvexSubscription } from "@/hooks/useConvexQuery"

export const Route = createFileRoute("/admin")({
  component: AdminPage,
})

const EMPTY_STATUS: DummyUsersStatus = {
  isActive: false,
  startedAt: null,
  expiresAt: null,
  remainingMs: 0,
  users: [],
}

function AdminPage() {
  const isLocalEnv = isLocalAppEnv(import.meta.env.VITE_APP_ENV)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployError, setDeployError] = useState<string | null>(null)
  const [deploySuccessMessage, setDeploySuccessMessage] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const {
    data: statusData,
    isLoading,
    error,
  } = useConvexSubscription<DummyUsersStatus>(
    "admin:getDummyUsersStatus",
    {},
    3000,
    isLocalEnv,
  )

  if (!isLocalEnv) {
    return <Navigate to="/welcome" />
  }

  const status = statusData ?? EMPTY_STATUS
  const numberedUsers = useMemo(() => toNumberedDummyUsers(status.users), [status.users])
  const canShowModalTrigger = shouldShowDummyUsersModalTrigger(status)

  useEffect(() => {
    if (!canShowModalTrigger && isModalOpen) {
      setIsModalOpen(false)
    }
  }, [canShowModalTrigger, isModalOpen])

  const handleDeploy = async () => {
    setIsDeploying(true)
    setDeployError(null)
    setDeploySuccessMessage(null)

    try {
      const result = await convexMutation<DummyUsersStatus>(
        "admin:deployDummyUsers",
        {},
        { maxRetries: 1, baseDelay: 250, maxDelay: 1000 },
      )
      setDeploySuccessMessage(
        `Deployed ${result.users.length} dummy users for ${formatDurationMs(result.remainingMs)}.`,
      )
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : "Failed to deploy dummy users")
    } finally {
      setIsDeploying(false)
    }
  }

  const futureFunctions = [
    "Bulk route snapshot refresh",
    "Session pressure diagnostics",
    "Invite flow load simulation",
  ]

  return (
    <div className="min-h-screen bg-[var(--color-navy-bg)] text-[var(--color-text-primary)]">
      <div className="mx-auto w-full max-w-[430px] px-4 pb-8 pt-6">
        <header className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">Local Admin</p>
          <h1 className="mt-1 text-xl font-semibold">Admin Special Functions</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Rapid development controls for local testing only.
          </p>
        </header>

        <section className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-wide text-[var(--color-text-muted)]">Available Now</p>
              <h2 className="mt-1 text-base font-semibold">Deploy 10 online dummy users (10 minutes)</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Re-running while active resets the same 10 users to a fresh 10-minute window.
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                status.isActive
                  ? "bg-[var(--color-drawer-accent-soft)] text-[var(--color-rose)]"
                  : "bg-[var(--color-drawer-item-bg)] text-[var(--color-text-muted)]"
              }`}
            >
              {status.isActive ? "Active" : "Idle"}
            </span>
          </div>

          <div className="mt-3 text-sm text-[var(--color-text-secondary)]">
            {status.isActive
              ? `Time remaining: ${formatDurationMs(status.remainingMs)}`
              : "No active dummy deployment."}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                void handleDeploy()
              }}
              disabled={isDeploying}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--color-rose)] px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isDeploying ? "Deploying..." : "Deploy 10 Dummy Users"}
            </button>

            {canShowModalTrigger && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-4 text-sm font-semibold"
              >
                View Dummy Users
              </button>
            )}
          </div>

          {!canShowModalTrigger && (
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              The list modal becomes available after deployment is triggered.
            </p>
          )}

          {isLoading && <p className="mt-3 text-xs text-[var(--color-text-muted)]">Loading deployment status...</p>}
          {error && <p className="mt-3 text-xs text-[var(--color-error)]">{error.message}</p>}
          {deployError && <p className="mt-3 text-xs text-[var(--color-error)]">{deployError}</p>}
          {deploySuccessMessage && <p className="mt-3 text-xs text-[var(--color-success)]">{deploySuccessMessage}</p>}
        </section>

        <section className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-navy-surface)] p-4">
          <p className="text-sm uppercase tracking-wide text-[var(--color-text-muted)]">Future</p>
          <ul className="mt-2 space-y-2">
            {futureFunctions.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-drawer-item-bg)] px-3 py-2 text-sm text-[var(--color-text-secondary)]"
              >
                {item} (planned)
              </li>
            ))}
          </ul>
        </section>
      </div>

      {isModalOpen && canShowModalTrigger && (
        <>
          <button
            type="button"
            aria-label="Close dummy users modal"
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 z-[980]"
            style={{ backgroundColor: "var(--color-modal-backdrop)" }}
          />
          <div className="fixed inset-0 z-[990] flex items-center justify-center px-5">
            <div
              className="w-full max-w-sm rounded-2xl border p-4 shadow-[0_24px_56px_rgba(0,0,0,0.35)]"
              style={{
                backgroundColor: "var(--color-modal-surface)",
                borderColor: "var(--color-modal-border)",
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-dummy-users-title"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 id="admin-dummy-users-title" className="text-base font-semibold text-[var(--color-modal-text)]">
                  10 Dummy Users
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-modal-border)] bg-[var(--color-modal-muted-bg)] text-[var(--color-modal-text)]"
                  aria-label="Close dummy users modal"
                >
                  x
                </button>
              </div>

              <p className="mt-2 text-xs text-[var(--color-modal-text-muted)]">
                Number and name of the currently deployed dummy users.
              </p>

              <div className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto">
                {numberedUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-modal-border)] bg-[var(--color-modal-muted-bg)] px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-[var(--color-modal-text)]">{user.number}.</span>
                    <span className="ml-3 flex-1 text-[var(--color-modal-text)]">{user.username}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminPage
