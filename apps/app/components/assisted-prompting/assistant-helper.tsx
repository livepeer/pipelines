import { Button } from "@repo/design-system/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@repo/design-system/lib/utils";

interface AssistantHelperProps {
  onClose: () => void;
  className?: string;
}

function AssistantHelper({ onClose, className }: AssistantHelperProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "absolute bottom-full left-0 mb-2 w-64 bg-popover rounded-md border shadow-md z-50 p-3 pt-0 space-y-2",
          className,
        )}
      >
        {/* Triangle pointer */}
        <div className="absolute bottom-[-6px] left-3 w-3 h-3 bg-popover border-r border-b transform rotate-45 border-inherit"></div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-1 right-2 h-6 w-6 rounded-full p-0 bg-popover"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>

        <h4 className="text-sm font-medium">Welcome to Daydream ⭐</h4>

        <p className="text-sm text-muted-foreground leading-relaxed">
          New to prompting? Turn on the assisted mode to create
          amazing transformations with plain English.
        </p>
      </motion.div>
    </AnimatePresence>
  );
}

export default AssistantHelper;
