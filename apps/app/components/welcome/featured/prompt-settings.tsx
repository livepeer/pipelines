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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "absolute bottom-full right-0 mb-2 w-64 bg-popover rounded-md border shadow-md z-50 p-3 pt-0 space-y-3",
          className,
        )}
      >
        {/* Triangle pointer */}
        <div className="absolute bottom-[-6px] right-3 w-3 h-3 bg-popover border-r border-b transform rotate-45 border-inherit"></div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -right-0 h-6 w-6 rounded-full p-0 bg-popover"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>

        <div className="pb-2">
          <h4 className="text-sm font-medium">Parameter Settings</h4>
        </div>

        {hasSliderParams ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 -mr-1">
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
                <div key={param.name} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-medium">{param.name}</Label>
                    <span className="text-xs text-muted-foreground">
                      {param.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-16 h-7 text-xs"
                      min={min}
                      max={max}
                      step={step}
                      value={currentValue}
                      onChange={e => {
                        const value = parseFloat(e.target.value);
                        if (isNaN(value)) return;

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
                      onBlur={() => {
                        if (onSubmit) onSubmit();
                      }}
                    />
                    <div className="flex-1">
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        className={cn(
                          "w-full appearance-none h-2 rounded-full bg-muted",
                          "focus:outline-none",
                          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3",
                          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary",
                          "[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-0",
                          "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3",
                          "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary",
                          "[&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0",
                          "[&::-ms-thumb]:appearance-none [&::-ms-thumb]:h-3 [&::-ms-thumb]:w-3",
                          "[&::-ms-thumb]:rounded-full [&::-ms-thumb]:bg-primary",
                          "[&::-ms-thumb]:cursor-pointer [&::-ms-thumb]:border-0",
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
          </div>
        ) : (
          <div className="flex items-center justify-center py-6">
            <span className="text-xs text-center text-muted-foreground">
              No slider parameters available
            </span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default SettingsMenu;
