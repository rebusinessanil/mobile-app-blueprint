import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteAccountModal({ open, onOpenChange }: DeleteAccountModalProps) {
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmValid = confirmText.toLowerCase() === "delete" && acknowledged;

  const handleDelete = async () => {
    if (!isConfirmValid) return;
    
    setIsDeleting(true);

    try {
      // Call the delete-account edge function
      const { data, error } = await supabase.functions.invoke('delete-account');

      if (error) {
        console.error('Delete account error:', error);
        toast.error('Failed to delete account. Please try again.');
        setIsDeleting(false);
        return;
      }

      if (!data?.success) {
        toast.error(data?.error || 'Failed to delete account');
        setIsDeleting(false);
        return;
      }

      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();

      // Sign out
      await supabase.auth.signOut();

      // Show success message
      toast.success('Your account has been permanently deleted.');

      // Close modal and redirect
      onOpenChange(false);
      navigate('/login', { replace: true });

    } catch (err) {
      console.error('Unexpected error during account deletion:', err);
      toast.error('An unexpected error occurred. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmText("");
    setAcknowledged(false);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="bg-card border-destructive/50 max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl text-destructive">
              Delete Account Permanently
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-foreground/80 space-y-3">
            <p className="font-medium text-destructive">
              ⚠️ This action is IRREVERSIBLE
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All your profile data will be permanently deleted</li>
              <li>All your banners, downloads, and credits will be removed</li>
              <li>Your transaction history will be erased</li>
              <li>You will NOT be able to use this email to create a new account</li>
              <li>This action cannot be undone</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Acknowledgment checkbox */}
          <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/30">
            <Checkbox
              id="acknowledge"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
              className="border-destructive data-[state=checked]:bg-destructive data-[state=checked]:text-white mt-0.5"
            />
            <label htmlFor="acknowledge" className="text-sm text-foreground cursor-pointer">
              I understand that this action is permanent and I will lose all my data. 
              I also understand that I cannot use this email address to create a new account.
            </label>
          </div>

          {/* Confirmation input */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">
              Type <span className="font-bold text-destructive">DELETE</span> to confirm:
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="border-destructive/50 focus:border-destructive"
              disabled={isDeleting}
            />
          </div>
        </div>

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel 
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isConfirmValid || isDeleting}
            className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Deleting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Forever
              </span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
