"use client";

import { useState } from "react";
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

import { PlusIcon, XIcon } from "lucide-react";

interface Parameter {
  nodeId: string;
  field: string;
  name: string;
  description: string;
}

interface PipelineParamsSelectorProps {
  formData: Record<string, unknown>;
  onBack: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

export default function PipelineParamsSelector({
  formData,
  onBack,
  onSubmit,
  isSubmitting,
}: PipelineParamsSelectorProps) {
  const [parameters, setParameters] = useState<Parameter[]>(() => {
    if (formData.prioritized_params) {
      try {
        const parsedParams = typeof formData.prioritized_params === 'string' 
          ? JSON.parse(formData.prioritized_params)
          : formData.prioritized_params;
        return parsedParams.map((param: any) => ({
          nodeId: param.nodeId,
          field: param.field,
          name: param.name,
          description: param.description || ''
        }));
      } catch (e) {
        console.error('Error parsing prioritized params:', e);
        return [];
      }
    }
    return [];
  });

  const comfyJson = typeof formData.comfyJson === 'string' 
    ? JSON.parse(formData.comfyJson) 
    : formData.comfyJson;

  const nodes = Object.entries(comfyJson).map(([nodeId, node]: [string, any]) => ({
    id: nodeId,
    classType: node.class_type,
    fields: Object.keys(node.inputs || {})
  }));

  const addParameter = () => {
    if (parameters.length >= 5) {
      return;
    }
    setParameters([...parameters, {
      nodeId: "",
      field: "",
      name: "",
      description: ""
    }]);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const updateParameter = (index: number, field: keyof Parameter, value: string) => {
    const newParameters = [...parameters];
    newParameters[index] = {
      ...newParameters[index],
      [field]: value
    };
    setParameters(newParameters);
  };

  const handleSubmit = () => {
    // Save path to each parameter
    const parameterPaths = parameters.map(param => {
      const path = [
        param.nodeId,           
        param.field,           
        param.name             
      ].filter(Boolean);     
      
      return {
        ...param,
        path: path.join('/'),
      };
    });

    const updatedFormData = {
      ...formData,
      prioritized_params: JSON.stringify(parameterPaths),
    };

    onSubmit(updatedFormData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium">Step 2: Parameter Display</h4>
        <p className="text-sm text-muted-foreground mt-1">
          Select up to 5 important parameters that should always be visible for users.
          All other parameters will be available, but collapsed by default.
        </p>
      </div>

      <div className="space-y-4">
        {parameters.map((param, index) => (
          <div key={index} className="flex gap-4 items-start">
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Node</Label>
                  <Select
                    value={param.nodeId}
                    onValueChange={(value) => updateParameter(index, "nodeId", value)}
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
                </div>

                <div>
                  <Label>Field</Label>
                  <Select
                    value={param.field}
                    onValueChange={(value) => updateParameter(index, "field", value)}
                    disabled={!param.nodeId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {param.nodeId && 
                        nodes
                          .find(n => n.id === param.nodeId)
                          ?.fields.map((field) => (
                            <SelectItem key={field} value={field}>
                              {field}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Display Name</Label>
                  <Input
                    value={param.name}
                    onChange={(e) => updateParameter(index, "name", e.target.value)}
                    placeholder="Parameter name"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Input
                    value={param.description}
                    onChange={(e) => updateParameter(index, "description", e.target.value)}
                    placeholder="Parameter description"
                  />
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeParameter(index)}
              className="mt-6"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {parameters.length < 5 && (
          <Button
            variant="outline"
            onClick={addParameter}
            className="w-full"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Parameter
          </Button>
        )}
      </div>

      <div className="flex space-x-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="uppercase text-xs"
        >
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || parameters.length === 0}
          className="uppercase text-xs"
        >
          Create
        </Button>
      </div>
    </div>
  );
} 