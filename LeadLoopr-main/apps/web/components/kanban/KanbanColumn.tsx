'use client'

import React, { useState } from 'react';
import { Column, Card } from './types';
import { LeadCard } from './LeadCard';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus } from 'lucide-react';
import { ColorPickerModal } from './ColorPickerModal';
import { RenameStageModal } from './RenameStageModal';
import { AddLeadDialog } from './AddLeadDialog';
import { useDroppable } from '@dnd-kit/core';
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
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface KanbanColumnProps {
    column: Column;
    onCardClick: (card: Card) => void;
    onStageNameUpdate?: (stageId: string, newName: string) => Promise<void>;
    onStageColorChange?: (stageId: string, newColor: string) => Promise<void>;
    onStageDelete?: (stageId: string) => Promise<void>;
    onAddLead?: (stageId: string, stageName: string) => void;
    onCardMove?: (cardId: string, newStageId: string) => Promise<void>;
}

// Helper to map Tailwind bg-* classes to soft rgba backgrounds and glows
const colorMap: Record<string, { bg: string; headerBg: string; shadow: string }> = {
    'bg-blue-500': { bg: 'rgba(0,122,255,0.1)', headerBg: 'rgba(0,122,255,1)', shadow: 'none' },      // 007AFF
    'bg-amber-500': { bg: 'rgba(245,158,11,0.1)', headerBg: 'rgba(245,158,11,1)', shadow: 'none' },     // F59E0B
    'bg-green-500': { bg: 'rgba(52,199,89,0.1)', headerBg: 'rgba(52,199,89,1)', shadow: 'none' },      // 34C759
    'bg-indigo-500': { bg: 'rgba(99,102,241,0.1)', headerBg: 'rgba(99,102,241,1)', shadow: 'none' },     // 6366F1
    'bg-orange-500': { bg: 'rgba(249,115,22,0.1)', headerBg: 'rgba(249,115,22,1)', shadow: 'none' },     // F97316
    'bg-emerald-500': { bg: 'rgba(16,185,129,0.1)', headerBg: 'rgba(16,185,129,1)', shadow: 'none' },     // 10B981
    'bg-sky-500': { bg: 'rgba(14,165,233,0.1)', headerBg: 'rgba(14,165,233,1)', shadow: 'none' },     // 0EA5E9
    'bg-yellow-500': { bg: 'rgba(234,179,8,0.1)', headerBg: 'rgba(234,179,8,1)', shadow: 'none' },      // EAB308
    'bg-teal-500': { bg: 'rgba(20,184,166,0.1)', headerBg: 'rgba(20,184,166,1)', shadow: 'none' },     // 14B8A6
    'bg-purple-500': { bg: 'rgba(168,85,247,0.1)', headerBg: 'rgba(168,85,247,1)', shadow: 'none' },     // A855F7
    'bg-pink-500': { bg: 'rgba(236,72,153,0.1)', headerBg: 'rgba(236,72,153,1)', shadow: 'none' },      // EC4899
    'bg-red-500': { bg: 'rgba(239,68,68,0.1)', headerBg: 'rgba(239,68,68,1)', shadow: 'none' },        // EF4444
    'bg-gray-500': { bg: 'rgba(107,114,128,0.1)', headerBg: 'rgba(107,114,128,1)', shadow: 'none' },    // 6B7280
    'bg-cyan-500': { bg: 'rgba(6,182,212,0.1)', headerBg: 'rgba(6,182,212,1)', shadow: 'none' },       // 06B6D4
};

function getColumnStyle(colorClass: string) {
    const fallback = { bg: 'rgba(59,130,246,0.05)', headerBg: 'rgba(59,130,246,0.3)', shadow: 'none' };
    return colorMap[colorClass] || fallback;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
    column,
    onCardClick,
    onStageNameUpdate,
    onStageColorChange,
    onStageDelete,
    onAddLead,
    onCardMove
}) => {
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
        data: {
            type: 'column',
            column
        }
    });

    const handleRename = () => {
        setIsRenameModalOpen(true);
    };

    const handleStageNameClick = () => {
        setIsRenameModalOpen(true);
    };

    const handleRenameSubmit = async (newName: string) => {
        if (onStageNameUpdate) {
            await onStageNameUpdate(column.id, newName);
        }
    };

    const handleChangeColor = () => {
        setIsColorPickerOpen(true);
    };

    const handleColorSelect = (newColor: string) => {
        if (onStageColorChange) {
            onStageColorChange(column.id, newColor);
        }
    };

    const handleDelete = async () => {
        if (onStageDelete) {
            await onStageDelete(column.id);
        }
    };

    return (
        <div className="flex-shrink-0 w-80">
            <div
                ref={setNodeRef}
                className={`border rounded-[24px] p-4 h-full transition-colors ${isOver ? 'bg-accent border-blue-300' : 'border-border'}`}
                style={{
                    background: getColumnStyle(column.color).bg,
                    boxShadow: getColumnStyle(column.color).shadow,
                }}
            >
                {/* Column Header */}
                <div
                    className="flex items-center justify-between mb-4 p-2 rounded-full"
                    style={{
                        background: getColumnStyle(column.color).headerBg,
                    }}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: column.color }}
                        />
                        <span className="text-xs text-white bg-white/20 px-2 py-1 rounded-full">
                            {column.cards.length}
                        </span>
                        <h3
                            className="font-semibold text-sm text-white truncate cursor-pointer hover:text-blue-100 transition-colors"
                            onClick={handleStageNameClick}
                        >
                            {column.title}
                        </h3>
                    </div>

                    <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleRename}>Rename</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleChangeColor}>Change Color</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to delete this stage?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the "{column.title}" stage and all associated leads.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                {/* Cards Container - Scrollable */}
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2 space-y-3">
                    {column.cards.map((card) => (
                        <LeadCard
                            key={card.id}
                            card={card}
                            onClick={() => onCardClick(card)}
                        />
                    ))}

                    {/* Add Lead Card - Always last */}
                    <div
                        className="bg-card border-2 border-dashed border-border rounded-lg p-4 hover:border-blue-300 hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => onAddLead?.(column.id, column.title)}
                    >
                        <div className="flex items-center justify-center text-muted-foreground">
                            <Plus className="w-4 h-4 mr-2" />
                            <span className="text-sm">Add Lead</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ColorPickerModal
                isOpen={isColorPickerOpen}
                onClose={() => setIsColorPickerOpen(false)}
                onColorSelect={handleColorSelect}
                currentColor={column.color}
            />

            <RenameStageModal
                isOpen={isRenameModalOpen}
                onClose={() => setIsRenameModalOpen(false)}
                onRename={handleRenameSubmit}
                currentName={column.title}
                stageId={column.id}
            />
        </div>
    );
}; 