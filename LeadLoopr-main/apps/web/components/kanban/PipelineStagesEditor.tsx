'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Save, X } from 'lucide-react';

interface PipelineStage {
    id: string;
    name: string;
    position: number;
}

interface PipelineStagesEditorProps {
    onStagesUpdate: (stages: PipelineStage[]) => void;
    className?: string;
}

export const PipelineStagesEditor: React.FC<PipelineStagesEditorProps> = ({
    onStagesUpdate,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [stagesText, setStagesText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch current stages when component mounts
    useEffect(() => {
        fetchStages();
    }, []);

    const fetchStages = async () => {
        try {
            const response = await fetch('/api/pipeline-stages');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const stagesText = data.stages
                        .map((stage: PipelineStage) => stage.name)
                        .join('\n');
                    setStagesText(stagesText);
                }
            }
        } catch (error) {
            console.error('Error fetching stages:', error);
            setError('Failed to load current stages');
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Parse stages from text
            const stageNames = stagesText
                .split('\n')
                .map(name => name.trim())
                .filter(name => name.length > 0);

            if (stageNames.length === 0) {
                setError('At least one stage is required');
                setIsLoading(false);
                return;
            }

            // Create stages array with positions
            const stages = stageNames.map((name, index) => ({
                name,
                position: index
            }));

            const response = await fetch('/api/pipeline-stages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ stages }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    onStagesUpdate(data.stages);
                    setIsOpen(false);
                } else {
                    setError('Failed to save stages');
                }
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to save stages');
            }
        } catch (error) {
            console.error('Error saving stages:', error);
            setError('Failed to save stages');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        fetchStages(); // Reset to current stages
        setIsOpen(false);
        setError(null);
    };

    return (
        <div className={className}>
            {!isOpen ? (
                <Button
                    onClick={() => setIsOpen(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                >
                    <Settings className="w-4 h-4" />
                    Edit Stages
                </Button>
            ) : (
                <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">
                            Edit Pipeline Stages
                        </h3>
                        <Button
                            onClick={handleCancel}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Stage Names (one per line)
                            </label>
                            <Textarea
                                value={stagesText}
                                onChange={(e) => setStagesText(e.target.value)}
                                placeholder="Proposal&#10;Qualified&#10;Sales Contact&#10;Lost&#10;Won"
                                className="min-h-[120px]"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Enter each stage name on a separate line. The order will be preserved.
                            </p>
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}; 