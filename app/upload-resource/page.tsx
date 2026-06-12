'use client'

import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuthContext } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'History',
  'Computer Science',
  'Economics',
  'Other',
]

export default function UploadResourcePage() {
  const { user, userData, loading: authLoading } = useAuthContext()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    gradeLevel: '',
    fileType: 'pdf' as 'pdf' | 'video' | 'document',
  })
  const [file, setFile] = useState<File | null>(null)

  if (authLoading) return null
  if (!user || userData?.role !== 'tutor') {
    router.push('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !file) return

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 20MB.')
      return
    }

    setSaving(true)
    try {
      const fileRef = ref(storage, `resources/${user.uid}/${Date.now()}_${file.name}`)
      const taskSnapshot = await uploadBytesResumable(fileRef, file)

      const fileUrl = taskSnapshot.ref.fullPath

      await addDoc(collection(db, 'resources'), {
        title: form.title,
        description: form.description,
        subject: form.subject,
        gradeLevel: form.gradeLevel,
        fileUrl,
        fileType: form.fileType,
        uploadedBy: user.uid,
        downloadCount: 0,
        createdAt: serverTimestamp(),
      })

      toast.success('Resource uploaded successfully!')
      router.push('/resources')
    } catch {
      toast.error('Failed to upload resource')
    } finally {
      setSaving(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Upload Resource</CardTitle>
          <CardDescription>Share exam materials with students</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Algebra Practice Test"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the resource"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grade Level</Label>
              <Input
                id="grade"
                value={form.gradeLevel}
                onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                placeholder='e.g., 10th, College'
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileType">File Type</Label>
              <Select
                value={form.fileType}
                onValueChange={(v: 'pdf' | 'video' | 'document') => setForm({ ...form, fileType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">File (max 20MB)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx,.mp4,.mov,.png,.jpg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            {uploadProgress > 0 && (
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={saving || !file}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Resource
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
