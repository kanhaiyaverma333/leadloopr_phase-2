'use client'

import { useState, useEffect } from "react";
import { LeadsDataTable } from "@/components/LeadsTableDataTable";
import { LeadDetailDialog } from "@/components/kanban/LeadDetailDialog";
import { leadToCard } from "@/lib/type-conversion";
import { Card, cardToDatabaseLead } from "@/components/kanban/types";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Columns, Download, RefreshCw } from "lucide-react";

export interface Lead {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    websiteUrl: string | null;
    landingPageUrl: string | null;
    path: string | null;
    referrerUrl: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    gclid: string | null;
    fbclid: string | null;
    li_fat_id: string | null;
    metaFbp: string | null;
    gaClientId: string | null;
    gaSessionId: string | null;
    msclkid: string | null;
    firstSeenAt: string | null;
    consentStatus: 'GRANTED' | 'DENIED' | 'PARTIAL' | 'UNKNOWN';
    consentTimestamp: string | null;
    adStorageConsent: boolean | null;
    adUserDataConsent: boolean | null;
    adPersonalizationConsent: boolean | null;
    analyticsStorageConsent: boolean | null;
    currentStageId: string | null;
    value: number | null;
    currency: string | null;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    qualification: 'QUALIFIED' | 'UNQUALIFIED' | 'NEEDS_REVIEW';
    ownerId: string | null;
    tags: string[];
    isManual: boolean;
    createdAt: string;
    updatedAt: string;
    lastUpdatedById: string | null;
    stage?: {
        id: string;
        name: string;
        position: number;
        color: string;
    } | null;
}

// Add interface for PipelineStage
interface PipelineStage {
    id: string;
    name: string;
    position: number;
    color: string;
}

export default function CRMPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [columns, setColumns] = useState<Array<{ id: string; title: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [isSaveConfirmationOpen, setIsSaveConfirmationOpen] = useState(false);
    const [pendingCardUpdate, setPendingCardUpdate] = useState<Card | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchLeads = async () => {
        try {
            setLoading(true);
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

                    // Convert stages to columns format for the data table
                    const newColumns = stages.map((stage) => ({
                        id: stage.id,
                        title: stage.name
                    }));

                    setColumns(newColumns);
                    setLeads(leads);
                } else {
                    throw new Error('Failed to load pipeline data');
                }
            } else {
                throw new Error('Failed to load pipeline data');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch leads');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const handleCardSave = async (updatedCard: Card) => {
        setPendingCardUpdate(updatedCard);
        setIsSaveConfirmationOpen(true);
    };

    const handleConfirmSave = async () => {
        if (!pendingCardUpdate) return;
        try {
            const response = await fetch('/api/leads', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: pendingCardUpdate.id,
                    ...cardToDatabaseLead(pendingCardUpdate, pendingCardUpdate.stageId)
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update lead');
            }
            const result = await response.json();
            if (result.success && result.lead) {
                setLeads(prevLeads =>
                    prevLeads.map(l =>
                        l.id === result.lead.id ? result.lead : l
                    )
                );
            }
            setSelectedCard(null);
        } catch (error) {
            alert('Failed to update lead. Please try again.');
        } finally {
            setIsSaveConfirmationOpen(false);
            setPendingCardUpdate(null);
        }
    };

    const handleCancelSave = () => {
        setIsSaveConfirmationOpen(false);
        setPendingCardUpdate(null);
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
                // Remove the lead from the local state
                setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId));
                setSelectedCard(null);
            }
        } catch (error) {
            console.error('Error deleting lead:', error);
            throw error;
        }
    };

    const handleCloseModal = () => {
        setSelectedCard(null);
    };

    const refreshLeads = async () => {
        try {
            setIsRefreshing(true);

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

                    // Update columns format for the data table
                    const newColumns = stages.map((stage) => ({
                        id: stage.id,
                        title: stage.name
                    }));

                    setColumns(newColumns);
                    setLeads(leads);
                }
            }
        } catch (error) {
            console.error('Error refreshing leads:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Export leads as CSV
    const exportLeadsAsCSV = () => {
        try {
            if (leads.length === 0) {
                alert('No leads to export');
                return;
            }
            // Define headers and map leads to CSV rows
            const headers = [
                'Name', 'Stage', 'Value', 'Source', 'Campaign', 'Priority', 'Tags', 'Email', 'Phone', 'Created At'
            ];
            const csvContent = [
                headers.join(','),
                ...leads.map(lead => [
                    `"${lead.name || ''}"`,
                    `"${lead.stage?.name || ''}"`,
                    `"${lead.value || ''}"`,
                    `"${lead.utmSource || ''}"`,
                    `"${lead.utmCampaign || ''}"`,
                    `"${lead.priority || ''}"`,
                    `"${lead.tags?.join('; ') || ''}"`,
                    `"${lead.email || ''}"`,
                    `"${lead.phone || ''}"`,
                    `"${lead.createdAt || ''}"`
                ].join(','))
            ].join('\n');
            // Download CSV
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

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-foreground">Loading leads...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <p className="text-red-600 mb-4">Error: {error}</p>
                            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-gray-200 rounded">Try Again</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (leads.length === 0) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">CRM</h1>
                            <p className="text-muted-foreground mt-1">Manage and track your leads in a comprehensive view</p>
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
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <p className="text-muted-foreground">No leads found.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">CRM</h1>
                        <p className="text-muted-foreground mt-1">Manage and track your leads in a comprehensive view</p>
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
                <LeadsDataTable
                    data={leads}
                    columns={columns}
                    refreshLeads={refreshLeads}
                    onRowClick={lead => setSelectedCard(leadToCard(lead))}
                />
                <LeadDetailDialog
                    refreshLeads={refreshLeads}
                    columns={columns}
                    card={selectedCard}
                    isOpen={selectedCard !== null}
                    onClose={handleCloseModal}
                    onSave={handleCardSave}
                    onDelete={handleDeleteLead}
                />
            </div>
        </div>
    );
}

