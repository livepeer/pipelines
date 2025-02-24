"use client";

import {
  FileUploader,
  FileInput,
  FileUploaderContent,
  FileUploaderItem,
} from "@repo/design-system/components/ui/file-upload";
import Image from "next/image";
import { Dispatch, SetStateAction, useState } from "react";
import { Upload } from "lucide-react";

export enum FileType {
  Image,
  Json,
}

const ALLOWED_FILE_CONFIGS = {
  [FileType.Image]: {
    accept: "image/*",
    type: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".ico", ".webp"],
  },
  [FileType.Json]: {
    accept: "application/json",
    type: [".json"],
  },
};

const FileUploadDropzone = ({
  placeholder,
  id,
  setFormData,
  fileType,
  initialFiles,
}: {
  placeholder: string;
  id: string;
  setFormData: Dispatch<SetStateAction<Record<string, unknown>>>;
  fileType: FileType;
  initialFiles?: File[];
}) => {
  const [files, setFiles] = useState<File[] | null>(initialFiles || []);
  const onValueChange = (files: File[] | null) => {
    setFiles(files);
    setFormData(prev => ({ ...prev, [id]: files?.[0] }));
  };
  const fileConfig = ALLOWED_FILE_CONFIGS[fileType];
  const dropzone = {
    accept: {
      [fileConfig.accept]: fileConfig.type,
    },
    multiple: false,
    maxFiles: 1,
    maxSize: 1 * 1024 * 1024,
  };

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
              className="flex flex-col items-center justify-center w-full bg-background border border-dashed p-4 text-center cursor-pointer hover:bg-accent/50 h-full"
              aria-roledescription={`file ${i + 1} containing ${file.name}`}
            >
              {fileType === FileType.Image ? (
                <Image
                  src={URL.createObjectURL(file)}
                  alt="Cover image"
                  height={150}
                  width={150}
                  className="rounded-md h-48 w-fit max-w-full"
                />
              ) : (
                <p className="mr-8 truncate">{file.name}</p>
              )}
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
