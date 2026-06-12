'use client'

import { useEffect, useState } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Review, User } from '@/types'
import { useAuthContext } from '@/components/AuthProvider'
import { RatingStars } from '@/components/RatingStars'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { MessageSquare } from 'lucide-react'

interface ReviewsSectionProps {
  toUserId: string
  sessionId?: string
  showForm?: boolean
}

export function ReviewsSection({ toUserId, sessionId, showForm = false }: ReviewsSectionProps) {
  const { user, userData } = useAuthContext()
  const [reviews, setReviews] = useState<(Review & { reviewer?: User })[]>([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let constraints: any[] = [
      where('toUserId', '==', toUserId),
      orderBy('createdAt', 'desc'),
    ]

    if (sessionId) {
      constraints = [
        where('sessionId', '==', sessionId),
        orderBy('createdAt', 'desc'),
      ]
    }

    const q = query(collection(db, 'reviews'), ...constraints)

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const results = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data() } as Review
          const userDoc = await getDoc(doc(db, 'users', data.fromUserId))
          const reviewer = userDoc.exists()
            ? ({ uid: userDoc.id, ...userDoc.data() } as User)
            : undefined
          return { ...data, reviewer }
        })
      )
      setReviews(results)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [toUserId, sessionId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || rating === 0) return

    setSubmitting(true)
    try {
      await addDoc(collection(db, 'reviews'), {
        sessionId: sessionId || '',
        fromUserId: user.uid,
        toUserId,
        rating,
        comment,
        createdAt: serverTimestamp(),
      })
      toast.success('Review submitted!')
      setRating(0)
      setComment('')
    } catch {
      toast.error('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {showForm && user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leave a Review</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Rating</Label>
                <RatingStars rating={rating} onRate={setRating} size="lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                />
              </div>
              <Button type="submit" disabled={submitting || rating === 0}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Reviews ({reviews.length})
        </h3>

        {loading ? (
          <p className="text-muted-foreground">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-muted-foreground">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={review.reviewer?.photoURL || undefined} />
                    <AvatarFallback>
                      {review.reviewer?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{review.reviewer?.name || 'Anonymous'}</p>
                    <RatingStars rating={review.rating} readOnly size="sm" />
                  </div>
                </div>
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
