'use client'

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader
} from "@/components/ui/card";
import { Card as CardType } from "./types";
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { integrations } from "../integrations";

interface LeadCardProps {
    card: CardType;
    onClick?: () => void;
}

const priorityConfig = {
    LOW: { color: "bg-gray-100 text-gray-700" },
    MEDIUM: { color: "bg-blue-100 text-blue-700" },
    HIGH: { color: "bg-red-100 text-red-700" }
};

export const LeadCard = ({ card, onClick }: LeadCardProps) => {

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: card.id,
        data: {
            type: 'card',
            card
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    const formatTimeAgo = (dateString?: string) => {
        if (!dateString) return null;
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
            if (diffInHours < 1) return "Just now";
            if (diffInHours < 24) return `${diffInHours}h ago`;
            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays < 7) return `${diffInDays}d ago`;
            return date.toLocaleDateString();
        } catch {
            return null;
        }
    };

    function getSyncCountdown(createdAtString?: string): string {
        if (!createdAtString) return "No date provided";

        const createdAt = new Date(createdAtString);
        const deadline = new Date(createdAt.getTime() + 90 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const diffInMs = deadline.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

        if (isNaN(daysLeft)) return "Invalid date";

        return daysLeft > 0
            ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
            : "Sync expired";
    }



    const renderTags = () => {
        if (!card.tags || card.tags.length === 0) return null;

        const displayTags = card.tags.slice(0, 2);
        const remainingCount = card.tags.length - 2;

        return (
            <div className="flex flex-wrap gap-1">
                {displayTags.map((tag, index) => (
                    <Badge
                        key={index}
                        variant="outline"
                        className="text-2xs px-1.5 py-0.5 rounded-full border-border text-muted-foreground"
                    >
                        {tag}
                    </Badge>
                ))}
                {remainingCount > 0 && (
                    <Badge
                        variant="outline"
                        className="text-2xs px-1.5 py-0.5 rounded-full border-border text-muted-foreground"
                    >
                        +{remainingCount}
                    </Badge>
                )}
            </div>
        );
    };

    const getIcon = (gclid?: String, fbclid?: String) => {

        if (gclid) {
            return <img src={integrations?.outgoing[0].icon} alt="Google Icon" className="w-4 h-4 mr-2" />
        } else if (fbclid) {
            return <img src={integrations?.outgoing[2].icon} alt="Facebook Icon" className="w-4 h-4 mr-2" />
        } else {
            return <img src={integrations?.outgoing[3].icon} alt="Lead Icon" className="w-4 h-4 mr-2" />
        }

    }


    console.log("Rendering LeadCard for:", card.stageName);


    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="hover:shadow-md transition-all duration-200 cursor-pointer cursor-grab active:cursor-grabbing"
            onClick={onClick}
        >
            <div className="flex justify-between items-start px-4 pt-3">
                {/* Name top left, vertically aligned */}
                <h3 className="font-semibold text-sm leading-tight truncate mr-2 mt-0.5">
                    {card.title}
                </h3>
                {/* Priority badge and tags top right */}
                <div className="flex flex-col items-end min-w-[60px]">
                    <Badge
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium h-5 mb-1 ${priorityConfig[card.priority].color}`}
                        variant="secondary"
                    >
                        {card.priority}
                    </Badge>

                    {card.tags && card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-end">
                            {card.tags.slice(0, 2).map((tag, index) => (
                                <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-[10px] px-1 py-0.5 rounded-full border-border text-muted-foreground h-5"
                                >
                                    {tag}
                                </Badge>
                            ))}
                            {card.tags.length > 2 && (
                                <Badge
                                    variant="outline"
                                    className="text-[10px] px-1 py-0.5 rounded-full border-border text-muted-foreground h-5"
                                >
                                    +{card.tags.length - 2}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <CardContent className="pt-2 px-4 pb-3 space-y-2">
                {/* Contact Information */}
                <div className="space-y-1">
                    <div className="text-xs text-muted-foreground truncate">
                        {card.email || "No email"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                        {card.phone || "No phone"}
                    </div>


                </div>
                <div className="flex items-end justify-end">
                    {getIcon(card.gclid, card.fbclid)}
                </div>
                {/* Value and Timestamp */}
                <div className="flex justify-between items-center">

                    {/* <div className="text-xs font-medium text-green-600">
                        {card.value ? `€${card.value}` : "No value set"}
                    </div> */}
                    <div className="text-xs text-muted-foreground">
                        {formatTimeAgo(card.createdAt)}
                    </div>
                    {(card?.stageName ? ["Proposal"].includes(card.stageName) : false) && card?.createdAt && (
                        <div className="text-xs text-muted-foreground">
                            {getSyncCountdown(card.createdAt)}
                        </div>
                    )}


                </div>
            </CardContent>
        </Card>
    );
}; 