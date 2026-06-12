'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  rating: number
  onRate?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  readOnly?: boolean
}

export function RatingStars({ rating, onRate, size = 'md', readOnly = false }: RatingStarsProps) {
  const [hovered, setHovered] = useState(0)

  const sizeMap = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          className={cn(
            'transition-colors',
            readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          )}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          onClick={() => onRate?.(star)}
        >
          <Star
            className={cn(
              sizeMap[size],
              'transition-colors',
              star <= (hovered || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/30'
            )}
          />
        </button>
      ))}
    </div>
  )
}
