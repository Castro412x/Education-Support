'use client'

import { useEffect, useState } from 'react'
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { User } from '@/types'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      if (!firebaseUser) {
        setUserData(null)
        setLoading(false)
      }
    })

    return () => unsubscribeAuth()
  }, [])

  useEffect(() => {
    if (!user) return

    const unsubscribeSnapshot = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setUserData({ uid: docSnapshot.id, ...docSnapshot.data() } as User)
        }
        setLoading(false)
      },
      () => {
        setLoading(false)
      }
    )

    return () => unsubscribeSnapshot()
  }, [user])

  const logout = async () => {
    await signOut(auth)
    router.push('/')
  }

  return { user, userData, loading, logout }
}
