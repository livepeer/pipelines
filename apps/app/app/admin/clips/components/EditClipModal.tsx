import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { Clip } from "../../types";
import { usePrivy } from "@/hooks/usePrivy";
import { useAdmin } from "@/hooks/useAdmin";
import { clipApprovalEnum } from "@/lib/db/schema";

interface EditClipModalProps {
  clip: Clip | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedClip: Partial<Clip> & { id: number }) => Promise<void>;
}

export default function EditClipModal({
  clip,
  isOpen,
  onClose,
  onSave,
}: EditClipModalProps) {
  const { user } = usePrivy();
  const { email } = useAdmin();
  const [formData, setFormData] = useState<Partial<Clip>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingLivepeerUser, setIsLoadingLivepeerUser] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);

  useEffect(() => {
    if (clip) {
      setFormData({
        id: clip.id,
        video_url: clip.video_url,
        video_title: clip.video_title,
        thumbnail_url: clip.thumbnail_url,
        author_user_id: clip.author_user_id,
        source_clip_id: clip.source_clip_id,
        prompt: clip.prompt,
        priority: clip.priority,
        approval_status: clip.approval_status,
        is_tutorial: clip.is_tutorial,
      });
      setSelectedUserName(null);
    } else {
      setFormData({});
      setSelectedUserName(null);
    }
    setError(null);
  }, [clip]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === "priority" || name === "source_clip_id") {
      const numValue = value === "" ? null : Number(value);
      setFormData(prev => ({
        ...prev,
        [name]: numValue,
      }));
    } else if (name === "author_user_id") {
      setSelectedUserName(null);
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    } else if (name === "is_tutorial") {
      setFormData(prev => ({
        ...prev,
        [name]: value === "true",
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleRandomLivepeerUser = async () => {
    setIsLoadingLivepeerUser(true);
    try {
      const headers = new Headers();
      if (user && email) {
        const userData = {
          id: user.id,
          email: { address: email },
        };
        headers.append("x-privy-user", JSON.stringify(userData));
      }

      const response = await fetch("/api/admin/users/random-livepeer", {
        headers,
      });
      if (!response.ok) {
        throw new Error("Failed to fetch random Livepeer user");
      }
      const randomUser = await response.json();

      setSelectedUserName(randomUser.name || "Unknown");

      setFormData(prev => ({
        ...prev,
        author_user_id: randomUser.id,
      }));
    } catch (err) {
      console.error("Error fetching random Livepeer user:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch random Livepeer user",
      );
    } finally {
      setIsLoadingLivepeerUser(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clip) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const updatedClip = {
        ...formData,
        id: clip.id || 0,
      } as Partial<Clip> & { id: number };

      await onSave(updatedClip);
      onClose();
    } catch (err) {
      console.error("Error saving clip:", err);
      setError(err instanceof Error ? err.message : "Failed to save clip");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  {clip && clip.id
                    ? `Edit Clip #${clip.id}`
                    : "Create New Clip"}
                </Dialog.Title>

                {error && (
                  <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col md:flex-row items-center col-span-2 space-y-2 md:space-y-0 md:space-x-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Is Tutorial Video
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="is_tutorial"
                            value="true"
                            checked={formData.is_tutorial === true}
                            onChange={handleChange}
                            className="form-radio h-5 w-5 text-blue-600"
                          />
                          <span className="text-sm">True</span>
                        </label>
                      </div>
                      <div className="flex space-x-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="is_tutorial"
                            value="false"
                            checked={formData.is_tutorial === false}
                            onChange={handleChange}
                            className="form-radio h-5 w-5 text-blue-600"
                          />
                          <span className="text-sm">False</span>
                        </label>
                      </div>
                    </div>

                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Approval Status
                      </label>
                      <select
                        name="approval_status"
                        value={formData.approval_status || "none"}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        {clipApprovalEnum.enumValues.map(status => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Video URL *
                      </label>
                      <input
                        type="text"
                        name="video_url"
                        value={formData.video_url || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thumbnail URL
                      </label>
                      <input
                        type="text"
                        name="thumbnail_url"
                        value={formData.thumbnail_url || ""}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Author User ID *
                      </label>
                      <div className="flex space-x-2">
                        {selectedUserName ? (
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={selectedUserName}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserName(null);
                                setFormData(prev => ({
                                  ...prev,
                                  author_user_id: "",
                                }));
                              }}
                              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                            >
                              ×
                            </button>
                            <input
                              type="hidden"
                              name="author_user_id"
                              value={formData.author_user_id || ""}
                              required
                            />
                          </div>
                        ) : (
                          <input
                            type="text"
                            name="author_user_id"
                            value={formData.author_user_id || ""}
                            onChange={handleChange}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        )}
                        <button
                          type="button"
                          onClick={handleRandomLivepeerUser}
                          disabled={isLoadingLivepeerUser}
                          className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          {isLoadingLivepeerUser
                            ? "Loading..."
                            : "Random @livepeer"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Source Clip ID
                      </label>
                      <input
                        type="number"
                        name="source_clip_id"
                        value={
                          formData.source_clip_id === null ||
                          formData.source_clip_id === undefined
                            ? ""
                            : formData.source_clip_id
                        }
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <input
                        type="number"
                        name="priority"
                        value={
                          formData.priority === null ||
                          formData.priority === undefined
                            ? ""
                            : formData.priority
                        }
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prompt *
                      </label>
                      <textarea
                        name="prompt"
                        value={formData.prompt || ""}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {formData.thumbnail_url && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thumbnail Preview
                      </label>
                      <img
                        src={formData.thumbnail_url}
                        alt="Thumbnail Preview"
                        className="h-32 object-contain rounded border border-gray-300"
                      />
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
