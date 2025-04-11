import React, { useRef } from "react";

interface ImageUploadInputProps {
  imagePreview: string | null;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  onSelectImage: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  label?: string;
}

export function ImageUploadInput({
  imagePreview,
  onImageChange,
  onRemoveImage,
  onSelectImage,
  fileInputRef,
  label = "Cover Image",
}: ImageUploadInputProps) {
  return (
    <div className="mb-4 col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      <div className="mt-1 flex flex-col items-center space-y-2">
        {imagePreview ? (
          <div className="relative w-full">
            <img
              src={imagePreview}
              alt="Cover preview"
              className="h-48 w-full object-cover rounded-md"
            />
            <button
              type="button"
              onClick={onRemoveImage}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-150"
              title="Remove image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ) : (
          <div
            className="h-48 w-full border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors duration-150"
            onClick={onSelectImage}
          >
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium text-indigo-600 hover:text-indigo-500">
                  Upload a file
                </span>
                <p className="inline pl-1">or drag and drop</p>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onImageChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={onSelectImage}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
        >
          {imagePreview ? "Change Image" : "Select Image"}
        </button>
      </div>
    </div>
  );
}
