'use client'

import { useEffect, useState } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore'
import { ref, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { Resource } from '@/types'
import { useAuthContext } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Search, Download, FileText, Upload, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

const SUBJECTS = [
  'All Subjects',
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

export default function ResourcesPage() {
  const { user, userData } = useAuthContext()
  const router = useRouter()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')

  useEffect(() => {
    let constraints: any[] = [orderBy('createdAt', 'desc')]

    if (subjectFilter !== 'All Subjects') {
      constraints.unshift(where('subject', '==', subjectFilter))
    }

    const q = query(collection(db, 'resources'), ...constraints)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Resource[]
      setResources(results)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [subjectFilter])

  const filtered = searchQuery
    ? resources.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.subject.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : resources

  const handleDownload = async (resource: Resource) => {
    try {
      const storageRef = ref(storage, resource.fileUrl)
      const url = await getDownloadURL(storageRef)

      const link = document.createElement('a')
      link.href = url
      link.download = resource.title
      link.click()

      await updateDoc(doc(db, 'resources', resource.id!), {
        downloadCount: increment(1),
      })

      toast.success('Download started')
    } catch {
      toast.error('Failed to download file')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Resource Library</h1>
          <p className="text-muted-foreground mt-1">Browse exam materials and study resources</p>
        </div>
        {userData?.role === 'tutor' && (
          <Button onClick={() => router.push('/upload-resource')}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Resource
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECTS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading resources...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">No resources found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((resource) => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{resource.subject}</Badge>
                  <Badge variant="outline">{resource.fileType}</Badge>
                </div>
                <CardTitle className="text-lg mt-2">{resource.title}</CardTitle>
                <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Grade: {resource.gradeLevel}</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {resource.downloadCount} downloads
                </span>
                <Button size="sm" onClick={() => handleDownload(resource)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
