import { useState, useCallback, useEffect, useRef } from 'react';

export type CommandOption = {
  id: string;
  label: string;
  description?: string;
  type?: string;
  icon?: React.ReactNode;
};

interface UseCommandSuggestionsProps {
  options: CommandOption[];
  inputValue: string;
  setInputValue: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
}

export function useCommandSuggestions({
  options,
  inputValue,
  setInputValue,
  inputRef
}: UseCommandSuggestionsProps) {
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const [commandText, setCommandText] = useState("");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const caretRef = useRef<DOMRect | null>(null);
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null);

  // Filter options based on current command text
  const filteredOptions = options
    .filter(option => 
      commandText === "" || 
      option.id.toLowerCase().includes(commandText.toLowerCase()) ||
      option.label.toLowerCase().includes(commandText.toLowerCase())
    )
    .slice(0, 4); // Limit to 4 options

  // Check for command trigger pattern
  useEffect(() => {
    if (!inputRef.current) return;
    
    const selectionStart = 
      'selectionStart' in inputRef.current 
        ? inputRef.current.selectionStart || 0 
        : 0;
    
    setCursorPosition(selectionStart);
    
    const commandMatch = inputValue.slice(0, selectionStart).match(/--(\w*)$/);
    
    if (commandMatch) {
      setCommandText(commandMatch[1]);
      setCommandMenuOpen(true);
      updateCaretPosition();
    } else {
      setCommandMenuOpen(false);
    }
  }, [inputValue, inputRef]);

  const updateCaretPosition = () => {
    if (!inputRef.current) return;
    
    try {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect) {
          caretRef.current = rect;
          return;
        }
      }
    } catch (e) {
      // Fallback if getSelection fails
    }
    
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      caretRef.current = new DOMRect(
        rect.left, 
        rect.top + rect.height,
        0,
        0
      );
    }
  };

  const handleSelectOption = useCallback((option: CommandOption) => {
    if (!inputRef.current) return;
    
    const selectionStart = 
      'selectionStart' in inputRef.current 
        ? inputRef.current.selectionStart || 0  // Add || 0 to handle null
        : 0;
        
    const before = inputValue.slice(0, selectionStart).replace(/--\w*$/, `--${option.id} `);
    const after = inputValue.slice(selectionStart);
    const newValue = before + after;
    
    setInputValue(newValue);
    setCommandMenuOpen(false);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPosition = before.length;
        
        if ('setSelectionRange' in inputRef.current) {
          inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      }
    }, 0);
  }, [inputValue, setInputValue, inputRef]);

  useEffect(() => {
    setSelectedOptionIndex(0);
  }, [filteredOptions.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!commandMenuOpen || filteredOptions.length === 0) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedOptionIndex(prev => 
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedOptionIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (filteredOptions.length === 1) {
        handleSelectOption(filteredOptions[0]);
      } else if (filteredOptions[selectedOptionIndex]) {
        handleSelectOption(filteredOptions[selectedOptionIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setCommandMenuOpen(false);
    }
  }, [commandMenuOpen, filteredOptions, selectedOptionIndex, handleSelectOption]);

  return {
    commandMenuOpen,
    filteredOptions,
    selectedOptionIndex,
    handleSelectOption,
    handleKeyDown,
    caretRef,
    referenceElement,
    setReferenceElement
  };
} 