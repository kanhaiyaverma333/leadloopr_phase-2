'use client'

import { Button } from "@/components/ui/button"
import { Building2 } from "lucide-react"
import { useState } from "react"
import { OrganizationProfileModal } from "./OrganizationProfileModal"

export function OrganizationProfileButton() {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => setIsModalOpen(true)}
            >
                <Building2 className="h-4 w-4" />
                Organization Settings
            </Button>

            <OrganizationProfileModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
            />
        </>
    )
} 