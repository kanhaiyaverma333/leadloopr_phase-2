'use client'

import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeSwitcher() {
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme } = useTheme()

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme('light')}
                className={`glass ${theme === 'light' ? 'bg-accent text-accent-foreground' : ''}`}
                title="Light theme"
            >
                <Sun className="h-4 w-4" />
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme('dark')}
                className={`glass ${theme === 'dark' ? 'bg-accent text-accent-foreground' : ''}`}
                title="Dark theme"
            >
                <Moon className="h-4 w-4" />
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme('system')}
                className={`glass ${theme === 'system' ? 'bg-accent text-accent-foreground' : ''}`}
                title="System theme"
            >
                <Monitor className="h-4 w-4" />
            </Button>
        </div>
    )
}
