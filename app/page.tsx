'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, Search, Users, FileText } from 'lucide-react'

export default function Home() {
  return (
    <div className="container mx-auto px-4">
      <section className="py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Your Education
          <span className="text-primary"> Support Hub</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Connect with expert tutors, book personalized sessions, and access a library of exam resources to ace your studies.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/browse-sessions">
            <Button size="lg" variant="outline">
              Browse Sessions
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <Search className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Find the Right Tutor</h3>
            <p className="text-muted-foreground">
              Search by subject, price, or location. Filter through available sessions to find your perfect match.
            </p>
          </div>
          <div className="text-center p-6">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Book with Confidence</h3>
            <p className="text-muted-foreground">
              Secure booking with real-time availability. Automatic meeting links for online sessions.
            </p>
          </div>
          <div className="text-center p-6">
            <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Exam Resources</h3>
            <p className="text-muted-foreground">
              Access practice tests, PDFs, and video materials uploaded by expert tutors.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
