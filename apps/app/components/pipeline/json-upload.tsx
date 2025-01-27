"use client";

import {
  FileUploader,
  FileInput,
  FileUploaderContent,
  FileUploaderItem,
} from "@repo/design-system/components/ui/file-upload";
import Image from "next/image";
import { Dispatch, SetStateAction, useState } from "react";
import { DropzoneOptions } from "react-dropzone";
import { Upload } from "lucide-react";

const FileUploadDropzone = ({
  placeholder,
  id,
  setFormData,
}: {
  placeholder: string;
  id: string;
  setFormData: Dispatch<SetStateAction<Record<string, unknown>>>;
}) => {
  const [files, setFiles] = useState<File[] | null>([]);
  const onValueChange = (files: File[] | null) => {
    setFiles(files);
    setFormData((prev) => ({ ...prev, [id]: files?.[0] }));
  };
  const dropzone = {
    accept: {
      "application/json": [".json"],
    },
    multiple: false,
    maxFiles: 1,
    maxSize: 1 * 1024 * 1024,
  } satisfies DropzoneOptions;

  return (
    <FileUploader
      id={id}
      value={files}
      onValueChange={onValueChange}
      dropzoneOptions={dropzone}
    >
      {files?.length && files?.length > 0 ? (
        <FileUploaderContent className="flex items-center flex-row gap-2">
          {files?.map((file, i) => (
            <FileUploaderItem
              key={i}
              index={i}
              className="flex flex-col items-center justify-center w-full bg-background border border-dashed p-4 text-center cursor-pointer hover:bg-accent/50"
              aria-roledescription={`file ${i + 1} containing ${file.name}`}
            >
              <p className="mr-8 truncate">{file.name}</p>
            </FileUploaderItem>
          ))}
        </FileUploaderContent>
      ) : (
        <FileInput>
          <div className="flex flex-col items-center justify-center h-32 w-full bg-background border border-dashed p-4 text-center cursor-pointer hover:bg-accent/50">
            <Upload className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{placeholder}</p>
          </div>
        </FileInput>
      )}
    </FileUploader>
  );
};

export default FileUploadDropzone;
