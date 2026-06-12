'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Session, User } from '@/types'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Calendar, Clock, MapPin, Video, Star } from 'lucide-react'

interface SessionCardProps {
  session: Session
}

export function SessionCard({ session }: SessionCardProps) {
  const [tutor, setTutor] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchTutor = async () => {
      const docSnap = await getDoc(doc(db, 'users', session.tutorId))
      if (docSnap.exists()) {
        setTutor({ uid: docSnap.id, ...docSnap.data() } as User)
      }
    }
    fetchTutor()
  }, [session.tutorId])

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant={session.mode === 'online' ? 'default' : 'secondary'}>
            {session.mode === 'online' ? (
              <Video className="mr-1 h-3 w-3" />
            ) : (
              <MapPin className="mr-1 h-3 w-3" />
            )}
            {session.mode}
          </Badge>
          <Badge variant="success">${session.price}</Badge>
        </div>
        <CardTitle className="text-lg mt-2">{session.subject}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={tutor?.photoURL || undefined} />
            <AvatarFallback className="text-xs">
              {tutor?.name?.charAt(0)?.toUpperCase() || 'T'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{tutor?.name || 'Loading...'}</span>
          {tutor?.averageRating && tutor.averageRating > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {tutor.averageRating.toFixed(1)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {formatDate(session.startTime.toDate())}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {session.durationMinutes} minutes
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={() => router.push(`/session/${session.id}`)}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}
