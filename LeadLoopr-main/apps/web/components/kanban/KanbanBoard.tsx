'use client'

import React, { useState, useEffect } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { LeadDetailDialog } from './LeadDetailDialog';
import { AddLeadDialog } from './AddLeadDialog';
import { Button } from '@/components/ui/button';
import { Download, Plus, RefreshCw } from 'lucide-react';
import { Card, Column, cardToDatabaseLead, databaseLeadToCard } from './types';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { pipeline } from 'stream';

interface PipelineStage {
    id: string;
    name: string;
    position: number;
    color?: string;
}

const getStageColor = (index: number): string => {
    const colors = [
        'bg-blue-500',    // 007AFF - Blue
        'bg-amber-500',   // F59E0B - Amber
        'bg-green-500',   // 34C759 - Green
        'bg-indigo-500',  // 6366F1 - Indigo (blue variant)
        'bg-orange-500',  // F97316 - Orange (amber variant)
        'bg-emerald-500', // 10B981 - Emerald (green variant)
        'bg-sky-500',     // 0EA5E9 - Sky (light blue)
        'bg-yellow-500',  // EAB308 - Yellow (light amber)
        'bg-teal-500'     // 14B8A6 - Teal (blue-green)
    ];
    return colors[index % colors.length];
};

export const KanbanBoard: React.FC = () => {
    const [columns, setColumns] = useState<Column[]>([]);
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false); // New state for refresh loading
    const [error, setError] = useState<string | null>(null);
    const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);
    const [selectedStageId, setSelectedStageId] = useState<string>('');
    const [selectedStageName, setSelectedStageName] = useState<string>('');
    const [activeCard, setActiveCard] = useState<Card | null>(null);

    // Configure sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Fetch stages from API
    const fetchStages = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch both stages and leads in parallel
            const [stagesResponse, leadsResponse] = await Promise.all([
                fetch('/api/pipeline-stages'),
                fetch('/api/leads')
            ]);

            if (stagesResponse.ok && leadsResponse.ok) {
                const stagesData = await stagesResponse.json();
                const leadsData = await leadsResponse.json();

                if (stagesData.success && leadsData.success) {
                    const stages: PipelineStage[] = stagesData.stages;
                    const leads = leadsData.leads;

                    // Convert stages to columns using colors from database
                    const newColumns: Column[] = stages.map((stage) => {
                        // Filter leads for this stage
                        const stageLeads = leads.filter((lead: any) => lead.currentStageId === stage.id);

                        // Convert database leads to UI cards
                        const cards: Card[] = stageLeads.map((lead: any) => databaseLeadToCard(lead));

                        return {
                            id: stage.id,
                            title: stage.name,
                            color: stage.color || getStageColor(stage.position), // Fallback to generated color if not in DB
                            cards: cards
                        };
                    });

                    setColumns(newColumns);
                } else {
                    setError('Failed to load pipeline data');
                }
            } else {
                setError('Failed to load pipeline data');
            }
        } catch (error) {
            console.error('Error fetching pipeline data:', error);
            setError('Failed to load pipeline data');
        } finally {
            setIsLoading(false);
        }
    };


    //     const fetchStages = async () => {
    //     try {
    //         setIsLoading(true);
    //         setError(null);

    //         // 🔧 Simulated dummy response data
    //         const dummyStages: PipelineStage[] = [
    //             // { id: "stage_open", name: "Open", position: 0, color: "bg-gray-400" },
    //             { id: "stage_qualified", name: "Qualified", position: 1, color: "bg-yellow-500" },
    //             { id: "stage_won", name: "Won", position: 2, color: "bg-green-500" },
    //             { id: "stage_lost", name: "Lost", position: 3, color: "bg-red-500" },
    //        ]

    //         const qualifications = ['QUALIFIED', 'UNQUALIFIED', 'NEEDS_REVIEW'];
    //         const priorities = ['LOW', 'MEDIUM', 'HIGH'];

    //         const dummyLeads: any[] = Array.from({ length: 20 }).map((_, i) => {
    //             const stage = dummyStages[Math.floor(Math.random() * dummyStages.length)];
    //             const qual = qualifications[Math.floor(Math.random() * qualifications.length)];
    //             const prio = priorities[Math.floor(Math.random() * priorities.length)];

    //             return {
    //                 id: `lead_${i + 1}`,
    //                 name: `Lead ${i + 1}`,
    //                 email: `lead${i + 1}@example.com`,
    //                 phone: `99999${10000 + i}`,
    //                 currentStageId: stage.id,
    //                 qualification: qual,
    //                 priority: prio,
    //                 value: Math.random() > 0.4 ? Math.floor(Math.random() * 5000 + 500) : null,
    //                 tags: Math.random() > 0.5 ? ['demo', 'imported'] : [],
    //                 createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    //             };
    //         });

    //         // 🔁 Keep your existing logic — just use dummy data instead of fetch
    //         const stages = dummyStages;
    //         const leads = dummyLeads;

    //         const newColumns: Column[] = stages.map((stage) => {
    //             const stageLeads = leads.filter((lead) => lead.currentStageId === stage.id);
    //             const cards: Card[] = stageLeads.map((lead) => databaseLeadToCard(lead));
    //             return {
    //                 id: stage.id,
    //                 title: stage.name,
    //                 color: stage.color || getStageColor(stage.position),
    //                 cards: cards
    //             };
    //         });

    //         setColumns(newColumns);
    //     } catch (error) {
    //         console.error('Error fetching pipeline data:', error);
    //         setError('Failed to load pipeline data');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    useEffect(() => {
        fetchStages();
    }, []);

    const handleStageNameUpdate = async (stageId: string, newName: string) => {
        try {
            const response = await fetch('/api/pipeline-stages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update',
                    stageId,
                    name: newName
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Update the column title in the local state
                    setColumns(prevColumns =>
                        prevColumns.map(col =>
                            col.id === stageId
                                ? { ...col, title: newName }
                                : col
                        )
                    );
                } else {
                    throw new Error('Failed to update stage name');
                }
            } else {
                throw new Error('Failed to update stage name');
            }
        } catch (error) {
            console.error('Error updating stage name:', error);
            throw error;
        }
    };

    const handleStageColorChange = async (stageId: string, newColor: string) => {
        try {
            const response = await fetch('/api/pipeline-stages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'updateColor',
                    stageId,
                    color: newColor
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Update the column color in the local state
                    setColumns(prevColumns =>
                        prevColumns.map(col =>
                            col.id === stageId
                                ? { ...col, color: newColor }
                                : col
                        )
                    );
                } else {
                    throw new Error('Failed to update stage color');
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update stage color');
            }
        } catch (error) {
            console.error('Error updating stage color:', error);
            alert('Failed to update stage color. Please try again.');
        }
    };

    const handleStageDelete = async (stageId: string) => {
        try {
            const response = await fetch('/api/pipeline-stages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                    stageId
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Remove the column from the local state
                    setColumns(prevColumns =>
                        prevColumns.filter(col => col.id !== stageId)
                    );
                } else {
                    throw new Error('Failed to delete stage');
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete stage');
            }
        } catch (error) {
            console.error('Error deleting stage:', error);
            alert('Failed to delete stage. Please try again.');
        }
    };

    const handleAddStage = async () => {
        try {
            const response = await fetch('/api/pipeline-stages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'add',
                    name: 'New Stage'
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const newStage = data.stage;
                    const newColumn: Column = {
                        id: newStage.id,
                        title: newStage.name,
                        color: getStageColor(columns.length),
                        cards: []
                    };

                    setColumns(prevColumns => [...prevColumns, newColumn]);
                } else {
                    throw new Error('Failed to add stage');
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add stage');
            }
        } catch (error) {
            console.error('Error adding stage:', error);
            alert('Failed to add stage. Please try again.');
        }
    };

    const handleCardClick = (card: Card) => {
        setSelectedCard(card);
    };

    const handleCardSave = async (updatedCard: Card) => {
        try {
            const response = await fetch('/api/leads', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    leadId: updatedCard.id,
                    ...cardToDatabaseLead(updatedCard, updatedCard.stageId)
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update lead');
            }

            const result = await response.json();
            if (result.success && result.lead) {
                // Update the card in the local state
                setColumns(prevColumns =>
                    prevColumns.map(col =>
                        col.id === updatedCard.stageId
                            ? {
                                ...col,
                                cards: col.cards.map(card =>
                                    card.id === updatedCard.id
                                        ? databaseLeadToCard(result.lead)
                                        : card
                                )
                            }
                            : col
                    )
                );
            }
        } catch (error) {
            console.error('Error updating lead:', error);
            throw error;
        }
    };

    const handleDeleteLead = async (leadId: string) => {
        try {
            const response = await fetch(`/api/leads?id=${leadId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete lead');
            }

            const result = await response.json();
            if (result.success) {
                // Remove the card from all columns
                setColumns(prevColumns =>
                    prevColumns.map(col => ({
                        ...col,
                        cards: col.cards.filter(card => card.id !== leadId)
                    }))
                );
            }
        } catch (error) {
            console.error('Error deleting lead:', error);
            throw error;
        }
    };

    // Function to refresh leads data with loading state
    const refreshLeads = async () => {
        try {
            setIsRefreshing(true); // Start loading state
            const response = await fetch('/api/leads');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const leads = data.leads;

                    // Update columns with fresh lead data
                    setColumns(prevColumns =>
                        prevColumns.map(col => {
                            const stageLeads = leads.filter((lead: any) => lead.currentStageId === col.id);
                            const cards: Card[] = stageLeads.map((lead: any) => databaseLeadToCard(lead));

                            return {
                                ...col,
                                cards: cards
                            };
                        })
                    );
                }
            }
        } catch (error) {
            console.error('Error refreshing leads:', error);
        } finally {
            setIsRefreshing(false); // End loading state
        }
    };

    const handleCloseModal = () => {
        setSelectedCard(null);
    };

    const handleAddLead = (stageId: string, stageName: string) => {
        setSelectedStageId(stageId);
        setSelectedStageName(stageName);
        setIsAddLeadDialogOpen(true);
    };

    const handleAddLeadSave = async (lead: Omit<Card, 'id'>) => {
        try {
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cardToDatabaseLead(lead, selectedStageId)),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create lead');
            }

            const result = await response.json();

            if (result.success) {
                // Refresh the board data
                await fetchStages();
            }
        } catch (error) {
            console.error('Error creating lead:', error);
            alert('Failed to create lead. Please try again.');
        }
    };

    // Function to export leads as CSV
    const exportLeadsAsCSV = () => {
        try {
            // Get all leads from all columns
            const allLeads: any[] = [];
            columns.forEach(column => {
                column.cards.forEach(card => {
                    allLeads.push({
                        name: card.title,
                        stage: column.title,
                        value: card.value,
                        source: card.trafficSource,
                        campaign: card.campaign,
                        priority: card.priority,
                        description: card.description,
                        note: card.note
                    });
                });
            });

            if (allLeads.length === 0) {
                alert('No leads to export');
                return;
            }

            // Create CSV content
            const headers = ['Name', 'Stage', 'Value', 'Source', 'Campaign', 'Priority', 'Description', 'Note'];
            const csvContent = [
                headers.join(','),
                ...allLeads.map(lead => [
                    `"${lead.name || ''}"`,
                    `"${lead.stage || ''}"`,
                    `"${lead.value || ''}"`,
                    `"${lead.source || ''}"`,
                    `"${lead.campaign || ''}"`,
                    `"${lead.priority || ''}"`,
                    `"${lead.description || ''}"`,
                    `"${lead.note || ''}"`
                ].join(','))
            ].join('\n');

            // Create and download the file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `leads-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting leads:', error);
            alert('Failed to export leads. Please try again.');
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const activeData = active.data.current;

        if (activeData?.type === 'card') {
            setActiveCard(activeData.card);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveCard(null);

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        if (activeData?.type === 'card' && overData?.type === 'column') {
            const cardId = active.id as string;
            const newStageId = over.id as string;
            const card = activeData.card as Card;

            // Don't do anything if the card is already in this stage
            if (card.stageId === newStageId) return;

            // Optimistically update the UI
            setColumns(prevColumns => {
                return prevColumns.map(col => {
                    if (col.id === card.stageId) {
                        // Remove card from source column
                        return {
                            ...col,
                            cards: col.cards.filter(c => c.id !== cardId)
                        };
                    } else if (col.id === newStageId) {
                        // Add card to target column
                        const updatedCard = { ...card, stageId: newStageId };
                        return {
                            ...col,
                            cards: [...col.cards, updatedCard]
                        };
                    }
                    return col;
                });
            });

            // Update the database
            try {
                const response = await fetch('/api/leads/update-stage', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        leadId: cardId,
                        newStageId: newStageId
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to update lead stage');
                }

                const data = await response.json();
                if (!data.success) {
                    throw new Error(data.error || 'Failed to update lead stage');
                }

                // Refresh the data to ensure consistency
                await refreshLeads();
            } catch (error) {
                console.error('Error updating lead stage:', error);

                // Revert the optimistic update on error
                await fetchStages();

                // Show error message to user
                alert('Failed to move lead. Please try again.');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading pipeline data...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={fetchStages} variant="outline">
                                Retry
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Lead Pipeline</h1>
                            <p className="text-muted-foreground mt-1">Manage and track your leads through the sales pipeline</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={exportLeadsAsCSV}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </Button>

                            <Button
                                className='bg-orange-600 hover:bg-orange-700 text-white'
                                onClick={refreshLeads}
                                disabled={isRefreshing}
                            >
                                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>

                    </div>

                    {/* Kanban Board */}
                    <div className="flex gap-6 overflow-x-auto pb-4 items-start">
                        {columns.map((column) => (
                            <KanbanColumn
                                key={column.id}
                                column={column}
                                onCardClick={handleCardClick}
                                onStageNameUpdate={handleStageNameUpdate}
                                onStageColorChange={handleStageColorChange}
                                onStageDelete={handleStageDelete}
                                onAddLead={handleAddLead}
                            />
                        ))}

                        {/* Add Stage Button */}
                        <div className="flex-shrink-0 w-80">
                            <Button
                                variant="outline"
                                className="w-full h-8 rounded-full bg-card hover:bg-accent border-dotted border-border text-muted-foreground"
                                onClick={handleAddStage}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Stage
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeCard ? (
                        <div className="bg-card border rounded-lg p-4 shadow-lg opacity-90">
                            <div className="font-medium text-sm">{activeCard.title}</div>
                            {activeCard.description && (
                                <div className="text-xs text-muted-foreground mt-1">{activeCard.description}</div>
                            )}
                        </div>
                    ) : null}
                </DragOverlay>
            </div>

            {/* Card Detail Modal */}
            <LeadDetailDialog
                refreshLeads={refreshLeads}
                columns={columns}
                card={selectedCard}
                isOpen={selectedCard !== null}
                onClose={handleCloseModal}
                onSave={handleCardSave}
                onDelete={handleDeleteLead}
            />

            {/* Add Lead Dialog */}
            <AddLeadDialog
                isOpen={isAddLeadDialogOpen}
                onClose={() => setIsAddLeadDialogOpen(false)}
                onSave={handleAddLeadSave}
                stageId={selectedStageId}
                stageName={selectedStageName}
            />
        </DndContext>
    );
};