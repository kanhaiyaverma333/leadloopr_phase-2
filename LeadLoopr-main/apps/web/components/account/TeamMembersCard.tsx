'use client'

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Users } from "lucide-react";
import { InviteMemberModal } from "./InviteMemberModal";

interface TeamMember {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
    initials: string;
    imageUrl?: string | null;
}

export function TeamMembersCard() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/organization/members');
            if (!response.ok) {
                throw new Error('Failed to fetch members');
            }
            const data = await response.json();
            if (data.success) {
                setMembers(data.members);
            } else {
                throw new Error(data.error || 'Failed to fetch members');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch members');
            console.error('Error fetching members:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <Card className="glass-card h-fit">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Team Members
                                </CardTitle>
                                <CardDescription>
                                    Manage your team and their permissions
                                </CardDescription>
                            </div>
                            <Button className="bg-gradient-primary hover:opacity-90 glow" disabled>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Member
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="animate-pulse">
                                <div className="h-4 bg-muted rounded w-24 mb-4"></div>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg glass">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-muted rounded-full"></div>
                                            <div>
                                                <div className="h-4 bg-muted rounded w-32 mb-1"></div>
                                                <div className="h-3 bg-muted rounded w-40"></div>
                                            </div>
                                        </div>
                                        <div className="h-6 bg-muted rounded w-16"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <Card className="glass-card h-fit">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Team Members
                                </CardTitle>
                                <CardDescription>
                                    Manage your team and their permissions
                                </CardDescription>
                            </div>
                            <Button className="bg-gradient-primary hover:opacity-90 glow">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Member
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <p className="text-destructive mb-4">Failed to load team members</p>
                            <Button
                                variant="outline"
                                onClick={() => window.location.reload()}
                            >
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <Card className="glass-card h-fit">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Team Members
                                </CardTitle>
                                <CardDescription>
                                    Manage your team and their permissions
                                </CardDescription>
                            </div>
                            <Button
                                className="bg-gradient-primary hover:opacity-90 glow"
                                onClick={() => setIsInviteModalOpen(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Member
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {members.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No team members found</p>
                                    <Button
                                        variant="outline"
                                        className="mt-4 glass"
                                        onClick={() => setIsInviteModalOpen(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Invite your first member
                                    </Button>
                                </div>
                            ) : (
                                members.map((member, index) => (
                                    <motion.div
                                        key={member.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                        className="flex items-center justify-between p-4 rounded-lg border border-border/50 glass"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage
                                                    src={member.imageUrl || undefined}
                                                    alt={member.name}
                                                />
                                                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                                                    {member.initials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{member.name}</p>
                                                <p className="text-sm text-muted-foreground">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={member.role === 'Admin' ? 'default' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {member.role}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                Active
                                            </Badge>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <InviteMemberModal
                open={isInviteModalOpen}
                onOpenChange={setIsInviteModalOpen}
            />
        </>
    );
} 