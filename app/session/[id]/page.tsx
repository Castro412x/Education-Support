'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
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
import { ReviewsSection } from '@/components/ReviewsSection'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Video,
  ArrowLeft,
  Star,
  User as UserIcon,
} from 'lucide-react'

export default function SessionDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuthContext()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [tutor, setTutor] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      const docSnap = await getDoc(doc(db, 'sessions', params.id))
      if (docSnap.exists()) {
        const sessionData = { id: docSnap.id, ...docSnap.data() } as Session
        setSession(sessionData)

        const tutorSnap = await getDoc(doc(db, 'users', sessionData.tutorId))
        if (tutorSnap.exists()) {
          setTutor({ uid: tutorSnap.id, ...tutorSnap.data() } as User)
        }
      }
      setLoading(false)
    }
    fetchSession()
  }, [params.id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Session not found.</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge
              variant={
                session.status === 'open'
                  ? 'success'
                  : session.status === 'booked'
                  ? 'default'
                  : session.status === 'completed'
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </Badge>
            <Badge variant={session.mode === 'online' ? 'default' : 'secondary'}>
              {session.mode === 'online' ? (
                <Video className="mr-1 h-3 w-3" />
              ) : (
                <MapPin className="mr-1 h-3 w-3" />
              )}
              {session.mode}
            </Badge>
          </div>
          <CardTitle className="text-2xl mt-4">{session.subject}</CardTitle>
          <CardDescription>Tutoring Session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {tutor && (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={tutor.photoURL || undefined} />
                <AvatarFallback>{tutor.name?.charAt(0)?.toUpperCase() || 'T'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{tutor.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserIcon className="h-3 w-3" />
                  <span>Tutor</span>
                  {tutor.averageRating && tutor.averageRating > 0 && (
                    <>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{tutor.averageRating.toFixed(1)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium">{formatDate(session.startTime.toDate())}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{session.durationMinutes} minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-medium">{formatCurrency(session.price)}</p>
              </div>
            </div>
          </div>

          {session.mode === 'online' && session.meetingLink && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Meeting Link</p>
              <a
                href={session.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm break-all"
              >
                {session.meetingLink}
              </a>
            </div>
          )}

          {session.mode === 'physical' && session.address && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Location</p>
              <p className="font-medium">{session.address}</p>
            </div>
          )}

          <Separator />

          {session.status === 'open' && user ? (
            <Button
              className="w-full"
              size="lg"
              onClick={() => router.push(`/book/${session.id}`)}
            >
              Book This Session
            </Button>
          ) : session.status === 'open' && !user ? (
            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={() => router.push('/login')}
            >
              Sign in to Book
            </Button>
          ) : session.status === 'booked' && session.studentId === user?.uid ? (
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="font-semibold text-primary">You have booked this session</p>
            </div>
          ) : null}

          {session.status === 'completed' && (
            <ReviewsSection
              toUserId={session.tutorId}
              sessionId={session.id}
              showForm={!!user && user.uid === session.studentId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
