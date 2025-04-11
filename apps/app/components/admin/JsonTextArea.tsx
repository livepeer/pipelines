import React from 'react';

interface JsonTextAreaProps {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  helpText?: string;
  hasError?: boolean; 
}

export function JsonTextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 8, 
  helpText,
  hasError = false,
}: JsonTextAreaProps) {
  const borderColor = hasError ? 'border-red-500' : 'border-gray-300';
  const ringColor = hasError ? 'focus:ring-red-500' : 'focus:ring-blue-500';

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 border ${borderColor} rounded focus:outline-none focus:ring-1 ${ringColor} font-mono text-sm transition-colors duration-150`}
        rows={rows}
        placeholder={placeholder}
      />
      {helpText && (
        <p className="mt-1 text-xs text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
} 