'use client'

import { cn } from "@/lib/utils"

interface LoadingDotsProps {
    className?: string
}

export function LoadingDots({ className }: LoadingDotsProps) {
    return (
        <span className={cn("space-x-1 animate-pulse", className)}>
            <span className="inline-block w-1 h-1 bg-current rounded-full" />
            <span className="inline-block w-1 h-1 bg-current rounded-full" />
            <span className="inline-block w-1 h-1 bg-current rounded-full" />
        </span>
    )
} 