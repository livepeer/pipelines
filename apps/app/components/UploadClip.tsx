import { useState } from 'react';
import { uploadClip, UploadFiles, UploadMetadata } from '@/lib/upload';

export default function UploadClip() {
  const [files, setFiles] = useState<UploadFiles | null>(null);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(prev => ({
        ...prev,
        [name]: selectedFiles[0]
      } as UploadFiles));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files?.sourceClip || !files?.watermarkedClip || !files?.thumbnail) {
      setError('Please select all required files');
      return;
    }

    setIsUploading(true);
    setError(null);

    const metadata: UploadMetadata = {
      title: title || null,
      prompt,
      isFeatured,
    };

    const result = await uploadClip(files, metadata, (progress) => {
      setProgress(progress * 100);
    });

    setIsUploading(false);

    if (result.success) {
      // Handle success - maybe redirect or show success message
      console.log('Upload successful:', result.clip);
    } else {
      setError(result.error || 'Upload failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Source Clip
          <input
            type="file"
            name="sourceClip"
            accept="video/*"
            onChange={handleFileChange}
            className="mt-1 block w-full"
            required
          />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Watermarked Clip
          <input
            type="file"
            name="watermarkedClip"
            accept="video/*"
            onChange={handleFileChange}
            className="mt-1 block w-full"
            required
          />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Thumbnail
          <input
            type="file"
            name="thumbnail"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-1 block w-full"
            required
          />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Prompt
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isFeatured"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
          Feature this clip
        </label>
      </div>

      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={isUploading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isUploading ? 'Uploading...' : 'Upload Clip'}
      </button>
    </form>
  );
} 