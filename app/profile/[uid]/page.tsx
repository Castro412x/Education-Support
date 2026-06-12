'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc, updateDoc, GeoPoint } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuthContext } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User as UserType } from '@/types'
import { Camera, Save, Star } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage({ params }: { params: { uid: string } }) {
  const { user, userData: currentUser } = useAuthContext()
  const router = useRouter()
  const [profile, setProfile] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    subjects: '',
    hourlyRate: '',
    bio: '',
  })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const isOwnProfile = user?.uid === params.uid

  useEffect(() => {
    const fetchProfile = async () => {
      const docSnap = await getDoc(doc(db, 'users', params.uid))
      if (docSnap.exists()) {
        const data = { uid: docSnap.id, ...docSnap.data() } as UserType
        setProfile(data)
        setForm({
          name: data.name || '',
          subjects: data.subjects?.join(', ') || '',
          hourlyRate: data.hourlyRate?.toString() || '',
          bio: '',
        })
      }
      setLoading(false)
    }
    fetchProfile()
  }, [params.uid])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 20MB.')
      return
    }

    setUploadingPhoto(true)
    try {
      const storageRef = ref(storage, `profile-pictures/${user.uid}/${file.name}`)
      const task = await uploadBytesResumable(storageRef, file)
      const url = await getDownloadURL(task.ref)
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url })
      toast.success('Profile photo updated')
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    if (!user || !profile) return
    setSaving(true)
    try {
      const updates: Record<string, any> = {
        name: form.name,
      }
      if (profile.role === 'tutor') {
        updates.subjects = form.subjects.split(',').map((s) => s.trim()).filter(Boolean)
        updates.hourlyRate = parseFloat(form.hourlyRate) || 0
      }
      await updateDoc(doc(db, 'users', user.uid), updates)
      setProfile((prev) => prev ? { ...prev, ...updates } : null)
      toast.success('Profile updated')
      setEditing(false)
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Profile not found.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="relative inline-block">
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarImage src={profile.photoURL || undefined} />
              <AvatarFallback className="text-2xl">
                {profile.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 cursor-pointer bg-primary text-primary-foreground rounded-full p-1.5 shadow">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />
              </label>
            )}
          </div>
          <CardTitle className="mt-4">{profile.name}</CardTitle>
          <CardDescription>{profile.email}</CardDescription>
          <Badge variant={profile.role === 'tutor' ? 'default' : 'secondary'} className="mt-2">
            {profile.role === 'tutor' ? 'Tutor' : 'Student'}
          </Badge>
          {profile.averageRating && profile.averageRating > 0 && (
            <div className="flex items-center justify-center gap-1 mt-2 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{profile.averageRating.toFixed(1)}</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isOwnProfile && editing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              {profile.role === 'tutor' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="subjects">Subjects (comma separated)</Label>
                    <Input
                      id="subjects"
                      value={form.subjects}
                      onChange={(e) => setForm({ ...form, subjects: e.target.value })}
                      placeholder="Math, Physics, Chemistry"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate">Hourly Rate ($)</Label>
                    <Input
                      id="rate"
                      type="number"
                      value={form.hourlyRate}
                      onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {profile.role === 'tutor' && (
                <>
                  {profile.subjects && profile.subjects.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Subjects</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {profile.subjects.map((subject) => (
                          <Badge key={subject} variant="secondary">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.hourlyRate && profile.hourlyRate > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Hourly Rate</Label>
                      <p className="text-lg font-semibold">${profile.hourlyRate}/hr</p>
                    </div>
                  )}
                </>
              )}
              {isOwnProfile && (
                <Button onClick={() => setEditing(true)}>Edit Profile</Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
