import { KeyboardEvent, ChangeEvent } from "react";
import { Send, Loader2, Settings, X } from "lucide-react";
import { Button } from "@repo/design-system/components/ui/button";
import { Separator } from "@repo/design-system/components/ui/separator";
import { presets } from "@/lib/prompting/constants";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatUIProps {
  isMobile: boolean;
  handleSavePrompt: () => void;
  handleReset: () => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  messages: Message[];
  isLoading: boolean;
  inputMessage: string;
  setInputMessage: (value: string) => void;
  handleSendMessage: () => void;
  handleKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  handleResizeInput: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  keywords: string[];
  keywordInput: string;
  handleKeywordInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleKeywordKeyDown: (e: KeyboardEvent) => void;
  removeKeyword: (index: number) => void;
  trends: { trend: string }[];
  loading: boolean;
  handleTrendClick: (trend: string) => void;
  selectedPreset: { id: string };
  handlePresetClick: (preset: { id: string }) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export const ChatUI = ({
  isMobile,
  handleSavePrompt,
  handleReset,
  showSettings,
  setShowSettings,
  messages,
  isLoading,
  inputMessage,
  setInputMessage,
  handleSendMessage,
  handleKeyDown,
  handleResizeInput,
  keywords,
  keywordInput,
  handleKeywordInputChange,
  handleKeywordKeyDown,
  removeKeyword,
  trends,
  loading,
  handleTrendClick,
  selectedPreset,
  handlePresetClick,
  messagesEndRef,
  scrollContainerRef,
}: ChatUIProps) => {
  return (
    <div className="w-full h-full rounded-lg flex flex-col overflow-hidden">
      <div className="bg-gray-100 px-4 sm:px-6 py-3 flex justify-between items-center border-b border-gray-200">
        <h3 className="text-base md:text-lg font-semibold text-zinc-900">
          <span className="hidden sm:inline">Daydream</span> Assistant
        </h3>
        <div className="flex items-center gap-2 h-8">
          <Button
            onClick={handleSavePrompt}
            size={isMobile ? "sm" : "default"}
            className="bg-zinc-900 text-xs cursor-pointer hover:bg-zinc-700 text-white sm:text-sm rounded-md px-2 sm:px-3 py-1"
          >
            Save changes
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className="text-xs cursor-pointer text-black sm:text-sm rounded-md px-2 sm:px-3 py-1"
          >
            Reset
          </Button>
          <Separator orientation="vertical" className="bg-gray-400" />
          <button
            className="text-zinc-600 hover:text-zinc-800 cursor-pointer transition-colors"
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? <X size={18} /> : <Settings size={18} />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          className={`flex-1 flex flex-col overflow-hidden transition-all ${showSettings ? "w-0 sm:w-1/2 md:w-3/5" : "w-full"}`}
        >
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-xl ${message.role === "user" ? "bg-zinc-800 text-white" : "bg-gray-200 text-gray-800"}`}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-xl bg-gray-200 text-gray-800 flex gap-2 text-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-500 mr-1" />
                  Thinking..
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-2 h-12">
              <textarea
                value={inputMessage}
                onChange={e => {
                  setInputMessage(e.target.value);
                  handleResizeInput(e);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 bg-white border border-gray-300 rounded-lg p-3 text-gray-800 text-sm focus:outline-none resize-none h-12 min-h-[48px] max-h-[48px] overflow-y-auto"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="flex items-center justify-center bg-zinc-900 hover:bg-zinc-700 text-white rounded-lg h-12 min-h-[48px] w-[44px] px-3"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Send className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div
          className={`bg-gray-50 border-l border-gray-200 overflow-y-auto no-scrollbar transition-all duration-300 ${showSettings ? "w-full sm:w-1/2 md:w-2/5" : "w-0"}`}
        >
          {showSettings && (
            <div className="p-4 sm:p-6">
              <div className="mb-5">
                <p className="text-sm md:text-base font-medium mb-2 text-zinc-900">
                  Choose a style
                </p>
                <div className="relative">
                  <div
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto py-2 px-1 scrollbar-hide gap-2 snap-x"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    {presets.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetClick(preset)}
                        className={`shrink-0 min-w-[100px] flex justify-center items-center text-sm gap-2 whitespace-nowrap py-2 px-4 cursor-pointer rounded-full transition-all snap-start ${
                          selectedPreset.id === preset.id
                            ? "bg-zinc-900 text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span>{preset.icon}</span>
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <p className="text-sm md:text-base font-medium mb-2 text-zinc-900">
                  Enter keywords
                </p>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {keywords.map((keyword, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-300 rounded-full px-3 py-2 flex items-center gap-1"
                    >
                      <span className="text-gray-700 text-sm">{keyword}</span>
                      <button
                        onClick={() => removeKeyword(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {keywords.length < 3 && (
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={handleKeywordInputChange}
                      onKeyDown={handleKeywordKeyDown}
                      placeholder="Click enter to save"
                      className="bg-white border border-gray-300 placeholder:text-sm rounded-full w-full sm:w-[230px] px-3 py-1.5 focus:outline-none"
                    />
                  )}
                </div>
              </div>

              <div className="relative mb-5">
                <p className="text-sm md:text-base font-medium mb-2 text-zinc-900">
                  Use world trends 🔥
                </p>
                <div className="mt-1.5 w-full h-full overflow-y-auto no-scrollbar rounded">
                  {!trends || loading ? (
                    <div className="flex justify-center items-center p-10">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-zinc-400"></div>
                    </div>
                  ) : (
                    <div className="p-2 grid grid-cols-2 gap-2">
                      {trends.length > 0 ? (
                        trends.slice(0, 20).map((trendItem, index) => (
                          <button
                            key={index}
                            onClick={() => handleTrendClick(trendItem.trend)}
                            disabled={
                              keywords.includes(trendItem.trend) ||
                              keywords.length >= 3
                            }
                            className={`text-center text-sm py-2 px-4 rounded-full border border-gray-300 truncate hover:bg-zinc-800 hover:text-white hover:border-zinc-800 text-gray-700 transition-colors ${
                              keywords.includes(trendItem.trend) ||
                              keywords.length >= 3
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                          >
                            {trendItem.trend}
                          </button>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-4 text-gray-500">
                          No trends available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
