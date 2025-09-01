// Re-export from the local marketing ui implementation if present; otherwise provide stubs
import { toast as sonnerToast } from "sonner";

type ToastFn = (message: string) => void;

export const useToast = () => {
    return {
        toasts: [] as Array<unknown>,
    } as any;
};

export const toast: ToastFn = (message: string) => sonnerToast(message);

export { useToast, toast };
