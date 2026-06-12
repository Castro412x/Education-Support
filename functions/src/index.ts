import * as functions from 'firebase-functions/v1'
import * as admin from 'firebase-admin'

admin.initializeApp()

const db = admin.firestore()

const STRIPE_SECRET_KEY = functions.config().stripe?.secret_key || ''
const ZOOM_ACCOUNT_ID = functions.config().zoom?.account_id || ''
const ZOOM_CLIENT_ID = functions.config().zoom?.client_id || ''
const ZOOM_CLIENT_SECRET = functions.config().zoom?.client_secret || ''
const RESEND_API_KEY = functions.config().resend?.api_key || ''

interface SessionData {
  tutorId: string
  studentId?: string
  subject: string
  startTime: admin.firestore.Timestamp
  durationMinutes: number
  mode: 'online' | 'physical'
  meetingLink?: string
  price: number
  status: string
}

interface UserData {
  name: string
  email: string
  role: string
}

export const onSessionBooked = functions.firestore
  .document('sessions/{sessionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as SessionData
    const after = change.after.data() as SessionData

    if (before.status === 'open' && after.status === 'booked') {
      const { tutorId, studentId, subject, mode } = after

      if (!studentId) return

      const [tutorSnap, studentSnap] = await Promise.all([
        db.collection('users').doc(tutorId).get(),
        db.collection('users').doc(studentId).get(),
      ])

      const tutorData = tutorSnap.data() as UserData | undefined
      const studentData = studentSnap.data() as UserData | undefined

      if (!tutorData || !studentData) return

      let meetingLink = after.meetingLink || ''

      if (mode === 'online' && !meetingLink) {
        meetingLink = await generateZoomMeeting(after)
      }

      if (meetingLink) {
        await change.after.ref.update({ meetingLink })
      }

      await sendEmailNotifications(tutorData, studentData, after, meetingLink)
    }
  })

export const onSessionCompleted = functions.firestore
  .document('sessions/{sessionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as SessionData
    const after = change.after.data() as SessionData

    if (before.status === 'booked' && after.status === 'completed') {
      const { price, studentId, tutorId } = after

      if (STRIPE_SECRET_KEY) {
        try {
          const stripe = require('stripe')(STRIPE_SECRET_KEY)
          await stripe.transfers.create({
            amount: Math.round(price * 100),
            currency: 'usd',
            destination: tutorId,
          })

          await change.after.ref.update({
            paymentReleased: true,
            releasedAt: admin.firestore.FieldValue.serverTimestamp(),
          })
        } catch (error) {
          functions.logger.error('Stripe transfer failed:', error)
        }
      }
    }
  })

export const updateUserRating = functions.firestore
  .document('reviews/{reviewId}')
  .onCreate(async (snap, context) => {
    const reviewData = snap.data()
    const toUserId = reviewData.toUserId

    const reviewsSnap = await db
      .collection('reviews')
      .where('toUserId', '==', toUserId)
      .get()

    const ratings: number[] = []
    reviewsSnap.forEach((doc) => ratings.push(doc.data().rating))

    const average = ratings.reduce((a, b) => a + b, 0) / ratings.length

    await db.collection('users').doc(toUserId).update({
      averageRating: Math.round(average * 10) / 10,
    })
  })

async function generateZoomMeeting(session: SessionData): Promise<string> {
  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    functions.logger.warn('Zoom credentials not configured')
    return ''
  }

  try {
    const axios = require('axios')

    const tokenRes = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
      {},
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`,
        },
      }
    )

    const accessToken = tokenRes.data.access_token

    const meetingRes = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: `Tutoring Session: ${session.subject}`,
        type: 2,
        start_time: session.startTime.toDate().toISOString(),
        duration: session.durationMinutes,
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return meetingRes.data.join_url
  } catch (error) {
    functions.logger.error('Failed to create Zoom meeting:', error)
    return ''
  }
}

async function sendEmailNotifications(
  tutorData: UserData,
  studentData: UserData,
  session: SessionData,
  meetingLink: string
): Promise<void> {
  if (!RESEND_API_KEY) {
    functions.logger.warn('Resend API key not configured')
    return
  }

  try {
    const { Resend } = require('resend')
    const resend = new Resend(RESEND_API_KEY)

    const startTimeStr = session.startTime.toDate().toLocaleString()
    const durationStr = `${session.durationMinutes} minutes`

    await resend.emails.send({
      from: 'EduSupport <noreply@edusupport.app>',
      to: [tutorData.email, studentData.email],
      subject: `Session Booked: ${session.subject}`,
      html: `
        <h1>Session Confirmed</h1>
        <p>Your tutoring session has been booked.</p>
        <ul>
          <li><strong>Subject:</strong> ${session.subject}</li>
          <li><strong>Time:</strong> ${startTimeStr}</li>
          <li><strong>Duration:</strong> ${durationStr}</li>
          ${meetingLink ? `<li><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></li>` : ''}
        </ul>
      `,
    })
  } catch (error) {
    functions.logger.error('Failed to send email:', error)
  }
}
