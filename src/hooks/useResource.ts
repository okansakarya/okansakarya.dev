import { useCallback, useEffect, useMemo, useState } from 'react'

type Settled<T> = { key: object } & ({ data: T; error: null } | { data: null; error: Error })

/**
 * Loads data with an AbortSignal and exposes `reload` and `setData`
 * so pages can refresh or apply local updates after mutations.
 * The loading state is derived: a result only counts if it belongs to the current request key.
 */
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [version, setVersion] = useState(0)
  const requestKey = useMemo(() => ({ load, version }), [load, version])
  const [settled, setSettled] = useState<Settled<T> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
      .then((data) => setSettled({ key: requestKey, data, error: null }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          const normalized = error instanceof Error ? error : new Error(String(error))
          setSettled({ key: requestKey, data: null, error: normalized })
        }
      })
    return () => controller.abort()
  }, [load, requestKey])

  const reload = useCallback(() => setVersion((current) => current + 1), [])
  const setData = useCallback((next: T | ((current: T) => T)) => {
    setSettled((previous) => {
      if (!previous || previous.error) {
        return previous
      }
      const data = typeof next === 'function' ? (next as (current: T) => T)(previous.data) : next
      return { key: previous.key, data, error: null }
    })
  }, [])

  const current = settled?.key === requestKey ? settled : null
  if (!current) {
    return { status: 'loading', data: null, error: null, reload, setData } as const
  }
  if (current.error) {
    return { status: 'error', data: null, error: current.error, reload, setData } as const
  }
  return { status: 'success', data: current.data, error: null, reload, setData } as const
}
