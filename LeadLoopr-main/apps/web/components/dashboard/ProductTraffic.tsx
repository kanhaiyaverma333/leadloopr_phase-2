"use client";

import { useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";

const productData = [
    { month: "Jan", all: 45, snowUl: 35, dashboard: 25 },
    { month: "Feb", all: 55, snowUl: 42, dashboard: 30 },
    { month: "Mar", all: 40, snowUl: 38, dashboard: 28 },
    { month: "Apr", all: 65, snowUl: 48, dashboard: 35 },
    { month: "May", all: 75, snowUl: 55, dashboard: 40 },
    { month: "Jun", all: 50, snowUl: 45, dashboard: 32 },
    { month: "Jul", all: 70, snowUl: 52, dashboard: 38 },
    { month: "Aug", all: 60, snowUl: 47, dashboard: 34 },
    { month: "Sep", all: 80, snowUl: 58, dashboard: 42 },
    { month: "Oct", all: 55, snowUl: 43, dashboard: 31 },
    { month: "Nov", all: 65, snowUl: 49, dashboard: 36 },
    { month: "Dec", all: 70, snowUl: 53, dashboard: 39 },
];

const ProductTraffic = () => {
    const [activeViews, setActiveViews] = useState({
        all: true,
        snowUl: true,
        dashboard: true,
    });

    const toggleView = (view: keyof typeof activeViews) => {
        setActiveViews(prev => ({
            ...prev,
            [view]: !prev[view]
        }));
    };

    return (
        <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-red-600">Product Traffic</h3>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4">
                        {Object.entries(activeViews).map(([key, isActive]) => (
                            <button
                                key={key}
                                onClick={() => toggleView(key as keyof typeof activeViews)}
                                className={`flex items-center gap-2 text-sm transition-colors ${isActive ? "text-foreground" : "text-muted-foreground"
                                    }`}
                            >
                                <div className={`w-3 h-3 rounded-full ${key === "all" ? "bg-blue-500" :
                                    key === "snowUl" ? "bg-green-500" : "bg-red-500"
                                    }`} />
                                {key === "all" ? "All" : key === "snowUl" ? "SnowUI" : "Dashboard"}
                            </button>
                        ))}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8">
                        ...
                    </Button>
                </div>
            </div>

            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={productData}>
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            className="text-xs text-muted-foreground"
                        />
                        <YAxis hide />
                        {activeViews.all && (
                            <Bar
                                dataKey="all"
                                fill="#3b82f6"
                                opacity={0.8}
                                radius={[2, 2, 0, 0]}
                            />
                        )}
                        {activeViews.snowUl && (
                            <Bar
                                dataKey="snowUl"
                                fill="#22c55e"
                                opacity={0.8}
                                radius={[2, 2, 0, 0]}
                            />
                        )}
                        {activeViews.dashboard && (
                            <Bar
                                dataKey="dashboard"
                                fill="#ef4444"
                                opacity={0.8}
                                radius={[2, 2, 0, 0]}
                            />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ProductTraffic; 