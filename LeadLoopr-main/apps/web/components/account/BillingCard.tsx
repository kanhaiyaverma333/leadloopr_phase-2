'use client'

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit3, Download, CreditCard, Crown } from "lucide-react";

const billingHistory = [
    { period: "Apr 15, 2025 to May 15, 2025", amount: "$410.25", status: "Paid" },
    { period: "Mar 15, 2025 to Apr 15, 2025", amount: "$380.72", status: "Paid" },
    { period: "Feb 15, 2025 to Mar 15, 2025", amount: "$264.43", status: "Paid" },
    { period: "Jan 15, 2025 to Feb 15, 2025", amount: "$49", status: "Paid" },
    { period: "Dec 15, 2024 to Jan 15, 2025", amount: "$49", status: "Paid" },
    { period: "Nov 15, 2024 to Dec 15, 2024", amount: "$49", status: "Paid" },
    { period: "Oct 15, 2024 to Nov 15, 2024", amount: "$49", status: "Paid" },
];

export function BillingCard() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <Card className="glass-card h-fit">
                <CardHeader>
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Billing & Subscription
                        </CardTitle>
                        <CardDescription>
                            Manage your billing and subscription details
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Current Plan */}
                    <div className="p-4 rounded-lg border border-primary/20 bg-gradient-primary/5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Crown className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold">Pro Plan</h3>
                            </div>
                            <Badge className="bg-gradient-primary text-primary-foreground">
                                Active
                            </Badge>
                        </div>
                        <p className="text-2xl font-bold mb-1">$29/month</p>
                        <p className="text-sm text-muted-foreground">
                            Billed monthly • Next billing: April 15, 2024
                        </p>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <h4 className="font-medium mb-3">Payment Method</h4>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 glass">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-12 bg-gradient-primary rounded flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary-foreground">VISA</span>
                                </div>
                                <div>
                                    <p className="font-medium">•••• •••• •••• 4242</p>
                                    <p className="text-sm text-muted-foreground">Expires 12/26</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="glass">
                                Update
                            </Button>
                        </div>
                    </div>

                    {/* Billing Actions */}
                    <div className="space-y-2">
                        <Button variant="outline" className="w-full glass justify-start">
                            View Billing History
                        </Button>
                        <Button variant="outline" className="w-full glass justify-start">
                            Change Plan
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
} 