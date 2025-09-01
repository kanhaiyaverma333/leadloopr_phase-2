'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Mail } from "lucide-react"

interface InviteMemberModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const roleOptions = [
    { value: "org:member", label: "Member" },
    { value: "org:admin", label: "Admin" },
    { value: "org:guest", label: "Guest" },
]

export function InviteMemberModal({ open, onOpenChange }: InviteMemberModalProps) {
    const [email, setEmail] = useState("")
    const [role, setRole] = useState("org:member")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email.trim()) {
            toast.error("Please enter an email address")
            return
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            toast.error("Please enter a valid email address")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/organization/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailAddress: email.trim(),
                    role: role,
                }),
            })

            const data = await response.json()

            if (response.ok && data.success) {
                toast.success(`Invitation sent to ${email}`)
                setEmail("")
                setRole("org:member")
                onOpenChange(false)
            } else {
                toast.error(data.error || "Failed to send invitation")
            }
        } catch (error) {
            console.error('Error sending invitation:', error)
            toast.error("Failed to send invitation. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        setEmail("")
        setRole("org:member")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Invite Team Member
                    </DialogTitle>
                    <DialogDescription>
                        Send an invitation to join your organization. They will receive an email with instructions to accept the invitation.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="colleague@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            value={role}
                            onValueChange={setRole}
                            options={roleOptions}
                            placeholder="Select a role"
                            disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Members can access all features. Admins can manage team members and settings.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Invitation
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
} 