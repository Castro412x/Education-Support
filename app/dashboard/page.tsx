'use client'

import { useAuthContext } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { BookOpen, FileText, Plus, Clock, Calendar } from 'lucide-react'

export default function DashboardPage() {
  const { user, userData, loading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user || !userData) return null

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
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
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
          <Button onClick={() => router.push('/browse-sessions')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Session
          </Button>
          <Button variant="outline" onClick={() => router.push('/upload-resource')}>
            <BookOpen className="mr-2 h-4 w-4" />
            Upload Resource
          </Button>
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
