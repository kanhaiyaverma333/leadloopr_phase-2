'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Share, Save, X, LogOut, Trash2 } from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { toast } from "sonner";

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

interface AccountFormProps {
    user: User;
}

export function AccountForm({ user }: AccountFormProps) {
    const { user: clerkUser } = useUser();

    const [isEditing, setIsEditing] = useState({
        firstName: false,
        lastName: false,
        company: false,
    });

    const [userInfo, setUserInfo] = useState({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        company: user.currentOrganization?.name || 'Not specified',
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleEdit = (field: keyof typeof isEditing) => {
        setIsEditing(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSave = async (field: 'firstName' | 'lastName', value: string) => {
        if (!clerkUser) return;

        setIsLoading(true);
        try {
            let updateData = {};
            if (field === 'firstName') {
                updateData = { firstName: value };
            } else {
                updateData = { lastName: value };
            }

            await clerkUser.update(updateData);

            setUserInfo(prev => ({ ...prev, [field]: value }));
            setIsEditing(prev => ({ ...prev, [field]: false }));
            toast.success(`${field === 'firstName' ? 'First name' : 'Last name'} updated successfully. Changes will be reflected shortly.`);

        } catch (error) {
            console.error("Error updating profile via Clerk:", error);
            toast.error("Failed to update profile. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = (field: keyof typeof isEditing) => {
        setIsEditing(prev => ({ ...prev, [field]: false }));
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
        <div className="space-y-6">
            {/* User Information Card */}
            <Card className="border border-border">
                <CardHeader>
                    {/* Avatar */}
                    <div className="flex justify-start">
                        <Avatar className="w-24 h-24">
                            <AvatarImage
                                src={clerkUser?.imageUrl || user.imageUrl || undefined}
                                alt="Profile"
                            />
                            <AvatarFallback className="text-4xl font-medium bg-pink-600 text-white">
                                {getInitials(`${userInfo.firstName} ${userInfo.lastName}`)}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-6">
                    {/* First Name */}
                    <div className="flex justify-between items-center">
                        <div className="flex-1">
                            <label className="text-sm text-muted-foreground mb-1 block">First name</label>
                            {isEditing.firstName ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={userInfo.firstName}
                                        onChange={(e) => setUserInfo(prev => ({ ...prev, firstName: e.target.value }))}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSave('firstName', userInfo.firstName);
                                            else if (e.key === 'Escape') handleCancel('firstName');
                                        }}
                                        autoFocus
                                        className="max-w-xs"
                                        disabled={isLoading}
                                    />
                                    <Button size="sm" onClick={() => handleSave('firstName', userInfo.firstName)} disabled={isLoading}><Save className="w-4 h-4" /></Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleCancel('firstName')} disabled={isLoading}><X className="w-4 h-4" /></Button>
                                </div>
                            ) : (
                                <p className="text-foreground">{userInfo.firstName || 'Not specified'}</p>
                            )}
                        </div>
                        {!isEditing.firstName && (
                            <Button variant="ghost" size="sm" onClick={() => handleEdit('firstName')} className="text-blue-600 hover:text-blue-700">Edit</Button>
                        )}
                    </div>

                    {/* Last Name */}
                    <div className="flex justify-between items-center">
                        <div className="flex-1">
                            <label className="text-sm text-muted-foreground mb-1 block">Last name</label>
                            {isEditing.lastName ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={userInfo.lastName}
                                        onChange={(e) => setUserInfo(prev => ({ ...prev, lastName: e.target.value }))}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSave('lastName', userInfo.lastName);
                                            else if (e.key === 'Escape') handleCancel('lastName');
                                        }}
                                        autoFocus
                                        className="max-w-xs"
                                        disabled={isLoading}
                                    />
                                    <Button size="sm" onClick={() => handleSave('lastName', userInfo.lastName)} disabled={isLoading}><Save className="w-4 h-4" /></Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleCancel('lastName')} disabled={isLoading}><X className="w-4 h-4" /></Button>
                                </div>
                            ) : (
                                <p className="text-foreground">{userInfo.lastName || 'Not specified'}</p>
                            )}
                        </div>
                        {!isEditing.lastName && (
                            <Button variant="ghost" size="sm" onClick={() => handleEdit('lastName')} className="text-blue-600 hover:text-blue-700">Edit</Button>
                        )}
                    </div>

                    {/* Email */}
                    <div className="flex justify-between items-center">
                        <div className="flex-1">
                            <label className="text-sm text-muted-foreground mb-1 block">Email</label>
                            <p className="text-foreground">{userInfo.email}</p>
                        </div>
                    </div>

                    {/* Company/Organization */}
                    <div className="flex justify-between items-center">
                        <div className="flex-1">
                            <label className="text-sm text-muted-foreground mb-1 block">Organization</label>
                            <p className="text-foreground">{userInfo.company}</p>
                            {user.currentOrganization?.website && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Website: {user.currentOrganization.website}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <SignOutButton>
                        <Button variant="outline">
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </SignOutButton>
                </CardFooter>
            </Card>
        </div>
    );
} 