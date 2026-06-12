'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="container mx-auto px-4 py-8 flex items-center justify-center">
            <Card className="max-w-md text-center">
              <CardHeader>
                <CardTitle>Something went wrong</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                <Button
                  onClick={() => {
                    this.setState({ hasError: false })
                    window.location.reload()
                  }}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      )
    }

    return this.props.children
  }
}
