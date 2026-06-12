'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc, runTransaction, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Session, User } from '@/types'
import { useAuthContext } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { Calendar, Clock, DollarSign, Loader2, ShieldCheck } from 'lucide-react'

export default function BookSessionPage({ params }: { params: { id: string } }) {
  const { user, userData } = useAuthContext()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [tutor, setTutor] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const docSnap = await getDoc(doc(db, 'sessions', params.id))
      if (!docSnap.exists()) {
        setLoading(false)
        return
      }
      const sessionData = { id: docSnap.id, ...docSnap.data() } as Session
      setSession(sessionData)

      const tutorSnap = await getDoc(doc(db, 'users', sessionData.tutorId))
      if (tutorSnap.exists()) {
        setTutor({ uid: tutorSnap.id, ...tutorSnap.data() } as User)
      }
      setLoading(false)
    }
    fetchData()
  }, [params.id])

  const handleBook = async () => {
    if (!user || !session?.id) return

    setBooking(true)
    try {
      await runTransaction(db, async (transaction) => {
        const sessionRef = doc(db, 'sessions', session.id!)
        const sessionSnap = await transaction.get(sessionRef)

        if (!sessionSnap.exists()) {
          throw new Error('Session no longer exists')
        }

        const currentData = sessionSnap.data()
        if (currentData.status !== 'open') {
          throw new Error('This session has already been booked')
        }

        transaction.update(sessionRef, {
          status: 'booked',
          studentId: user.uid,
        })
      })

      toast.success('Session booked successfully!')
      router.push(`/session/${session.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to book session')
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!session || !tutor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Session not found.</p>
      </div>
    )
  }

  if (session.status !== 'open') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg text-center">
        <h2 className="text-2xl font-bold mb-2">Session Unavailable</h2>
        <p className="text-muted-foreground mb-4">This session is no longer available for booking.</p>
        <Button onClick={() => router.push('/browse-sessions')}>Browse Sessions</Button>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Card>
        <CardHeader className="text-center">
          <ShieldCheck className="h-12 w-12 mx-auto text-primary mb-2" />
          <CardTitle>Confirm Booking</CardTitle>
          <CardDescription>Review the session details before booking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage src={tutor.photoURL || undefined} />
              <AvatarFallback>{tutor.name?.charAt(0)?.toUpperCase() || 'T'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{tutor.name}</p>
              <p className="text-sm text-muted-foreground">Tutor</p>
            </div>
          </div>

          <div>
            <Badge variant="default">{session.subject}</Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{formatDate(session.startTime.toDate())}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{session.durationMinutes} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{formatCurrency(session.price)}</span>
            </div>
          </div>

          <Separator />

          <Button
            className="w-full"
            size="lg"
            onClick={handleBook}
            disabled={booking}
          >
            {booking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Booking...
              </>
            ) : (
              `Confirm & Pay ${formatCurrency(session.price)}`
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By booking, you agree to the cancellation policy. Free cancellation up to 1 hour before the session.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
