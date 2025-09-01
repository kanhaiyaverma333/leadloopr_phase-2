"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface MetricCardProps {
    title: string;
    value: string;
    change: string;
    isPositive: boolean;
    color: "blue" | "orange";
}

const MetricCard = ({ title, value, change, isPositive, color }: MetricCardProps) => {
    const bgColor = color === "blue" ? "#007AFF" : "#F59E0B";

    return (
        <Card
            className="text-white shadow-sm"
            style={{ backgroundColor: bgColor }}
        >
            <CardHeader>
                <CardDescription className="text-white/80 text-sm font-medium">
                    {title}
                </CardDescription>
                <CardTitle className="text-3xl font-bold text-white">
                    {value}
                </CardTitle>
                <CardAction>
                    <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
                        {isPositive ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {change}
                    </Badge>
                </CardAction>
            </CardHeader>
        </Card>
    );
};

export default MetricCard; 