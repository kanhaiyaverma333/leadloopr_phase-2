'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const teamMembers = [
    {
        name: "Sofia Davis",
        email: "sofia.davis@example.com",
        role: "Owner",
        initials: "SD",
    },
    {
        name: "Jackson Lee",
        email: "jackson.lee@example.com",
        role: "Member",
        initials: "JL",
    },
    {
        name: "Ava Garcia",
        email: "ava.garcia@example.com",
        role: "Member",
        initials: "AG",
    }
];

export function TeamMembersForm() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                    Manage who has access to this organization.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">3 of 5 members</p>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Member
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {teamMembers.map((member) => (
                            <div key={member.email} className="flex items-center justify-between space-x-4">
                                <div className="flex items-center space-x-4">
                                    <Avatar>
                                        <AvatarFallback>{member.initials}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium leading-none">{member.name}</p>
                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                    </div>
                                </div>
                                <div>
                                    {member.role === 'Owner' ? (
                                        <span className="text-sm font-medium text-muted-foreground">{member.role}</span>
                                    ) : (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="text-sm font-medium">{member.role}</Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem>Owner</DropdownMenuItem>
                                                <DropdownMenuItem>Member</DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600">Remove</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 