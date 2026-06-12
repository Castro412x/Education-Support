'use client'

import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

export function useAuthSignup() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const signupWithEmail = async (
    email: string,
    password: string,
    name: string,
    role: 'student' | 'tutor'
  ) => {
    setError('')
    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      await updateProfile(user, { displayName: name })

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        role,
        name,
        email,
        photoURL: '',
        createdAt: serverTimestamp(),
      })

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const signupWithGoogle = async (role: 'student' | 'tutor') => {
    setError('')
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      const user = userCredential.user

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        role,
        name: user.displayName || 'User',
        email: user.email,
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
      })

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google')
    } finally {
      setLoading(false)
    }
  }

  return { signupWithEmail, signupWithGoogle, error, loading }
}
