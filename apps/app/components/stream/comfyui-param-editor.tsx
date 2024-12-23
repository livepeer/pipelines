import React, { useEffect, useState } from "react";
import { Input } from "@repo/design-system/components/ui/input";
import { Switch } from "@repo/design-system/components/ui/switch";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Label } from "@repo/design-system/components/ui/label";
import { cn } from "@repo/design-system/lib/utils";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { ScrollArea } from "@repo/design-system/components/ui/scroll-area";

interface ComfyNodeParams {
    inputs?: Record<string, any>;
    class_type?: string;
    [key: string]: any;
}

interface ComfyUIConfig {
    [key: string]: ComfyNodeParams;
}

const ComfyUIParamsEditor = ({
                                 value,
                                 onChange,
                             }: {
    value: string | object;
    onChange: (value: string | object) => void;
}) => {
    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
        {}
    );
    const [isJsonMode, setIsJsonMode] = useState(false);
    const [invalidJsonMessage, setInvalidJsonMessage] = useState<string | null>(null);
    const [currentJsonString, setCurrentJsonString] = useState<string>(
        typeof value === "string" ? value : JSON.stringify(value, null, 2)
    );

    useEffect(() => {
        setCurrentJsonString(
            typeof value === "string" ? value : JSON.stringify(value, null, 2)
        );
    }, [value]);

    const toggleNode = (nodeId: string) => {
        setExpandedNodes((prev) => ({
            ...prev,
            [nodeId]: !prev[nodeId],
        }));
    };

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newJsonString = e.target.value;
        try {
            const parsed = JSON.parse(newJsonString);
            onChange(parsed);
            setCurrentJsonString(newJsonString);
            setInvalidJsonMessage(null);
        } catch (error: any) {
            setInvalidJsonMessage(error.message);
        }
    };

    const handleParamChange = (
        nodeId: string,
        category: string,
        paramKey: string,
        newValue: any
    ) => {
        try {
            const currentConfig: ComfyUIConfig =
                typeof value === "string" ? JSON.parse(value) : value;
            const updatedConfig = {
                ...currentConfig,
                [nodeId]: {
                    ...currentConfig[nodeId],
                    [category]: {
                        ...currentConfig[nodeId][category],
                        [paramKey]: newValue,
                    },
                },
            };
            onChange(updatedConfig);
        } catch (error) {
            console.error("Error updating parameter:", error);
        }
    };

    const renderParamInput = (
        nodeId: string,
        category: string,
        paramKey: string,
        paramValue: any
    ) => {
        if (typeof paramValue === "number") {
            return (
                <Input
                    type="number"
                    value={paramValue}
                    onChange={(e) =>
                        handleParamChange(
                            nodeId,
                            category,
                            paramKey,
                            parseFloat(e.target.value)
                        )
                    }
                    className="w-full"
                />
            );
        } else if (typeof paramValue === "string") {
            return (
                <Input
                    type="text"
                    value={paramValue}
                    onChange={(e) =>
                        handleParamChange(nodeId, category, paramKey, e.target.value)
                    }
                    className="w-full"
                />
            );
        } else if (typeof paramValue === "boolean") {
            return (
                <Switch
                    checked={paramValue}
                    onCheckedChange={(checked) =>
                        handleParamChange(nodeId, category, paramKey, checked)
                    }
                />
            );
        }
        return null;
    };

    const renderNodeParams = () => {
        try {
            const config: ComfyUIConfig =
                typeof value === "string" ? JSON.parse(value) : value;
            return Object.entries(config).map(([nodeId, nodeData]) => (
                <div key={nodeId} className="border p-4 mb-4">
                    <button
                        onClick={() => toggleNode(nodeId)}
                        className="flex items-center gap-2 w-full text-left"
                    >
                        <motion.div
                            animate={{ rotate: expandedNodes[nodeId] ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown className="h-4 w-4" />
                        </motion.div>
                        <span className="font-medium">
                            {nodeData.class_type || `Node ${nodeId}`}
                        </span>
                    </button>

                    <AnimatePresence>
                        {expandedNodes[nodeId] && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                {Object.entries(nodeData).map(([category, categoryData]) => {
                                    if (
                                        typeof categoryData === "object" &&
                                        categoryData !== null
                                    ) {
                                        return (
                                            <div key={category} className="mt-2">
                                                <Label className="text-muted-foreground capitalize">
                                                    {category}
                                                </Label>
                                                <div className="space-y-2 mt-1">
                                                    {Object.entries(categoryData).map(
                                                        ([paramKey, paramValue]) => (
                                                            <div
                                                                key={paramKey}
                                                                className="flex flex-col gap-1"
                                                            >
                                                                <Label className="text-sm">
                                                                    {paramKey}
                                                                </Label>
                                                                {renderParamInput(
                                                                    nodeId,
                                                                    category,
                                                                    paramKey,
                                                                    paramValue
                                                                )}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ));
        } catch (error) {
            return <div className="text-red-500">Invalid JSON format</div>;
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <Label className="text-muted-foreground">Edit Mode</Label>
                <div className="flex items-center gap-2">
                    <Label className={cn("text-sm", !isJsonMode && "text-primary")}>
                        UI
                    </Label>
                    <Switch checked={isJsonMode} onCheckedChange={setIsJsonMode} />
                    <Label className={cn("text-sm", isJsonMode && "text-primary")}>
                        JSON
                    </Label>
                </div>
            </div>

            {isJsonMode ? (
                <>
                    <Textarea
                        className="font-mono h-[400px] text-sm"
                        value={currentJsonString}
                        onChange={handleJsonChange}
                        placeholder="Enter JSON configuration..."
                    />
                    {invalidJsonMessage && (
                        <div className="text-red-500 text-sm">You attempted to add invalid character to the JSON.  These have been reverted.  The error was: {invalidJsonMessage}</div>
                    )}
                </>
            ) : (
                <ScrollArea className="h-[400px] border p-4">
                    {renderNodeParams()}
                </ScrollArea>
            )}
        </div>
    );
};

export default ComfyUIParamsEditor;
