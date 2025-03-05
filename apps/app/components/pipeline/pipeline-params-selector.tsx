"use client";

import { useState } from "react";
import { Button } from "@repo/design-system/components/ui/button";

import { PlusIcon, XIcon } from "lucide-react";
import PipelineCard from "./pipeline-card";

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
  classType: string;
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
  const comfyJson =
    typeof formData.comfyJson === "string"
      ? JSON.parse(formData.comfyJson)
      : formData.comfyJson;

  const nodes = Object.entries(comfyJson).map(
    ([nodeId, node]: [string, any]) => ({
      id: nodeId,
      classType: node.class_type,
      fields: Object.keys(node.inputs || {}),
    }),
  );

  const [parameters, setParameters] = useState<Parameter[]>(() => {
    if (formData.prioritized_params) {
      try {
        const parsedParams =
          typeof formData.prioritized_params === "string"
            ? JSON.parse(formData.prioritized_params)
            : formData.prioritized_params;

        const mappedParameters = parsedParams.map((param: any) => {
          const widgetType = (param.widget || "text").toLowerCase().trim();
          const parameter: Parameter = {
            nodeId: param.nodeId,
            field: param.field,
            name: param.name,
            description: param.description || "",
            widget: widgetType,
            widgetConfig: {},
            optionsText: "",
            classType: nodes.find(n => n.id === param.nodeId)?.classType || "",
          };

          if (widgetType === "slider" || widgetType === "number") {
            parameter.widgetConfig = {
              min: param.widgetConfig?.min ?? 0,
              max: param.widgetConfig?.max ?? 100,
              step: param.widgetConfig?.step ?? 1,
            };
          } else if (widgetType === "select") {
            parameter.widgetConfig = {
              options: param.widgetConfig?.options || [],
            };
            parameter.optionsText =
              param.widgetConfig?.options
                ?.map((opt: any) => `${opt.label}=${opt.value}`)
                .join("\n") || "";
          }

          return parameter;
        });

        return mappedParameters;
      } catch (e) {
        console.error("Error parsing prioritized params:", e);
        return [];
      }
    }
    return [];
  });

  const [validationErrors, setValidationErrors] = useState<
    ParameterValidationError[]
  >([]);

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
        classType: "",
      },
    ]);
    setValidationErrors([]);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const updateParameter = (
    index: number,
    field: keyof Parameter,
    value: string,
  ) => {
    const newParameters = [...parameters];
    if (field === "nodeId") {
      const selectedNode = nodes.find(n => n.id === value);
      newParameters[index] = {
        ...newParameters[index],
        nodeId: value,
        classType: selectedNode ? selectedNode.classType : "",
      };
    } else {
      newParameters[index] = {
        ...newParameters[index],
        [field]: value,
      };
    }
    setParameters(newParameters);
    setValidationErrors(prev => {
      const newErrors = [...prev];
      if (newErrors[index]) {
        delete newErrors[index][field as keyof ParameterValidationError];
      }
      return newErrors;
    });
  };

  const updateWidgetConfig = (index: number, config: Partial<WidgetConfig>) => {
    const newParameters = [...parameters];
    newParameters[index] = {
      ...newParameters[index],
      widgetConfig: {
        ...newParameters[index].widgetConfig,
        ...config,
      },
    };
    setParameters(newParameters);
  };

  const validateParameter = (param: Parameter): ParameterValidationError => {
    const error: ParameterValidationError = {};

    if (!param.nodeId) error.nodeId = "Node is required.";
    if (!param.field) error.field = "Field is required.";
    if (!param.name) error.name = "Display name is required.";
    if (!param.widget) error.widget = "Widget type is required.";

    if (param.widget === "slider" || param.widget === "number") {
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

    if (param.widget === "select") {
      const hasValidOptions = param.widgetConfig.options?.some(
        opt => opt.label.trim() !== "" || opt.value.trim() !== "",
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
      const path = [param.nodeId, param.field, param.name]
        .filter(Boolean)
        .join("/");
      return {
        nodeId: param.nodeId,
        field: param.field,
        name: param.name,
        description: param.description,
        widget: param.widget,
        widgetConfig: param.widgetConfig,
        classType: param.classType,
        path,
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
          Select up to 5 important parameters that should always be visible for
          users. All other parameters will be available, but collapsed by
          default.
        </p>
      </div>

      <div className="space-y-4">
        {parameters.map((param, index) => (
          <PipelineCard
            key={index}
            index={index}
            parameter={param}
            errors={validationErrors[index]}
            nodes={nodes}
            onUpdateParameter={updateParameter}
            onUpdateWidgetConfig={updateWidgetConfig}
            onRemove={removeParameter}
            onWidgetTypeChange={(index, value) => {
              setParameters(prevParameters => {
                const newParameters = [...prevParameters];
                newParameters[index] = {
                  ...newParameters[index],
                  widget: value,
                  widgetConfig:
                    value === "slider" || value === "number"
                      ? { min: 0, max: 100, step: 1 }
                      : value === "select"
                        ? { options: [] }
                        : {},
                };
                return newParameters;
              });
              setValidationErrors(prev => {
                const newErrors = [...prev];
                if (newErrors[index]) {
                  delete newErrors[index][
                    value as keyof ParameterValidationError
                  ];
                }
                return newErrors;
              });
            }}
          />
        ))}

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
          disabled={isSubmitting}
          className="uppercase text-xs"
        >
          {formData.id ? "Save" : "Create"}
        </Button>
      </div>
    </div>
  );
}
