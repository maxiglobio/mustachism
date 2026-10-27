'use client'

import { useEffect, useState } from 'react'
import { api, type AuthState } from './api'

const KEY = 'auth'
const SIGNED_OUT: AuthState = { authenticated: false, userId: null, email: null }

function readCached(): AuthState {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...SIGNED_OUT, ...JSON.parse(raw) } : SIGNED_OUT
  } catch {
    return SIGNED_OUT
  }
}

function writeCached(state: AuthState) {
  try {
    if (state.authenticated) localStorage.setItem(KEY, JSON.stringify(state))
    else localStorage.removeItem(KEY)
  } catch {
    /* storage unavailable */
  }
}

/** Cached auth state first (instant label), then reconciled with the server session. */
export function useAuth() {
  const [state, setState] = useState<AuthState>(SIGNED_OUT)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let alive = true
    setState(readCached())
    api.checkAuth().then((fresh) => {
      if (!alive) return
      writeCached(fresh)
      setState(fresh)
      setChecked(true)
    })
    return () => {
      alive = false
    }
  }, [])

  return { ...state, checked }
}

/** Requests a magic sign-in link; the session is set when the emailed link is opened. */
export async function login(email: string) {
  await api.login(email)
}

export async function logout() {
  try {
    await api.logout()
  } finally {
    writeCached(SIGNED_OUT)
  }
}
