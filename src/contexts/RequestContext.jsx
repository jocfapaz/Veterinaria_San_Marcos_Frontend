/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import * as requestsApi from '../services/requestsApi.js'

const RequestContext = createContext(null)

export function RequestProvider({ children }) {
  const { currentUser, isReady: authReady } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refreshRequests = useCallback(async () => {
    if (!currentUser) {
      setRequests([])
      setError(null)
      return []
    }
    setLoading(true)
    setError(null)
    try {
      const data = await requestsApi.listMyRequests()
      setRequests(Array.isArray(data) ? data : [])
      return data
    } catch (err) {
      setError(err.message || 'Error al cargar las solicitudes.')
      setRequests([])
      return []
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    if (!authReady) return
    let active = true
    ;(async () => {
      if (!currentUser) {
        if (active) {
          setRequests([])
          setError(null)
          setLoading(false)
        }
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await requestsApi.listMyRequests()
        if (!active) return
        setRequests(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!active) return
        setError(err.message || 'Error al cargar las solicitudes.')
        setRequests([])
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [authReady, currentUser])

  const addRequest = useCallback(async (payload) => {
    const created = await requestsApi.createRequest(payload)
    setRequests((prev) => [created, ...prev])
    return created
  }, [])

  const cancelRequest = useCallback(async (id) => {
    const updated = await requestsApi.cancelRequest(id)
    setRequests((prev) =>
      prev.map((r) => (String(r.id) === String(id) ? { ...r, ...updated, status: updated?.status || 'cancelled' } : r)),
    )
    return updated
  }, [])

  const clearRequests = useCallback(() => {
    setRequests([])
    setError(null)
    setLoading(false)
  }, [])

  const requestCount = useMemo(
    () => requests.filter((r) => r.status !== 'cancelled').length,
    [requests],
  )

  const value = {
    requests,
    requestCount,
    loading,
    error,
    addRequest,
    cancelRequest,
    clearRequests,
    refreshRequests,
    isReady: authReady && !loading,
  }

  return <RequestContext.Provider value={value}>{children}</RequestContext.Provider>
}

export function useRequests() {
  const ctx = useContext(RequestContext)
  if (!ctx) throw new Error('useRequests debe usarse dentro de RequestProvider')
  return ctx
}
