"use client";

import { BarChart, Bar, ResponsiveContainer } from "recharts";

const trafficData = [
    { name: "Meta", value: 45 },
    { name: "Google", value: 75 },
    { name: "Organic", value: 55 },
    { name: "LinkedIn", value: 85 },
    { name: "Other", value: 35 },
];

const adSpendData = [
    { name: "US", value: 65 },
    { name: "Canada", value: 45 },
    { name: "Mexico", value: 30 },
    { name: "China", value: 55 },
    { name: "Japan", value: 40 },
    { name: "Australia", value: 50 },
];

const TrafficSource = () => {
    return (
        <div className="space-y-6">
            <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Traffic source</h3>
                <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trafficData}>
                            <Bar
                                dataKey="value"
                                fill="#e5e7eb"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-between items-center mt-2">
                    {trafficData.map((item) => (
                        <div key={item.name} className="text-center">
                            <p className="text-xs text-muted-foreground">{item.name}</p>
                        </div>
                    ))}
                </div>
                {/* Highlight LinkedIn with special styling */}
                <div className="relative">
                    <div className="absolute top-[-60px] left-[68%] bg-blue-600 text-white px-2 py-1 rounded text-xs">
                        24.3K
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4 text-green-600">Ad spend per source</h3>
                <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={adSpendData}>
                            <Bar
                                dataKey="value"
                                fill="#e5e7eb"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-between items-center mt-2">
                    {adSpendData.map((item) => (
                        <div key={item.name} className="text-center">
                            <p className="text-xs text-muted-foreground">{item.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrafficSource; 