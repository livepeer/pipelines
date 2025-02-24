import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/design-system/components/ui/alert-dialog";

const ConfirmDialog = ({
  title,
  prompt,
  cancelMessage,
  okMessage,
  callback,
  open,
  onClose,
}: {
  title: string;
  prompt: string;
  cancelMessage?: string;
  okMessage?: string;
  callback: () => void;
  open: boolean;
  onClose: () => void;
}) => {
  return (
    <AlertDialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{prompt}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            {cancelMessage ?? "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction onClick={callback} className="bg-red-500">
            {okMessage ?? "Ok"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;
