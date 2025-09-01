'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface RenameStageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRename: (newName: string) => Promise<void>;
    currentName: string;
    stageId: string;
}

export const RenameStageModal: React.FC<RenameStageModalProps> = ({
    isOpen,
    onClose,
    onRename,
    currentName,
    stageId
}) => {
    const [name, setName] = useState(currentName);
    const [isLoading, setIsLoading] = useState(false);

    // Update the name when the modal opens or currentName changes
    useEffect(() => {
        if (isOpen) {
            setName(currentName);
        }
    }, [isOpen, currentName]);

    const handleSave = async () => {
        if (name.trim() === '') return;

        setIsLoading(true);
        try {
            await onRename(name.trim());
            onClose();
        } catch (error) {
            console.error('Error renaming stage:', error);
            alert('Failed to rename stage. Please try a different name.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Rename Stage</DialogTitle>
                    <DialogDescription>
                        Enter a new name for this stage. The name must be unique within your organization.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2">
                    <div className="grid flex-1 gap-2">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter stage name"
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>
                </div>
                <DialogFooter className="sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isLoading || name.trim() === ''}
                    >
                        {isLoading ? 'Saving...' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}; 