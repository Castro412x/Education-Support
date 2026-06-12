import { Timestamp, GeoPoint } from 'firebase/firestore'

export interface User {
  uid: string
  role: 'student' | 'tutor'
  name: string
  email: string
  photoURL?: string
  subjects?: string[]
  hourlyRate?: number
  location?: GeoPoint
  averageRating?: number
  createdAt: Timestamp
}

export interface Session {
  id?: string
  tutorId: string
  studentId?: string
  subject: string
  startTime: Timestamp
  durationMinutes: number
  mode: 'online' | 'physical'
  meetingLink?: string
  address?: string
  price: number
  status: 'open' | 'booked' | 'cancelled' | 'completed'
  createdAt: Timestamp
  stripePaymentIntentId?: string
}

export interface Resource {
  id?: string
  title: string
  description: string
  subject: string
  gradeLevel: string
  fileUrl: string
  fileType: 'pdf' | 'video' | 'document'
  uploadedBy: string
  downloadCount: number
  createdAt: Timestamp
}

export interface Review {
  id?: string
  sessionId: string
  fromUserId: string
  toUserId: string
  rating: number
  comment: string
  createdAt: Timestamp
}
