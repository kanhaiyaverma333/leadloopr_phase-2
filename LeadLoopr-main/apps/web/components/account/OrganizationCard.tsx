'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, Settings, Shield } from "lucide-react"
import { useState } from "react"
import { useOrganization } from "@clerk/nextjs"
import { OrganizationProfileModal } from "./OrganizationProfileModal"

export function OrganizationCard() {
    const { organization } = useOrganization()
    const [isModalOpen, setIsModalOpen] = useState(false)

    if (!organization) {
        return null
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">{organization.name}</CardTitle>
                                <CardDescription>Organization management and settings</CardDescription>
                            </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                            Active
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Members</p>
                                    <p className="text-xs text-muted-foreground">Manage team access</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Security</p>
                                    <p className="text-xs text-muted-foreground">Domain verification</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button
                                className="flex-1"
                                variant="outline"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                Manage Organization
                            </Button>
                            <Button
                                className="flex-1"
                                variant="outline"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <Users className="h-4 w-4 mr-2" />
                                View Members
                            </Button>
                        </div>

                        {/* Quick Info */}
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>• Organization ID: {organization.id}</p>
                            <p>• Created: {new Date(organization.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <OrganizationProfileModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
            />
        </>
    )
} 