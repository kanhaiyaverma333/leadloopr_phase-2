"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SelectOption {
    value: string
    label: string
}

interface SelectProps {
    value: string | undefined
    onValueChange: (value: string) => void
    options: SelectOption[]
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function Select({
    value,
    onValueChange,
    options,
    placeholder = "Select an option",
    className,
    disabled = false
}: SelectProps) {
    const selectedOption = options.find(option => option.value === (value || ''))

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={disabled}>
                <button
                    className={cn(
                        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        className
                    )}
                >
                    <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[8rem]">
                {options.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => onValueChange(option.value)}
                        className="cursor-pointer"
                    >
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
} 