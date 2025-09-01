'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ColorPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onColorSelect: (color: string) => void;
    currentColor: string;
}

const availableColors = [
    { name: 'Blue', value: 'bg-blue-500' },
    { name: 'Orange', value: 'bg-orange-500' },
    { name: 'Green', value: 'bg-green-500' },
    { name: 'Purple', value: 'bg-purple-500' },
    { name: 'Pink', value: 'bg-pink-500' },
    { name: 'Indigo', value: 'bg-indigo-500' },
    { name: 'Teal', value: 'bg-teal-500' },
    { name: 'Yellow', value: 'bg-yellow-500' },
    { name: 'Red', value: 'bg-red-500' },
    { name: 'Gray', value: 'bg-gray-500' },
    { name: 'Emerald', value: 'bg-emerald-500' },
    { name: 'Cyan', value: 'bg-cyan-500' },
];

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
    isOpen,
    onClose,
    onColorSelect,
    currentColor
}) => {
    const handleColorSelect = (color: string) => {
        onColorSelect(color);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Choose Stage Color</DialogTitle>
                    <DialogDescription>
                        Select a color for this stage. The color will be used for the stage header.
                    </DialogDescription>
                </DialogHeader>

                {/* Color Grid */}
                <div className="grid grid-cols-4 gap-3 py-4">
                    {availableColors.map((color) => (
                        <button
                            key={color.value}
                            onClick={() => handleColorSelect(color.value)}
                            className={`
                                relative w-12 h-12 rounded-lg ${color.value} 
                                border-2 transition-all hover:scale-105
                                ${currentColor === color.value ? 'border-gray-900' : 'border-transparent'}
                            `}
                            title={color.name}
                        >
                            {currentColor === color.value && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                        <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                                    </div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <DialogFooter className="sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}; 