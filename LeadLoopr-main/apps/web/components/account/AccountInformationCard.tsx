'use client'

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit3, LogOut, Mail, Save, X } from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { toast } from "sonner";
import { ThemeSwitcher } from "./ThemeSwitcher";

interface User {
    id: string;
    clerkId: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    imageUrl?: string | null;
    currentOrganization?: {
        id: string;
        name: string;
        website?: string | null;
    } | null;
}

interface AccountInformationCardProps {
    user: User;
}

export function AccountInformationCard({ user }: AccountInformationCardProps) {
    const { user: clerkUser } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [userInfo, setUserInfo] = useState({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        organization: user.currentOrganization?.name || 'LeadLoopr',
    });

    const handleEditProfile = () => {
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!clerkUser) return;

        setIsLoading(true);
        try {
            await clerkUser.update({
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
            });

            setIsEditing(false);
            toast.success('Profile updated successfully. Changes will be reflected shortly.');

        } catch (error) {
            console.error("Error updating profile via Clerk:", error);
            toast.error("Failed to update profile. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setUserInfo({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email,
            organization: user.currentOrganization?.name || 'LeadLoopr',
        });
        setIsEditing(false);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .filter(Boolean)
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarImage
                                    src={clerkUser?.imageUrl || user.imageUrl || undefined}
                                    alt={`${userInfo.firstName} ${userInfo.lastName}`}
                                />
                                <AvatarFallback className="text-white text-xl font-bold bg-gradient-primary">
                                    {getInitials(`${userInfo.firstName} ${userInfo.lastName}`)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-2xl">
                                    {userInfo.firstName && userInfo.lastName
                                        ? `${userInfo.firstName} ${userInfo.lastName}`
                                        : 'Complete Your Profile'
                                    }
                                </CardTitle>
                                <p className="text-base text-muted-foreground">Account Owner</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            {!isEditing ? (
                                <>
                                    <Button variant="outline" className="glass" onClick={handleEditProfile}>
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                    <SignOutButton>
                                        <Button variant="outline" className="glass text-red-600 border-red-200 hover:text-red-700 hover:border-red-300 hover:bg-red-50">
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Sign Out
                                        </Button>
                                    </SignOutButton>
                                    <div className="pt-2">
                                        <ThemeSwitcher />
                                    </div>
                                </>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={isLoading}
                                        className="bg-gradient-primary hover:opacity-90"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Save
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCancel}
                                        disabled={isLoading}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Email - Read Only */}
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Email</p>
                                <p className="text-muted-foreground">{userInfo.email}</p>
                            </div>
                        </div>

                        {/* Editable Name Fields - Only show when editing */}
                        {isEditing && (
                            <div className="space-y-4 pt-4 border-t">
                                <div>
                                    <Label className="text-sm text-muted-foreground">First name</Label>
                                    <Input
                                        value={userInfo.firstName}
                                        onChange={(e) => setUserInfo(prev => ({ ...prev, firstName: e.target.value }))}
                                        className="mt-2"
                                        placeholder="Enter your first name"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">Last name</Label>
                                    <Input
                                        value={userInfo.lastName}
                                        onChange={(e) => setUserInfo(prev => ({ ...prev, lastName: e.target.value }))}
                                        className="mt-2"
                                        placeholder="Enter your last name"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
} 