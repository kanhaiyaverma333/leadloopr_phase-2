'use client'

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { User, Target, Globe, Shield, Clock } from 'lucide-react';
import { Card as CardType } from "./types";

interface AddLeadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (lead: Omit<CardType, 'id'>) => Promise<void>;
    stageId: string;
    stageName: string;
}

export const AddLeadDialog = ({ isOpen, onClose, onSave, stageId, stageName }: AddLeadDialogProps) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM' as CardType['priority'],
        value: '',
        campaign: '',
        trafficSource: '',
        note: '',
        // Contact & Identity
        email: '',
        phone: '',
        // Lead Info
        qualification: 'UNQUALIFIED' as CardType['qualification'],
        tags: [] as string[],
        // Attribution & Source
        websiteUrl: '',
        landingPageUrl: '',
        path: '',
        referrerUrl: '',
        utmSource: '',
        utmMedium: '',
        utmCampaign: '',
        gclid: '',
        fbclid: '',
        li_fat_id: '',
        metaFbp: '',
        gaClientId: '',
        gaSessionId: '',
        msclkid: '',
        firstSeenAt: '',
        consentTimestamp: '',
        currency: 'EUR',
        isManual: true,
        // Consent Info
        consentStatus: 'UNKNOWN' as CardType['consentStatus'],
        adStorageConsent: false,
        adUserDataConsent: false,
        adPersonalizationConsent: false,
        analyticsStorageConsent: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [newTag, setNewTag] = useState('');

    const handleInputChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAddTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            handleInputChange('tags', [...formData.tags, newTag.trim()]);
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            alert('Please enter a lead name');
            return;
        }

        setIsLoading(true);
        try {
            await onSave({
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                value: formData.value,
                campaign: formData.campaign,
                trafficSource: formData.trafficSource,
                note: formData.note,
                stageId: stageId,
                email: formData.email || undefined,
                phone: formData.phone || undefined,
                qualification: formData.qualification,
                tags: formData.tags,
                websiteUrl: formData.websiteUrl || undefined,
                landingPageUrl: formData.landingPageUrl || undefined,
                path: formData.path || undefined,
                referrerUrl: formData.referrerUrl || undefined,
                utmSource: formData.utmSource || undefined,
                utmMedium: formData.utmMedium || undefined,
                utmCampaign: formData.utmCampaign || undefined,
                gclid: formData.gclid || undefined,
                fbclid: formData.fbclid || undefined,
                li_fat_id: formData.li_fat_id || undefined,
                metaFbp: formData.metaFbp || undefined,
                gaClientId: formData.gaClientId || undefined,
                gaSessionId: formData.gaSessionId || undefined,
                msclkid: formData.msclkid || undefined,
                consentStatus: formData.consentStatus,
                consentTimestamp: formData.consentTimestamp || undefined,
                adStorageConsent: formData.adStorageConsent,
                adUserDataConsent: formData.adUserDataConsent,
                adPersonalizationConsent: formData.adPersonalizationConsent,
                analyticsStorageConsent: formData.analyticsStorageConsent,
            });

            // Reset form
            setFormData({
                title: '',
                description: '',
                priority: 'MEDIUM',
                value: '',
                campaign: '',
                trafficSource: '',
                note: '',
                email: '',
                phone: '',
                qualification: 'UNQUALIFIED',
                tags: [],
                websiteUrl: '',
                landingPageUrl: '',
                path: '',
                referrerUrl: '',
                utmSource: '',
                utmMedium: '',
                utmCampaign: '',
                gclid: '',
                fbclid: '',
                li_fat_id: '',
                metaFbp: '',
                gaClientId: '',
                gaSessionId: '',
                msclkid: '',
                firstSeenAt: '',
                consentTimestamp: '',
                currency: 'EUR',
                isManual: true,
                consentStatus: 'UNKNOWN',
                adStorageConsent: false,
                adUserDataConsent: false,
                adPersonalizationConsent: false,
                analyticsStorageConsent: false,
            });

            onClose();
        } catch (error) {
            console.error('Error saving lead:', error);
            alert('Failed to save lead. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Lead to {stageName}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <Tabs defaultValue="contact" className="w-full">
                        <TabsList className="grid w-full grid-cols-5 mb-6">
                            <TabsTrigger value="contact" className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Contact
                            </TabsTrigger>
                            <TabsTrigger value="details" className="flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Details
                            </TabsTrigger>
                            <TabsTrigger value="tracking" className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                Tracking
                            </TabsTrigger>
                            <TabsTrigger value="urls" className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                URLs
                            </TabsTrigger>
                            <TabsTrigger value="consent" className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Consent
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="contact" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Contact Information</CardTitle>
                                    <CardDescription>
                                        Basic contact details for the lead
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            value={formData.title}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                            placeholder="Enter lead name"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                placeholder="+1234567890"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            placeholder="Enter lead description"
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="details" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Lead Details</CardTitle>
                                    <CardDescription>
                                        Qualification and priority information
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="priority">Priority</Label>
                                            <Select
                                                value={formData.priority}
                                                onValueChange={(value) => handleInputChange('priority', value as CardType['priority'])}
                                                options={[
                                                    { value: 'LOW', label: 'Low' },
                                                    { value: 'MEDIUM', label: 'Medium' },
                                                    { value: 'HIGH', label: 'High' }
                                                ]}
                                                placeholder="Select priority"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="qualification">Qualification</Label>
                                            <Select
                                                value={formData.qualification}
                                                onValueChange={(value) => handleInputChange('qualification', value as CardType['qualification'])}
                                                options={[
                                                    { value: 'UNQUALIFIED', label: 'Unqualified' },
                                                    { value: 'NEEDS_REVIEW', label: 'Needs Review' },
                                                    { value: 'QUALIFIED', label: 'Qualified' }
                                                ]}
                                                placeholder="Select qualification"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="value">Value (€)</Label>
                                            <Input
                                                id="value"
                                                type="number"
                                                value={formData.value}
                                                onChange={(e) => handleInputChange('value', e.target.value)}
                                                placeholder="50000"
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="campaign">Campaign</Label>
                                            <Input
                                                id="campaign"
                                                value={formData.campaign}
                                                onChange={(e) => handleInputChange('campaign', e.target.value)}
                                                placeholder="Campaign name"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Tags</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {formData.tags.map((tag, index) => (
                                                <Badge key={index} variant="secondary">
                                                    {tag}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveTag(tag)}
                                                        className="ml-1 h-4 w-4 p-0 hover:text-red-500"
                                                    >
                                                        ×
                                                    </Button>
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                value={newTag}
                                                onChange={(e) => setNewTag(e.target.value)}
                                                placeholder="Add a tag"
                                                className="flex-1"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddTag();
                                                    }
                                                }}
                                            />
                                            <Button type="button" onClick={handleAddTag} size="sm">
                                                Add
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="note">Notes</Label>
                                        <Textarea
                                            id="note"
                                            value={formData.note}
                                            onChange={(e) => handleInputChange('note', e.target.value)}
                                            placeholder="Additional notes about this lead..."
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="tracking" className="space-y-6">
                            <div className="grid gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>UTM Parameters</CardTitle>
                                        <CardDescription>
                                            Campaign tracking information
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="utmSource">UTM Source</Label>
                                                <Input
                                                    id="utmSource"
                                                    value={formData.utmSource}
                                                    onChange={(e) => handleInputChange('utmSource', e.target.value)}
                                                    placeholder="google, facebook"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="utmMedium">UTM Medium</Label>
                                                <Input
                                                    id="utmMedium"
                                                    value={formData.utmMedium}
                                                    onChange={(e) => handleInputChange('utmMedium', e.target.value)}
                                                    placeholder="cpc, email"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="utmCampaign">UTM Campaign</Label>
                                                <Input
                                                    id="utmCampaign"
                                                    value={formData.utmCampaign}
                                                    onChange={(e) => handleInputChange('utmCampaign', e.target.value)}
                                                    placeholder="Campaign name"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Platform Tracking IDs</CardTitle>
                                        <CardDescription>
                                            Platform-specific tracking identifiers
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="gclid">Google Click ID (gclid)</Label>
                                                <Input
                                                    id="gclid"
                                                    value={formData.gclid}
                                                    onChange={(e) => handleInputChange('gclid', e.target.value)}
                                                    placeholder="Google Ads click ID"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="fbclid">Facebook Click ID (fbclid)</Label>
                                                <Input
                                                    id="fbclid"
                                                    value={formData.fbclid}
                                                    onChange={(e) => handleInputChange('fbclid', e.target.value)}
                                                    placeholder="Facebook click ID"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="li_fat_id">LinkedIn Tracking ID</Label>
                                                <Input
                                                    id="li_fat_id"
                                                    value={formData.li_fat_id}
                                                    onChange={(e) => handleInputChange('li_fat_id', e.target.value)}
                                                    placeholder="LinkedIn first-party ad tracking ID"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="msclkid">Microsoft Click ID</Label>
                                                <Input
                                                    id="msclkid"
                                                    value={formData.msclkid}
                                                    onChange={(e) => handleInputChange('msclkid', e.target.value)}
                                                    placeholder="Microsoft Ads click ID"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="metaFbp">Meta Browser ID</Label>
                                                <Input
                                                    id="metaFbp"
                                                    value={formData.metaFbp}
                                                    onChange={(e) => handleInputChange('metaFbp', e.target.value)}
                                                    placeholder="Meta/Facebook browser ID"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="gaClientId">Google Analytics Client ID</Label>
                                                <Input
                                                    id="gaClientId"
                                                    value={formData.gaClientId}
                                                    onChange={(e) => handleInputChange('gaClientId', e.target.value)}
                                                    placeholder="GA client ID"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="gaSessionId">Google Analytics Session ID</Label>
                                                <Input
                                                    id="gaSessionId"
                                                    value={formData.gaSessionId}
                                                    onChange={(e) => handleInputChange('gaSessionId', e.target.value)}
                                                    placeholder="GA session ID"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="currency">Currency</Label>
                                                <Input
                                                    id="currency"
                                                    value={formData.currency}
                                                    onChange={(e) => handleInputChange('currency', e.target.value)}
                                                    placeholder="EUR"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="urls" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>URLs</CardTitle>
                                    <CardDescription>
                                        Website and landing page information
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="websiteUrl">Website URL</Label>
                                        <Input
                                            id="websiteUrl"
                                            type="url"
                                            value={formData.websiteUrl}
                                            onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="landingPageUrl">Landing Page URL</Label>
                                        <Input
                                            id="landingPageUrl"
                                            type="url"
                                            value={formData.landingPageUrl}
                                            onChange={(e) => handleInputChange('landingPageUrl', e.target.value)}
                                            placeholder="https://example.com/landing"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="path">Page Path</Label>
                                        <Input
                                            id="path"
                                            value={formData.path}
                                            onChange={(e) => handleInputChange('path', e.target.value)}
                                            placeholder="/Order/EditSample"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="referrerUrl">Referrer URL</Label>
                                        <Input
                                            id="referrerUrl"
                                            type="url"
                                            value={formData.referrerUrl}
                                            onChange={(e) => handleInputChange('referrerUrl', e.target.value)}
                                            placeholder="https://referrer.com"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="consent" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Consent Information</CardTitle>
                                    <CardDescription>
                                        Privacy and consent settings
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="consentStatus">Overall Status</Label>
                                        <Select
                                            value={formData.consentStatus}
                                            onValueChange={(value) => handleInputChange('consentStatus', value as CardType['consentStatus'])}
                                            options={[
                                                { value: 'UNKNOWN', label: 'Unknown' },
                                                { value: 'GRANTED', label: 'Granted' },
                                                { value: 'DENIED', label: 'Denied' },
                                                { value: 'PARTIAL', label: 'Partial' }
                                            ]}
                                            placeholder="Select consent status"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-2 pt-6">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {isLoading ? 'Adding...' : 'Add Lead'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}; 