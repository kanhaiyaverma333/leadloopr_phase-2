'use client';

import { motion } from 'framer-motion';
import DashboardKPIs from '@/components/dashboard/DashboardKPIs';
import FunnelChart from '@/components/dashboard/FunnelChart';
import LeadSourceChart from '@/components/dashboard/LeadSourceChart';

const Dashboard = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-background/50">
            {/* Main Content */}
            <main className="container py-8 space-y-8">
                {/* KPI Section */}
                <DashboardKPIs />

                {/* Analytics Section */}
                <div>
                    <FunnelChart />
                </div>

                {/* Bottom Section */}
                <div className="grid gap-6 lg:grid-cols-1">
                    <LeadSourceChart />
                </div>
            </main>

            {/* Ambient Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.03, 0.08, 0.03]
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.03, 0.08, 0.03]
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 3
                    }}
                    className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-3xl"
                />
            </div>
        </div>
    );
};

export default Dashboard;

