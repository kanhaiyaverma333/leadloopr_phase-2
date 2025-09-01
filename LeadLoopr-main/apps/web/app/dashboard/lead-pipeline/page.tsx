import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'

export default async function LeadPipelinePage() {
    const { userId } = await auth()

    if (!userId) {
        redirect('/auth/sign-in')
    }

    return <KanbanBoard />
} 