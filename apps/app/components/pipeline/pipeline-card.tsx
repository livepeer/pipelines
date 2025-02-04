"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { XIcon } from "lucide-react";

export interface WidgetConfig {
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
}

export interface Parameter {
  nodeId: string;
  field: string;
  name: string;
  description: string;
  widget: string;
  widgetConfig: WidgetConfig;
  optionsText?: string;
  classType: string;
}

export interface ParameterValidationError {
  nodeId?: string;
  field?: string;
  name?: string;
  widget?: string;
  widgetConfig?: {
    min?: string;
    max?: string;
    step?: string;
    options?: string;
  };
}

interface PipelineCardProps {
  index: number;
  parameter: Parameter;
  errors?: ParameterValidationError;
  nodes: { id: string; classType: string; fields: string[] }[];
  onUpdateParameter: (index: number, field: keyof Parameter, value: string) => void;
  onUpdateWidgetConfig: (index: number, config: Partial<WidgetConfig>) => void;
  onRemove: (index: number) => void;
  onWidgetTypeChange: (index: number, value: string) => void;
}

export default function PipelineCard({
  index,
  parameter,
  errors,
  nodes,
  onUpdateParameter,
  onUpdateWidgetConfig,
  onRemove,
  onWidgetTypeChange,
}: PipelineCardProps) {
  return (
    <div className="border rounded p-4 mb-4 shadow-sm">
      <div className="flex justify-between items-start">
        <h5 className="font-semibold">Parameter {index + 1}</h5>
        <Button variant="ghost" size="icon" onClick={() => onRemove(index)}>
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 space-y-4">
        {/* Main parameter fields */}
        <div className="grid grid-cols-5 gap-4">
          <div>
            <Label>Node</Label>
            <Select
              value={parameter.nodeId}
              onValueChange={(value) => onUpdateParameter(index, "nodeId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select node" />
              </SelectTrigger>
              <SelectContent>
                {nodes.map((node) => (
                  <SelectItem key={node.id} value={node.id}>
                    {node.classType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors?.nodeId && (
              <p className="text-xs text-red-600 mt-1">{errors.nodeId}</p>
            )}
          </div>
          <div>
            <Label>Field</Label>
            <Select
              value={parameter.field}
              onValueChange={(value) => onUpdateParameter(index, "field", value)}
              disabled={!parameter.nodeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {parameter.nodeId &&
                  nodes
                    .find((n) => n.id === parameter.nodeId)
                    ?.fields.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
            {errors?.field && (
              <p className="text-xs text-red-600 mt-1">{errors.field}</p>
            )}
          </div>
          <div>
            <Label>Display Name</Label>
            <Input
              value={parameter.name}
              onChange={(e) => onUpdateParameter(index, "name", e.target.value)}
              placeholder="Parameter name"
            />
            {errors?.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={parameter.description}
              onChange={(e) =>
                onUpdateParameter(index, "description", e.target.value)
              }
              placeholder="Parameter description"
            />
          </div>
          <div>
            <Label>Widget Type</Label>
            <Select
              value={parameter.widget}
              onValueChange={(value) => onWidgetTypeChange(index, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select widget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="textarea">Text Area</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="slider">Slider</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
                <SelectItem value="select">Dropdown</SelectItem>
              </SelectContent>
            </Select>
            {errors?.widget && (
              <p className="text-xs text-red-600 mt-1">{errors.widget}</p>
            )}
          </div>
        </div>

        {/* Slider or Number widget configuration */}
        {(parameter.widget === "slider" || parameter.widget === "number") && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Minimum</Label>
              <Input
                type="number"
                value={parameter.widgetConfig.min ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateWidgetConfig(index, { min: val === "" ? undefined : parseFloat(val) });
                }}
                placeholder="Min value"
              />
              {errors?.widgetConfig?.min && (
                <p className="text-xs text-red-600 mt-1">{errors.widgetConfig.min}</p>
              )}
            </div>
            <div>
              <Label>Maximum</Label>
              <Input
                type="number"
                value={parameter.widgetConfig.max ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateWidgetConfig(index, { max: val === "" ? undefined : parseFloat(val) });
                }}
                placeholder="Max value"
              />
              {errors?.widgetConfig?.max && (
                <p className="text-xs text-red-600 mt-1">{errors.widgetConfig.max}</p>
              )}
            </div>
            <div>
              <Label>Step</Label>
              <Input
                type="number"
                value={parameter.widgetConfig.step ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateWidgetConfig(index, { step: val === "" ? undefined : parseFloat(val) });
                }}
                placeholder="Step size"
              />
              {errors?.widgetConfig?.step && (
                <p className="text-xs text-red-600 mt-1">{errors.widgetConfig.step}</p>
              )}
            </div>
          </div>
        )}

        {/* Select widget configuration */}
        {parameter.widget === "select" && (
          <div>
            <Label>Options (one per line, format: label=value)</Label>
            <Textarea
              rows={3}
              value={parameter.optionsText || ""}
              onChange={(e) => {
                const text = e.target.value;
                const newOptions = text
                  .split("\n")
                  .filter((line) => line.trim() !== "")
                  .map((line) => {
                    const [label, value] = line.split("=", 2);
                    return {
                      label: label.trim(),
                      value: (value || label).trim(),
                    };
                  });
                onUpdateParameter(index, "optionsText", text);
                onUpdateWidgetConfig(index, { options: newOptions });
              }}
              placeholder={`Option 1=value1
Option 2=value2`}
              className="font-mono"
            />
            {errors?.widgetConfig?.options && (
              <p className="text-xs text-red-600 mt-1">{errors.widgetConfig.options}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}