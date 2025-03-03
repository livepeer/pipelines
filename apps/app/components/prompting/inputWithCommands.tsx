"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "@repo/design-system/components/ui/input";
import TextareaAutosize from "react-textarea-autosize";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@repo/design-system/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@repo/design-system/components/ui/popover";
import { cn } from "@repo/design-system/lib/utils";

export type CommandOption = {
  id: string;
  label: string;
  description?: string;
  type?: string;
  icon?: React.ReactNode;
};

interface CommandInputProps {
  options: CommandOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  multiline?: boolean;
  maxRows?: number;
  onSubmit?: (value: string) => void;
}

export function CommandInput({
  options,
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  multiline = false,
  maxRows = 5,
  onSubmit,
}: CommandInputProps) {
  const [open, setOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [commandText, setCommandText] = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [caretPosition, setCaretPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Filter options based on current command text
  const filteredOptions = options
    .filter(
      option =>
        commandText === "" ||
        option.label.toLowerCase().includes(commandText.toLowerCase()) ||
        option.id.toLowerCase().includes(commandText.toLowerCase()),
    )
    .slice(0, 4);

  useEffect(() => {
    const commandMatch = value.slice(0, cursorPosition).match(/--(\w*)$/);

    if (commandMatch) {
      setCommandText(commandMatch[1]);
      setOpen(true);
      updateCaretPosition();
    } else {
      setOpen(false);
    }
  }, [value, cursorPosition]);

  const updateCaretPosition = () => {
    if (!inputRef.current) return;

    if (multiline && document.getSelection) {
      const selection = document.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect) {
          const inputRect = inputRef.current.getBoundingClientRect();
          setCaretPosition({
            top: rect.top - inputRect.top + 20, // Adjust as needed
            left: rect.left - inputRect.left,
          });
          return;
        }
      }
    }

    setCaretPosition({
      top: 24,
      left: 0,
    });
  };

  const handleSelectOption = (option: CommandOption) => {
    const before = value
      .slice(0, cursorPosition)
      .replace(/--\w*$/, `--${option.id}`);
    const after = value.slice(cursorPosition);
    const newValue = before + after;

    onChange(newValue);
    setOpen(false);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPosition = before.length;

        if ("setSelectionRange" in inputRef.current) {
          inputRef.current.setSelectionRange(
            newCursorPosition,
            newCursorPosition,
          );
        }
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (open && filteredOptions.length > 0) {
        e.preventDefault();
      }
    } else if (e.key === "Enter") {
      if (open && filteredOptions.length > 0) {
        e.preventDefault();
        handleSelectOption(filteredOptions[0]);
      } else if (onSubmit && !e.shiftKey) {
        e.preventDefault();
        onSubmit(value);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    } else if (e.key === "Tab" && open) {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelectOption(filteredOptions[0]);
      }
    }
  };

  const formatInputWithHighlights = () => {
    if (!value) return null;

    const commandRegex = /--(\w+)/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = commandRegex.exec(value)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          text: value.substring(lastIndex, match.index),
          isCommand: false,
        });
      }

      const commandText = match[1];
      const isValidCommand = options.some(option => option.id === commandText);

      parts.push({
        text: match[0],
        isCommand: true,
        isValid: isValidCommand,
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < value.length) {
      parts.push({
        text: value.substring(lastIndex),
        isCommand: false,
      });
    }

    return (
      <div
        className="absolute inset-0 pointer-events-none flex items-center"
        style={{ zIndex: 1 }}
      >
        <div className="whitespace-pre-wrap overflow-hidden">
          {parts.map((part, i) => (
            <span
              key={i}
              className={
                part.isCommand && part.isValid
                  ? "text-[#00EB88] font-medium"
                  : ""
              }
            >
              {part.text}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderInput = () => {
    if (multiline) {
      return (
        <div className="relative">
          {formatInputWithHighlights()}
          <TextareaAutosize
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className={cn(
              "w-full resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent relative",
              className,
            )}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            minRows={1}
            maxRows={maxRows}
            onChange={e => {
              onChange(e.target.value);
              setCursorPosition(e.target.selectionStart || 0);
            }}
            onKeyDown={handleKeyDown}
            onClick={e => {
              setCursorPosition(
                (e.target as HTMLTextAreaElement).selectionStart || 0,
              );
            }}
            onBlur={() => {
              setTimeout(() => setOpen(false), 200);
            }}
            style={{ color: "transparent", caretColor: "currentColor" }}
          />
        </div>
      );
    }

    return (
      <div className="relative">
        {formatInputWithHighlights()}
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          className={cn(
            "w-full border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent relative",
            className,
          )}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={e => {
            onChange(e.target.value);
            setCursorPosition(e.target.selectionStart || 0);
          }}
          onKeyDown={handleKeyDown}
          onClick={e => {
            setCursorPosition(
              (e.target as HTMLInputElement).selectionStart || 0,
            );
          }}
          onBlur={() => {
            setTimeout(() => setOpen(false), 200);
          }}
          style={{ color: "transparent", caretColor: "currentColor" }}
        />
      </div>
    );
  };

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>{renderInput()}</PopoverAnchor>
        <PopoverContent
          className="p-0 w-60"
          style={{
            position: "absolute",
            top: caretPosition?.top ?? 24,
            left: caretPosition?.left ?? 0,
          }}
          align="start"
          side="top"
          sideOffset={5}
        >
          <Command>
            <CommandList>
              <CommandGroup>
                {filteredOptions.length > 0 ? (
                  filteredOptions.map(option => (
                    <CommandItem
                      key={option.id}
                      onSelect={() => handleSelectOption(option)}
                      className="flex items-center gap-2 px-2 py-1.5"
                    >
                      {option.icon}
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {option.label}
                          {option.type && (
                            <span className="ml-1 text-muted-foreground opacity-70 text-xs">
                              {option.type}
                            </span>
                          )}
                        </span>
                        {option.description && (
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))
                ) : (
                  <div className="py-6 text-center text-sm">
                    No matches found
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
