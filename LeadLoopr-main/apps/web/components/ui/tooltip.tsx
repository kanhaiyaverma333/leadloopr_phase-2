"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
    children: React.ReactNode
}

interface TooltipTriggerProps {
    asChild?: boolean
    children: React.ReactNode
}

interface TooltipContentProps {
    children: React.ReactNode
    className?: string
}

const TooltipContext = React.createContext<{
    isOpen: boolean
    setIsOpen: (open: boolean) => void
}>({
    isOpen: false,
    setIsOpen: () => { },
})

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
    ({ children }, ref) => {
        const [isOpen, setIsOpen] = React.useState(false)

        return (
            <TooltipContext.Provider value={{ isOpen, setIsOpen }}>
                <div ref={ref} className="relative inline-block">
                    {children}
                </div>
            </TooltipContext.Provider>
        )
    }
)
Tooltip.displayName = "Tooltip"

const TooltipTrigger = React.forwardRef<HTMLDivElement, TooltipTriggerProps>(
    ({ asChild, children }, ref) => {
        const { setIsOpen } = React.useContext(TooltipContext)

        return (
            <div
                ref={ref}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                className="inline-block"
            >
                {children}
            </div>
        )
    }
)
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
    ({ children, className }, ref) => {
        const { isOpen } = React.useContext(TooltipContext)

        if (!isOpen) {
            return null
        }

        return (
            <div
                ref={ref}
                className={cn(
                    "absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full",
                    className
                )}
            >
                {children}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
        )
    }
)
TooltipContent.displayName = "TooltipContent"

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } 