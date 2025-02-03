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
import { Textarea } from "@repo/design-system/components/ui/textarea";

import { PlusIcon, XIcon } from "lucide-react";

interface WidgetConfig {
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
}

interface Parameter {
  nodeId: string;
  field: string;
  name: string;
  description: string;
  widget: string;
  widgetConfig: WidgetConfig;
  optionsText?: string;
}

interface PipelineParamsSelectorProps {
  formData: Record<string, unknown>;
  onBack: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

interface ParameterValidationError {
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
        
        const mappedParameters = parsedParams.map((param: any) => {
          const widgetType = (param.widget || "text").toLowerCase().trim();

          const parameter: Parameter = {
            nodeId: param.nodeId,
            field: param.field,
            name: param.name,
            description: param.description || '',
            widget: widgetType,
            widgetConfig: {},
            optionsText: ''
          };

          if (widgetType === 'slider' || widgetType === 'number') {
            parameter.widgetConfig = {
              min: param.widgetConfig?.min ?? 0,
              max: param.widgetConfig?.max ?? 100,
              step: param.widgetConfig?.step ?? 1
            };
          } else if (widgetType === 'select') {
            parameter.widgetConfig = {
              options: param.widgetConfig?.options || []
            };
            parameter.optionsText = param.widgetConfig?.options
              ?.map((opt: any) => `${opt.label}=${opt.value}`)
              .join('\n') || '';
          }

          return parameter;
        });
        
        return mappedParameters;
      } catch (e) {
        console.error('Error parsing prioritized params:', e);
        return [];
      }
    }
    return [];
  });

  const [validationErrors, setValidationErrors] = useState<ParameterValidationError[]>([]);

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
    setParameters([
      ...parameters,
      {
        nodeId: "",
        field: "",
        name: "",
        description: "",
        widget: "text",
        widgetConfig: {},
        optionsText: "",
      },
    ]);
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

  const updateWidgetConfig = (index: number, config: Partial<WidgetConfig>) => {
    const newParameters = [...parameters];
    newParameters[index] = {
      ...newParameters[index],
      widgetConfig: {
        ...newParameters[index].widgetConfig,
        ...config
      }
    };
    setParameters(newParameters);
  };

  const validateParameter = (param: Parameter): ParameterValidationError => {
    const error: ParameterValidationError = {};
    
    if (!param.nodeId) error.nodeId = "Node is required.";
    if (!param.field) error.field = "Field is required.";
    if (!param.name) error.name = "Display name is required.";
    if (!param.widget) error.widget = "Widget type is required.";

    if (param.widget === 'slider' || param.widget === 'number') {
      const { min, max, step } = param.widgetConfig;
      
      if (min === undefined || isNaN(min)) {
        error.widgetConfig = error.widgetConfig || {};
        error.widgetConfig.min = "Minimum is required and must be a number.";
      }
      if (max === undefined || isNaN(max)) {
        error.widgetConfig = error.widgetConfig || {};
        error.widgetConfig.max = "Maximum is required and must be a number.";
      }
      if (step === undefined || isNaN(step)) {
        error.widgetConfig = error.widgetConfig || {};
        error.widgetConfig.step = "Step size is required and must be a number.";
      }
    }

    if (param.widget === 'select') {
      const hasValidOptions = param.widgetConfig.options?.some(
        opt => opt.label.trim() !== '' || opt.value.trim() !== ''
      );
      
      if (!hasValidOptions) {
        error.widgetConfig = { options: "At least one option is required." };
      }
    }

    return error;
  };

  const handleSubmit = () => {
    const errors = parameters.map(validateParameter);
    const isValid = errors.every(err => Object.keys(err).length === 0);
    
    if (!isValid) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);

    const parameterPaths = parameters.map(param => {
      const path = [param.nodeId, param.field, param.name].filter(Boolean).join('/');
      return {
        nodeId: param.nodeId,
        field: param.field,
        name: param.name,
        description: param.description,
        widget: param.widget,
        widgetConfig: param.widgetConfig,
        path
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
        {parameters.map((param, index) => {
          const errorsForParam = validationErrors[index] || {};
          return (
            <div key={index} className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-5 gap-4">
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
                      {errorsForParam.nodeId && (
                        <p className="text-xs text-red-600 mt-1">{errorsForParam.nodeId}</p>
                      )}
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
                            nodes.find(n => n.id === param.nodeId)
                              ?.fields
                              .map((field) => (
                                  <SelectItem key={field} value={field}>
                                    {field}
                                  </SelectItem>
                              ))
                          }
                        </SelectContent>
                      </Select>
                      {errorsForParam.field && (
                        <p className="text-xs text-red-600 mt-1">{errorsForParam.field}</p>
                      )}
                    </div>

                    <div>
                      <Label>Display Name</Label>
                      <Input
                        value={param.name}
                        onChange={(e) => updateParameter(index, "name", e.target.value)}
                        placeholder="Parameter name"
                      />
                      {errorsForParam.name && (
                        <p className="text-xs text-red-600 mt-1">{errorsForParam.name}</p>
                      )}
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Input
                        value={param.description}
                        onChange={(e) => updateParameter(index, "description", e.target.value)}
                        placeholder="Parameter description"
                      />
                    </div>

                    <div>
                      <Label>Widget Type</Label>
                      <Select
                        value={param.widget}
                        onValueChange={(value) => {
                          setParameters((prevParameters) => {
                            const newParameters = [...prevParameters];
                            newParameters[index] = {
                              ...newParameters[index],
                              widget: value,
                              widgetConfig:
                                value === 'slider' || value === 'number'
                                  ? { min: 0, max: 100, step: 1 }
                                  : value === 'select'
                                  ? { options: [] }
                                  : {},
                            };
                            return newParameters;
                          });
                        }}
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
                      {errorsForParam.widget && (
                        <p className="text-xs text-red-600 mt-1">{errorsForParam.widget}</p>
                      )}
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

              {(param.widget === 'slider' || param.widget === 'number') && (
                <div className="ml-4 grid grid-cols-3 gap-4">
                  <div>
                    <Label>Minimum</Label>
                    <Input
                      type="number"
                      value={param.widgetConfig.min ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateWidgetConfig(index, { min: val === '' ? undefined : parseFloat(val) });
                      }}
                      placeholder="Min value"
                    />
                    {errorsForParam.widgetConfig?.min && (
                      <p className="text-xs text-red-600 mt-1">{errorsForParam.widgetConfig.min}</p>
                    )}
                  </div>
                  <div>
                    <Label>Maximum</Label>
                    <Input
                      type="number"
                      value={param.widgetConfig.max ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateWidgetConfig(index, { max: val === '' ? undefined : parseFloat(val) });
                      }}
                      placeholder="Max value"
                    />
                    {errorsForParam.widgetConfig?.max && (
                      <p className="text-xs text-red-600 mt-1">{errorsForParam.widgetConfig.max}</p>
                    )}
                  </div>
                  <div>
                    <Label>Step</Label>
                    <Input
                      type="number"
                      value={param.widgetConfig.step ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateWidgetConfig(index, { step: val === '' ? undefined : parseFloat(val) });
                      }}
                      placeholder="Step size"
                    />
                    {errorsForParam.widgetConfig?.step && (
                      <p className="text-xs text-red-600 mt-1">{errorsForParam.widgetConfig.step}</p>
                    )}
                  </div>
                </div>
              )}

              {param.widget === 'select' && (
                <div className="ml-4">
                  <Label>Options (one per line, format: label=value)</Label>
                  <Textarea
                    rows={3}
                    value={param.optionsText || ''}
                    onChange={(e) => {
                      const text = e.target.value;
                      const newOptions = text
                        .split('\n')
                        .filter(line => line.trim() !== '')
                        .map(line => {
                          const [label, value] = line.split('=', 2);
                          return {
                            label: label.trim(),
                            value: (value || label).trim()
                          };
                        });
                      const newParams = [...parameters];
                      newParams[index] = {
                        ...newParams[index],
                        optionsText: text,
                        widgetConfig: { ...newParams[index].widgetConfig, options: newOptions },
                      };
                      setParameters(newParams);
                    }}
                    placeholder="Option 1=value1
Option 2=value2"
                    className="font-mono"
                  />
                  {errorsForParam.widgetConfig?.options && (
                    <p className="text-xs text-red-600 mt-1">{errorsForParam.widgetConfig.options}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {parameters.length < 5 && (
          <Button variant="outline" onClick={addParameter} className="w-full">
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
          {formData.id ? 'Save' : 'Create'}
        </Button>
      </div>
    </div>
  );
} 