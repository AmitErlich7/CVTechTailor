import { auth, googleProvider } from '../firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export const TEST_AUTH_ENABLED = import.meta.env.VITE_E2E_BYPASS_AUTH === 'true'

const TEST_AUTH_STORAGE_KEY = 'resume-tailor-e2e-auth'

const TEST_USER = {
  id: 'user_test_123',
  firstName: 'Test',
  fullName: 'Test User',
  imageUrl: '',
  primaryEmailAddress: {
    emailAddress: 'test.user@example.com',
  },
  externalAccounts: [{ provider: 'google' }],
}

// ---------------------------------------------------------------------------
// Test auth (E2E bypass)
// ---------------------------------------------------------------------------

const TestAuthContext = createContext(null)

function getStoredSignedIn() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(TEST_AUTH_STORAGE_KEY) === 'signed-in'
}

function setStoredSignedIn(signedIn) {
  if (typeof window === 'undefined') return
  if (signedIn) {
    window.localStorage.setItem(TEST_AUTH_STORAGE_KEY, 'signed-in')
  } else {
    window.localStorage.removeItem(TEST_AUTH_STORAGE_KEY)
  }
}

function TestAuthProvider({ children }) {
  const [isSignedIn, setIsSignedIn] = useState(getStoredSignedIn)

  const value = useMemo(
    () => ({
      isLoaded: true,
      isSignedIn,
      user: isSignedIn ? TEST_USER : null,
      getToken: async () => (isSignedIn ? 'test-token' : null),
      signIn: () => {
        setStoredSignedIn(true)
        setIsSignedIn(true)
      },
      signOut: () => {
        setStoredSignedIn(false)
        setIsSignedIn(false)
      },
    }),
    [isSignedIn],
  )

  return (
    <TestAuthContext.Provider value={value}>
      {children}
    </TestAuthContext.Provider>
  )
}

function useTestAuthContext() {
  const value = useContext(TestAuthContext)
  if (!value) throw new Error('Test auth context is missing.')
  return value
}

// ---------------------------------------------------------------------------
// Firebase auth
// ---------------------------------------------------------------------------

const FirebaseAuthContext = createContext(null)

function FirebaseAuthProvider({ children }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [firebaseUser, setFirebaseUser] = useState(null)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u)
      setIsLoaded(true)
    })
  }, [])

  const value = useMemo(() => {
    const user = firebaseUser
      ? {
          id: firebaseUser.uid,
          firstName: firebaseUser.displayName?.split(' ')[0] || '',
          fullName: firebaseUser.displayName || '',
          imageUrl: firebaseUser.photoURL || '',
          primaryEmailAddress: { emailAddress: firebaseUser.email },
          externalAccounts: [{ provider: 'google' }],
        }
      : null

    return {
      isLoaded,
      isSignedIn: !!firebaseUser,
      user,
      getToken: async () => firebaseUser?.getIdToken() ?? null,
      signIn: () => signInWithPopup(auth, googleProvider),
      signOut: () => signOut(auth),
    }
  }, [isLoaded, firebaseUser])

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  )
}

function useFirebaseAuthContext() {
  const value = useContext(FirebaseAuthContext)
  if (!value) throw new Error('Firebase auth context is missing.')
  return value
}

// ---------------------------------------------------------------------------
// Public API — same shape as before so the rest of the app is unchanged
// ---------------------------------------------------------------------------

export function AppAuthProvider({ children }) {
  if (TEST_AUTH_ENABLED) {
    return <TestAuthProvider>{children}</TestAuthProvider>
  }
  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
}

export function useAppUser() {
  if (TEST_AUTH_ENABLED) {
    const { isLoaded, isSignedIn, user } = useTestAuthContext()
    return { isLoaded, isSignedIn, user }
  }
  const { isLoaded, isSignedIn, user } = useFirebaseAuthContext()
  return { isLoaded, isSignedIn, user }
}

export function useAppAuth() {
  if (TEST_AUTH_ENABLED) {
    const { getToken } = useTestAuthContext()
    return { getToken }
  }
  const { getToken } = useFirebaseAuthContext()
  return { getToken }
}

export function AppSignIn() {
  if (TEST_AUTH_ENABLED) {
    const { signIn } = useTestAuthContext()
    return (
      <button
        type="button"
        onClick={signIn}
        data-testid="test-sign-in"
        style={{
          width: '100%',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          padding: '12px 16px',
          background: '#2563eb',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        Continue as Test User
      </button>
    )
  }

  const { signIn } = useFirebaseAuthContext()
  return (
    <button
      type="button"
      onClick={signIn}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        padding: '12px 16px',
        background: '#fff',
        color: '#0f172a',
        cursor: 'pointer',
        justifyContent: 'center',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
        <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
      </svg>
      Sign in with Google
    </button>
  )
}

export function AppUserButton() {
  if (TEST_AUTH_ENABLED) {
    const { user, signOut: testSignOut } = useTestAuthContext()
    return (
      <button
        type="button"
        onClick={testSignOut}
        aria-label="Sign out"
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: '999px',
          padding: '8px 12px',
          background: '#fff',
          color: '#0f172a',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        Sign out {user?.firstName || ''}
      </button>
    )
  }

  const { user, signOut: firebaseSignOut, isLoaded } = useFirebaseAuthContext()
  if (!isLoaded || !user) return null

  return (
    <button
      type="button"
      onClick={firebaseSignOut}
      aria-label="Sign out"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        border: '1px solid #cbd5e1',
        borderRadius: '999px',
        padding: '6px 12px 6px 6px',
        background: '#fff',
        color: '#0f172a',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
      }}
    >
      {user.imageUrl && (
        <img
          src={user.imageUrl}
          alt={user.fullName}
          width={24}
          height={24}
          style={{ borderRadius: '50%' }}
        />
      )}
      Sign out
    </button>
  )
}

export function AppUserProfile() {
  if (TEST_AUTH_ENABLED) {
    return (
      <div
        data-testid="test-user-profile"
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          background: '#fff',
          padding: '24px',
          color: '#475569',
          fontSize: '14px',
          lineHeight: 1.6,
        }}
      >
        Account settings are bypassed in end-to-end test mode.
      </div>
    )
  }

  const { user } = useFirebaseAuthContext()
  if (!user) return null

  return (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        background: '#fff',
        padding: '24px',
        fontSize: '14px',
        lineHeight: 1.6,
      }}
    >
      {user.imageUrl && (
        <img
          src={user.imageUrl}
          alt={user.fullName}
          width={64}
          height={64}
          style={{ borderRadius: '50%', marginBottom: '12px' }}
        />
      )}
      <p><strong>Name:</strong> {user.fullName}</p>
      <p><strong>Email:</strong> {user.primaryEmailAddress.emailAddress}</p>
    </div>
  )
}
