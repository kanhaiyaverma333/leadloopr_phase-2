"use client"

import * as React from "react"
import { Bar, BarChart, Line, LineChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { cn } from "@/lib/utils"

export interface ChartConfig {
    [key: string]: {
        label: string
        color: string
    }
}

export interface ChartProps {
    config: ChartConfig
    className?: string
    children?: React.ReactNode
}

export function ChartContainer({ config, className, children }: ChartProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {children}
        </div>
    )
}

export function ChartTooltip({ children }: { children: React.ReactNode }) {
    return <Tooltip content={children as any} />
}

export function ChartTooltipContent({
    active,
    payload,
    label,
    nameKey = "value",
    labelFormatter,
}: {
    active?: boolean
    payload?: any[]
    label?: string
    nameKey?: string
    labelFormatter?: (value: string) => string
}) {
    if (!active || !payload) {
        return null
    }

    return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
            <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                        {labelFormatter ? labelFormatter(label || "") : label}
                    </span>
                    {payload.map((item: any, index: number) => (
                        <span key={index} className="font-bold text-muted-foreground">
                            {item[nameKey]}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
} 