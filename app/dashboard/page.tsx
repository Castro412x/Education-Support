'use client'

import { useEffect, useState } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthContext } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Session } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { BookOpen, FileText, Plus, Clock, Calendar, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { user, userData, loading } = useAuthContext()
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user || !userData) return

    const field = userData.role === 'tutor' ? 'tutorId' : 'studentId'
    const q = query(
      collection(db, 'sessions'),
      where(field, '==', user.uid),
      where('status', 'in', ['booked', 'completed'])
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Session[]
      setSessions(results)
      setSessionsLoading(false)
    })

    return () => unsubscribe()
  }, [user, userData])

  const handleCancel = async (session: Session) => {
    if (!confirm('Are you sure you want to cancel this session?')) return

    try {
      await updateDoc(doc(db, 'sessions', session.id!), {
        status: 'cancelled',
      })
      toast.success('Session cancelled')
    } catch {
      toast.error('Failed to cancel session')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user || !userData) return null

  const upcoming = sessions.filter((s) => s.status === 'booked')
  const completed = sessions.filter((s) => s.status === 'completed')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.photoURL || undefined} />
          <AvatarFallback>{userData.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{userData.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={userData.role === 'tutor' ? 'default' : 'secondary'}>
              {userData.role === 'tutor' ? 'Tutor' : 'Student'}
            </Badge>
            <span className="text-sm text-muted-foreground">{userData.email}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{upcoming.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completed.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {userData.role === 'tutor' ? 'Resources Shared' : 'Downloads'}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>

      {userData.role === 'tutor' && (
        <div className="flex gap-4 mb-8">
          <Button onClick={() => router.push('/session/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Session
          </Button>
          <Button variant="outline" onClick={() => router.push('/upload-resource')}>
            <BookOpen className="mr-2 h-4 w-4" />
            Upload Resource
          </Button>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
          <div className="space-y-3">
            {upcoming.map((session) => (
              <Card key={session.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{session.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(session.startTime.toDate())} &middot; {session.durationMinutes}min
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{formatCurrency(session.price)}</Badge>
                    {userData.role === 'student' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancel(session)}
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/browse-sessions')}>
            <BookOpen className="mr-2 h-4 w-4" />
            Browse Available Sessions
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => router.push('/resources')}>
            <FileText className="mr-2 h-4 w-4" />
            Browse Resources Library
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => router.push(`/profile/${user.uid}`)}>
            <Calendar className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
