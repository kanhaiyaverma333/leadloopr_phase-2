"use client";

import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
    ColumnFiltersState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

// Lead type definition
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

export interface LeadsDataTableProps {
    data: Lead[];
    columns: Array<{ id: string; title: string }>;
    refreshLeads: () => void | Promise<void>;
    onRowClick?: (lead: Lead) => void;
}

export function LeadsDataTable({ data, columns, refreshLeads, onRowClick }: LeadsDataTableProps) {
    console.log("Rendering LeadsDataTable with data:", data);
    const [statusLoading, setStatusLoading] = React.useState<string | null>(null);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [searchTerm, setSearchTerm] = useState("");

    // Update column filters when search term changes
    React.useEffect(() => {
        const newFilters: ColumnFiltersState = [];
        // Add search filter
        if (searchTerm) {
            newFilters.push({
                id: 'name',
                value: searchTerm,
            });
        }
        setColumnFilters(newFilters);
    }, [searchTerm]);

    // Lead status change handler (integrated from conversion-sync-handler)
    const handleLeadStatusChange = async (
        leadId: string,
        status: 'qualified' | 'won' | 'lost',
        formData: Lead
    ) => {
        setStatusLoading(`${leadId}-${status}`);

        // Helper to update stage
        const updateLeadStage = async () => {
            const matchingColumn = columns.find((col) => col.title.toLowerCase() === status.toLowerCase());
            if (matchingColumn) {
                const newStageId = matchingColumn.id;
                await fetch('/api/leads/update-stage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ leadId, newStageId }),
                });
                await refreshLeads();
            }
        };

        try {
            // Handle "lost" (no sync needed for ads, but sync GA4 if available)
            if (status === 'lost') {
                // Try to sync GA4 event
                try {
                    const gaResponse = await fetch('/api/integrations/google-analytics/sync-event', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ leadId, eventType: 'lead_lost' }),
                    });

                    if (gaResponse.ok) {
                        const gaResult = await gaResponse.json();
                        if (gaResult.success) {
                            console.log(`Lead marked as LOST and synced to Google Analytics`);
                            toast.success(`Lead marked as LOST and synced to Google Analytics`);
                        } else {
                            console.log(`Lead marked as LOST (Google Analytics sync failed)`);
                            toast.success(`Lead marked as LOST`);
                        }
                    } else {
                        console.log(`Lead marked as LOST (Google Analytics not configured)`);
                        toast.success(`Lead marked as LOST`);
                    }
                } catch (error) {
                    console.log(`Lead marked as LOST (Google Analytics sync failed)`);
                    toast.success(`Lead marked as LOST`);
                }

                await updateLeadStage();
                return;
            }

            // Prepare sync for qualified/won
            type SyncResult = {
                platform: string;
                success: boolean;
                error?: string;
            };

            const syncPromises: Promise<SyncResult>[] = [];

            // Google Ads sync
            if (formData.gclid) {
                syncPromises.push(
                    fetch('/api/integrations/google-ads/conversion', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ leadId }),
                    })
                        .then(async (res): Promise<SyncResult> => {
                            const contentType = res.headers.get('content-type') || '';
                            let result: any = null;

                            if (contentType.includes('application/json')) {
                                result = await res.json();
                            } else {
                                const fallbackText = await res.text();
                                console.warn("Non-JSON response from Google Ads server:", fallbackText.slice(0, 200));
                                throw new Error('Google Ads API returned non-JSON response');
                            }

                            if (!res.ok || !result.success) {
                                throw new Error(`Google Ads: ${result?.error || 'Conversion failed'}`);
                            }

                            return { platform: 'Google Ads', success: true };
                        })
                        .catch((error): SyncResult => ({
                            platform: 'Google Ads',
                            success: false,
                            error: error.message,
                        }))
                );
            }

            // Meta Ads sync
            if (formData.fbclid) {
                syncPromises.push(
                    fetch('/api/integrations/meta-ads/conversion', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ leadId }),
                    })
                        .then(async (res): Promise<SyncResult> => {
                            const contentType = res.headers.get('content-type') || '';
                            let result: any = null;

                            if (contentType.includes('application/json')) {
                                result = await res.json();
                            } else {
                                const fallbackText = await res.text();
                                console.warn("Non-JSON response from Meta Ads server:", fallbackText.slice(0, 200));
                                throw new Error('Meta Ads API returned non-JSON response');
                            }

                            if (!res.ok || !result.success) {
                                throw new Error(`Meta Ads: ${result?.error || 'Conversion failed'}`);
                            }

                            return { platform: 'Meta Ads', success: true };
                        })
                        .catch((error): SyncResult => ({
                            platform: 'Meta Ads',
                            success: false,
                            error: error.message,
                        }))
                );
            }

            // Microsoft Ads sync
            if (formData.msclkid) {
                syncPromises.push(
                    fetch('/api/integrations/microsoft-ads/conversion', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ leadId }),
                    })
                        .then(async (res): Promise<SyncResult> => {
                            const contentType = res.headers.get('content-type') || '';
                            let result: any = null;

                            if (contentType.includes('application/json')) {
                                result = await res.json();
                            } else {
                                const fallbackText = await res.text();
                                console.warn("Non-JSON response from Microsoft Ads server:", fallbackText.slice(0, 200));
                                throw new Error('Microsoft Ads API returned non-JSON response');
                            }

                            if (!res.ok || !result.success) {
                                throw new Error(`Microsoft Ads: ${result?.error || 'Conversion failed'}`);
                            }

                            return { platform: 'Microsoft Ads', success: true };
                        })
                        .catch((error): SyncResult => ({
                            platform: 'Microsoft Ads',
                            success: false,
                            error: error.message,
                        }))
                );
            }

            // Google Analytics sync
            const eventType = status === 'qualified' ? 'lead_qualified' : 'lead_won';
            syncPromises.push(
                fetch('/api/integrations/google-analytics/sync-event', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ leadId, eventType }),
                })
                    .then(async (res): Promise<SyncResult> => {
                        const contentType = res.headers.get('content-type') || '';
                        let result: any = null;

                        if (contentType.includes('application/json')) {
                            result = await res.json();
                        } else {
                            const fallbackText = await res.text();
                            console.warn("Non-JSON response from Google Analytics server:", fallbackText.slice(0, 200));
                            throw new Error('Google Analytics API returned non-JSON response');
                        }

                        if (!res.ok || !result.success) {
                            // If GA4 is not configured, don't treat it as an error
                            if (result?.error?.includes('not connected') || result?.error?.includes('not configured')) {
                                console.log('Google Analytics not configured - skipping sync');
                                return { platform: 'Google Analytics', success: true, error: 'not_configured' };
                            }
                            throw new Error(`Google Analytics: ${result?.error || 'Event sync failed'}`);
                        }

                        return { platform: 'Google Analytics', success: true };
                    })
                    .catch((error): SyncResult => ({
                        platform: 'Google Analytics',
                        success: false,
                        error: error.message,
                    }))
            );

            // Run all syncs
            const results = await Promise.all(syncPromises);

            // Filter out GA4 "not configured" results from success/failure counts
            const relevantResults = results.filter(r => r.error !== 'not_configured');
            const successfulSyncs = relevantResults.filter((r) => r.success);
            const failedSyncs = relevantResults.filter((r) => !r.success);
            const gaConfigured = results.find(r => r.platform === 'Google Analytics' && r.error !== 'not_configured');

            // Build success message
            let platforms: string[] = [];
            if (formData.gclid && successfulSyncs.find(r => r.platform === 'Google Ads')) {
                platforms.push('Google Ads');
            }
            if (formData.fbclid && successfulSyncs.find(r => r.platform === 'Meta Ads')) {
                platforms.push('Meta Ads');
            }
            if (formData.msclkid && successfulSyncs.find(r => r.platform === 'Microsoft Ads')) {
                platforms.push('Microsoft Ads');
            }
            if (gaConfigured && successfulSyncs.find(r => r.platform === 'Google Analytics')) {
                platforms.push('Google Analytics');
            }

            if (platforms.length > 0) {
                const platformsText = platforms.join(' and ');
                console.log(`Lead marked as ${status.toUpperCase()} and synced to ${platformsText}`);
                toast.success(`Lead marked as ${status.toUpperCase()} and synced to ${platformsText}`);
            } else {
                console.log(`Lead marked as ${status.toUpperCase()} (no tracking IDs found or no integrations configured)`);
                toast.success(`Lead marked as ${status.toUpperCase()}`);
            }

            // Update stage regardless of sync results
            await updateLeadStage();

            // Show warnings for any failed syncs
            if (failedSyncs.length > 0) {
                const failedPlatforms = failedSyncs.map((r) => r.platform).join(' and ');
                console.warn(`Some syncs failed for ${failedPlatforms}`);
            }

        } catch (error: any) {
            console.error('Unexpected sync error:', error);
            toast.error(`Failed to process lead: ${error.message}`);
        } finally {
            setStatusLoading(null);
        }
    };

    // Helper functions for rendering
    const getInitials = (name: string | null) => {
        if (!name) return "??";
        return name
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getAvatarColor = (name: string | null) => {
        if (!name) return "bg-gray-500";
        const colors = [
            "bg-blue-500",
            "bg-green-500",
            "bg-purple-500",
            "bg-orange-500",
            "bg-red-500",
            "bg-indigo-500",
            "bg-pink-500",
            "bg-yellow-500",
            "bg-teal-500",
            "bg-cyan-500",
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
        });
    };

    const tableColumns = React.useMemo<ColumnDef<Lead>[]>(
        () => [
            {
                accessorKey: "name",
                header: "Name",
                cell: ({ row }) => {
                    const lead = row.original;
                    return (
                        <div className="flex items-center gap-3">
                            <div className="font-medium text-gray-900 text-xs">{lead.name || "Unnamed Lead"}</div>
                        </div>
                    );
                },
                filterFn: (row, id, value) => {
                    const searchValue = value as string;
                    const name = row.getValue(id) as string;
                    const email = row.original.email as string;
                    return (
                        name?.toLowerCase().includes(searchValue.toLowerCase()) ||
                        email?.toLowerCase().includes(searchValue.toLowerCase())
                    );
                },
            },
            {
                accessorKey: "stage.name",
                header: "Status",
                cell: ({ row }) => <StatusBadge label={row.original.stage?.name || "No Stage"} color={row.original.stage?.color || "bg-gray-400 text-white"} />,
            },
            {
                accessorKey: "email",
                header: "E-mail",
                cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.email || "-"}</span>,
            },
            {
                accessorKey: "phone",
                header: "Phone",
                cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.phone || "-"}</span>,
            },
            {
                accessorKey: "tags",
                header: "Tags",
                cell: ({ row }) => {
                    const tags = row.original.tags;
                    return tags && tags.length > 0 ? (
                        <div className="flex items-center gap-1">
                            <span>{tags.slice(0, 2).join(", ")}</span>
                            {tags.length > 2 && <span className="text-blue-600 font-medium">+{tags.length - 2}</span>}
                        </div>
                    ) : (
                        "-"
                    );
                },
            },
            {
                accessorKey: "value",
                header: () => <div className="text-right">Value</div>,
                cell: ({ row }) => {
                    const value = row.original.value;
                    return (
                        <div className="text-right text-xs text-muted-foreground">
                            {value ? `€${value.toLocaleString("de-DE")}` : "-"}
                        </div>
                    );
                },
            },
            {
                accessorKey: "createdAt",
                header: () => <div className="text-right">Received</div>,
                cell: ({ row }) => <div className="text-right text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</div>,
            },
            {
                id: "actions",
                enableHiding: false,
                cell: ({ row }) => {
                    const lead = row.original;
                    const isLoading = statusLoading === `${lead.id}-lost` || statusLoading === `${lead.id}-qualified` || statusLoading === `${lead.id}-won`;

                    return (
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                className="relative cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLeadStatusChange(lead.id, 'lost', lead);
                                }}
                                disabled={isLoading}
                            >
                                {statusLoading === `${lead.id}-lost` ? 'Processing...' : 'Loser'}
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="relative cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLeadStatusChange(lead.id, 'qualified', lead);
                                }}
                                disabled={isLoading}
                            >
                                {statusLoading === `${lead.id}-qualified` ? 'Processing...' : 'Qualified'}
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="relative bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLeadStatusChange(lead.id, 'won', lead);
                                }}
                                disabled={isLoading}
                            >
                                {statusLoading === `${lead.id}-won` ? 'Processing...' : 'Winner'}
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [statusLoading, handleLeadStatusChange]
    );

    const table = useReactTable({
        data,
        columns: tableColumns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
        },
    });

    return (
        <div className="w-full">
            <div className="flex items-center gap-2 mb-4 max-w-md">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Search Lead"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border border-gray-300 rounded-lg"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="border border-border rounded-lg px-3 py-2 bg-background text-sm font-medium flex items-center gap-2">
                            Sort
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSorting([{ id: 'name', desc: false }])}>Name (A-Z)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSorting([{ id: 'name', desc: true }])}>Name (Z-A)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSorting([{ id: 'value', desc: false }])}>Value (Low-High)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSorting([{ id: 'value', desc: true }])}>Value (High-Low)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSorting([{ id: 'createdAt', desc: false }])}>Received (Oldest)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSorting([{ id: 'createdAt', desc: true }])}>Received (Newest)</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="border border-border rounded-lg px-3 py-2 bg-background text-sm font-medium flex items-center gap-2">
                            Settings
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {table.getAllLeafColumns()
                            .filter(column => column.getCanHide())
                            .map(column => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                onClick={() => onRowClick && onRowClick(row.original)}
                                className={cn(
                                    "cursor-pointer",
                                    row.getIsSelected() && "bg-blue-50"
                                )}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={tableColumns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}