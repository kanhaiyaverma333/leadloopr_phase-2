import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
    label: string;
    color?: string; // Tailwind or custom color class
}

export function StatusBadge({ label, color }: StatusBadgeProps) {
    return (
        <Badge
            className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                color ? color : "bg-gray-400 text-white hover:bg-gray-500"
            )}
        >
            {label}
        </Badge>
    );
} 