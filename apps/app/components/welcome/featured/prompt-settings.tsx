import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@repo/design-system/lib/utils";

interface SettingsMenuProps {
  pipeline: any;
  inputValue: string;
  setInputValue: (value: string) => void;
  onClose: () => void;
  className?: string;
  onSubmit?: () => void;
  originalPrompt?: string;
}

// Map internal param names to user-friendly display names
function getDisplayName(paramName: string) {
  const mapping: Record<string, string> = {
    denoise: "Strength",
    creativity: "Prompt Adherence",
    quality: "Detail",
  };
  return mapping[paramName.toLowerCase()] || paramName;
}

function SettingsMenu({
  pipeline,
  inputValue,
  setInputValue,
  onClose,
  className,
  onSubmit,
  originalPrompt,
}: SettingsMenuProps) {
  const sliderParams =
    pipeline?.prioritized_params?.filter(
      (param: any) =>
        param.widget === "slider" ||
        (param.widget === "number" && param.widgetConfig?.type === "slider"),
    ) || [];

  const hasSliderParams = sliderParams.length > 0;


  

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "w-full bg-popover rounded-t-md border-b p-3 pt-0 space-y-3 mt-4",
          className,
        )}
      >
        {/* Close button */}
        {/* <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 rounded-full p-0"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button> */}

        {hasSliderParams ? (
          <div className="flex flex-row gap-8 flex-wrap max-h-[60vh] overflow-y-auto pr-1 -mr-1">
            {sliderParams.map((param: any) => {
              const commandId = param.name.toLowerCase().replace(/\s+/g, "-");
              const min = param.widgetConfig?.min || 0;
              const max = param.widgetConfig?.max || 100;
              const step = param.widgetConfig?.step || 1;
              const defaultValue =
                param.widgetConfig?.defaultValue !== undefined
                  ? param.widgetConfig?.defaultValue
                  : min;

              const currentValueMatch = inputValue.match(
                new RegExp(`--${commandId}\\s+([\\d\\.]+)`),
              );

              const originalPromptMatch =
                !inputValue && originalPrompt
                  ? originalPrompt.match(
                      new RegExp(`--${commandId}\\s+([\\d\\.]+)`),
                    )
                  : null;

              const currentValue = currentValueMatch
                ? parseFloat(currentValueMatch[1])
                : originalPromptMatch
                  ? parseFloat(originalPromptMatch[1])
                  : defaultValue;

              return (
                <div key={param.name} className="flex flex-col w-[20%] flex-1">
                  <Label className="text-sm font-medium mb-1 truncate">{getDisplayName(param.name)}</Label>
                  {/* <span className="text-xs text-muted-foreground mt-1 text-right block min-h-[18px] min-w-[20%]">
                    {param.description}
                  </span> */}
                  <div className="flex items-center w-full">
                    <div className="relative w-full h-2">
                      {/* Progress fill - very subtle blue */}
                      <div
                        className="absolute top-0 left-0 h-2 bg-primary/10 rounded-l-full z-30 mt-[1px] pointer-events-none"
                        style={{
                          width: `${((currentValue - min) / (max - min)) * 100}%`,
                        }}
                      />

                      {/* Tick marks for steps */}
                      {/* <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none z-20 overflow-hidden rounded-full mt-[2px]">
                        {Array.from({
                          length: Math.min(
                            Math.ceil((max - min) / step) + 1,
                            20,
                          ),
                        }).map((_, index) => {
                          // Get actual number of intervals to display
                          const totalIntervals = Math.min(
                            Math.ceil((max - min) / step),
                            19,
                          );
                          // Calculate position as percentage where 0% is far left and 100% is far right
                          let positionPercentage;
                          if (totalIntervals === 0) {
                            positionPercentage = 0;
                          } else {
                            // Ensure we go exactly from 0% to 100%
                            positionPercentage = index * (100 / totalIntervals);
                          }

                          return (
                            <div
                              key={index}
                              className="absolute w-[1px] bg-primary/40 z-20"
                              style={{
                                left: `calc(${positionPercentage}% - 0.5px)`,
                                opacity:
                                  index === 0 || index === totalIntervals
                                    ? 0
                                    : index % 5 === 0
                                      ? 0.6
                                      : 0.35,
                                height: index % 5 === 0 ? "100%" : "50%",
                                top: "50%",
                                transform: "translateY(-50%)",
                              }}
                            />
                          );
                        })}
                      </div> */}
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        className={cn(
                          "w-full appearance-none h-2 rounded-full bg-muted relative z-10",
                          "focus:outline-none",
                          // Smaller thumb
                          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5",
                          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary",
                          "[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-50",
                          "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5",
                          "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary",
                          "[&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-50",
                          "[&::-ms-thumb]:appearance-none [&::-ms-thumb]:h-5 [&::-ms-thumb]:w-5",
                          "[&::-ms-thumb]:rounded-full [&::-ms-thumb]:bg-primary",
                          "[&::-ms-thumb]:cursor-pointer [&::-ms-thumb]:border-0 [&::-ms-thumb]:relative [&::-ms-thumb]:z-50",
                        )}
                        value={currentValue}
                        onChange={e => {
                          const value = parseFloat(e.target.value);

                          if (!inputValue && originalPrompt) {
                            const restoredPrompt = originalPrompt;
                            const paramRegex = new RegExp(
                              `--${commandId}\\s+([\\d\\.]+)`,
                            );
                            const paramExists = paramRegex.test(restoredPrompt);

                            if (paramExists) {
                              setInputValue(
                                restoredPrompt.replace(
                                  paramRegex,
                                  `--${commandId} ${value}`,
                                ),
                              );
                            } else {
                              const newInput =
                                restoredPrompt.trim() +
                                (restoredPrompt.trim() ? " " : "") +
                                `--${commandId} ${value}`;
                              setInputValue(newInput);
                            }
                          } else {
                            if (currentValueMatch) {
                              setInputValue(
                                inputValue.replace(
                                  new RegExp(`--${commandId}\\s+([\\d\\.]+)`),
                                  `--${commandId} ${value}`,
                                ),
                              );
                            } else {
                              const newInput =
                                inputValue.trim() +
                                (inputValue.trim() ? " " : "") +
                                `--${commandId} ${value}`;
                              setInputValue(newInput);
                            }
                          }
                        }}
                        onMouseUp={() => {
                          if (onSubmit) onSubmit();
                        }}
                        onTouchEnd={() => {
                          if (onSubmit) onSubmit();
                        }}
                      />
                    </div>
                  </div>
                 
                </div>
              );
            })}
            {/* Negative Prompt text input */}
            <div className="flex flex-col min-w-[180px] max-w-[240px] flex-1">
              <Label className="text-sm font-medium mb-1 truncate">Exclude</Label>
              <input
                type="text"
                className="w-full rounded-md border border-muted bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter negative prompt..."
                value={(() => {
                  const match = inputValue.match(/--negative-prompt\s+"([^"]*)"|--negative-prompt\s+([^\s]+)/);
                  return match ? (match[1] ?? match[2] ?? "") : "";
                })()}
                onChange={e => {
                  const value = e.target.value;
                  // Remove any existing negative prompt command
                  const promptWithoutNegative = inputValue.replace(/--negative-prompt\s+"[^"]*"|--negative-prompt\s+[^\s]+/g, '').trim();
                  
                  // Only add new negative prompt if there's a value
                  if (value) {
                    const newInput = promptWithoutNegative + (promptWithoutNegative ? ' ' : '') + `--negative-prompt "${value}"`;
                    setInputValue(newInput);
                  } else {
                    setInputValue(promptWithoutNegative);
                  }
                }}
              />
              
            </div>
          </div>
        ) : (
          <></>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default SettingsMenu;
