import { useState, useRef, useEffect, SetStateAction } from "react";
import { Send, Loader2, Settings, X, Expand } from "lucide-react";
import { Button } from "@repo/design-system/components/ui/button";
import { chatWithAI, trimMessage } from "@/lib/groq";
import { Separator } from "@repo/design-system/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@repo/design-system/components/ui/drawer";
import React from "react";
import { useWorldTrends } from "@/hooks/useWorldTrends";
import useMobileStore from "@/hooks/useMobileStore";

interface ChatAssistantProps {
  initialPrompt: string;
  onSavePrompt: (prompt: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const ChatAssistant = ({
  initialPrompt,
  onSavePrompt,
  open,
  onOpenChange,
}: ChatAssistantProps) => {
  const { trends, loading, error, refetch } = useWorldTrends();
  const { isMobile } = useMobileStore();
  const [inputMessage, setInputMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState({ id: "none" });
  const [presets] = useState([
    { id: "none", name: "None", icon: "" },
    { id: "comic", name: "Comic", icon: "💥" },
    { id: "vintage", name: "Vintage", icon: "🎞️" },
    { id: "anime", name: "Anime", icon: "🌸" },
    { id: "fantasy", name: "Fantasy", icon: "🧙" },
    { id: "scifi", name: "Sci-Fi", icon: "🚀" },
    { id: "horror", name: "Horror", icon: "👻" },
    { id: "samurai", name: "Samurai", icon: "⚔️" },
    { id: "animal", name: "Animal", icon: "🦁" },
    { id: "nature", name: "Nature", icon: "🌿" },
    { id: "cyberpunk", name: "Cyberpunk", icon: "🤖" },
    { id: "pop-art", name: "Pop Art", icon: "🎨" },
    { id: "watercolor", name: "Watercolor", icon: "💧" },
    { id: "noir", name: "Noir", icon: "🌑" },
  ]);

  useEffect(() => {
    if (isMobile && chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isMobile, messages]);

  useEffect(() => {
    const initialMessages: Message[] = [];

    if (initialPrompt) {
      initialMessages.push({
        role: "assistant",
        content: `Hi 👋, how would you like to improve the following prompt?\n\n${initialPrompt}`,
      });
    } else {
      initialMessages.push({
        role: "assistant",
        content:
          "Hi 👋, I can help you edit prompts or create new ones from scratch. What kind of character or scene would you like to create?",
      });
    }

    setMessages(initialMessages);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, [initialPrompt]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];

    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      let response = await chatWithAI({
        messages: updatedMessages,
        style: selectedPreset.id,
        keywords,
      });

      response = trimMessage(response);

      setMessages([
        ...updatedMessages,
        { role: "assistant", content: response },
      ]);
    } catch (error) {
      console.error("Error in chat:", error);
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSavePrompt = () => {
    const lastAssistantMessage = [...messages]
      .reverse()
      .find(msg => msg.role === "assistant");

    if (lastAssistantMessage) {
      let content = lastAssistantMessage.content;

      const greetingPattern =
        "Hi 👋, how would you like to improve the following prompt?";
      if (content.startsWith(greetingPattern)) {
        content = content.substring(greetingPattern.length).trim();
      }

      const keyImprovementsIndex = content.indexOf(
        "Key Improvements and Changes:",
      );

      if (keyImprovementsIndex !== -1) {
        content = content.substring(0, keyImprovementsIndex).trim();
      }

      onSavePrompt(content);
    }
  };

  const handleResizeInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handlePresetClick = (preset: SetStateAction<{ id: string }>) => {
    setSelectedPreset(preset);
  };

  const handleKeywordInputChange = (e: {
    target: { value: SetStateAction<string> };
  }) => {
    setKeywordInput(e.target.value);
  };

  const handleKeywordKeyDown = (e: { key: string }) => {
    if (e.key === "Enter" && keywordInput.trim()) {
      addKeyword(keywordInput);
    }
  };

  const addKeyword = (keyword: string) => {
    if (keywords.length < 3 && keyword.trim()) {
      setKeywords([...keywords, keyword.trim()]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleTrendClick = (trend: string) => {
    addKeyword(trend);
  };

  const handleReset = () => {
    if (messages.length === 0) return;

    const [firstMessage] = messages;

    setMessages([firstMessage]);
  };

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          displayCloseButton={false}
          className="max-w-[100vw] md:max-w-[70vw] font-gamja p-0 border-0 shadow-2xl sm:rounded-t-lg rounded-t-lg sm:rounded-b-lg sm:mt-0 mt-12 sm:h-[calc(100vh-300px)] h-[calc(100vh-100px)] overflow-hidden fixed bottom-0 sm:bottom-auto animate-in slide-in-from-bottom duration-300"
        >
          <DialogTitle className="sr-only">
            Daydream Assistant Dialog
          </DialogTitle>
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
                  variant={"outline"}
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
              {/* Main chat area */}
              <div
                className={`flex-1 flex flex-col overflow-hidden transition-all ${
                  showSettings ? "w-0 sm:w-1/2 md:w-3/5" : "w-full"
                }`}
              >
                <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 bg-gray-50">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-xl ${
                          message.role === "user"
                            ? "bg-zinc-800 text-white"
                            : "bg-gray-200 text-gray-800"
                        }`}
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
                        Standby, thinking...
                        <Loader2 className="h-5 w-5 animate-spin text-gray-500 ml-1" />{" "}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={e => {
                        setInputMessage(e.target.value);
                        handleResizeInput(e);
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message..."
                      className="flex-1 bg-white border border-gray-300 rounded-lg p-3 text-gray-800 text-sm focus:outline-none resize-none min-h-[44px] max-h-[200px]"
                      rows={1}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputMessage.trim()}
                      className="bg-zinc-900 hover:bg-zinc-700 text-white p-3 rounded-lg h-[48px] w-[48px] flex items-center justify-center"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Settings panel - slides in from right */}
              <div
                className={`bg-gray-50 border-l border-gray-200 overflow-y-auto no-scrollbar transition-all duration-300 ${
                  showSettings ? "w-full sm:w-1/2 md:w-2/5" : "w-0"
                }`}
              >
                {showSettings && (
                  <div className="p-4 sm:p-6">
                    <div className="mb-5">
                      <h3 className="text-sm md:text-base font-medium mb-2 text-zinc-900">
                        Choose a style
                      </h3>

                      <div className="relative">
                        <div
                          ref={scrollContainerRef}
                          className="flex overflow-x-auto py-2 px-1 scrollbar-hide gap-2 snap-x"
                          style={{
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                          }}
                        >
                          {presets.map(preset => (
                            <button
                              key={preset.id}
                              onClick={() => handlePresetClick(preset)}
                              className={`shrink-0 min-w-[100px] flex justify-center items-center text-sm gap-2 whitespace-nowrap py-2 px-4 cursor-pointer rounded-full transition-all snap-start ${
                                selectedPreset?.id === preset.id
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
                      <h3 className="text-sm md:text-base font-medium mb-2 text-zinc-900">
                        Enter keywords
                      </h3>

                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {keywords.map((keyword, index) => (
                          <div
                            key={index}
                            className="bg-white border border-gray-300 rounded-full px-3 py-2 flex items-center gap-1"
                          >
                            <span className="text-gray-700 text-sm">
                              {keyword}
                            </span>
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
                            placeholder="Type and press Enter (optional)"
                            className="bg-white border border-gray-300 placeholder:text-sm rounded-full w-full sm:w-[230px] px-4 py-2 focus:outline-none "
                          />
                        )}
                      </div>
                    </div>

                    {/* Trends dropdown */}
                    <div className="relative mb-5">
                      <h3 className="text-sm md:text-base font-medium mb-2 text-zinc-900">
                        Use world trends 🔥
                      </h3>

                      <div className="mt-1.5 w-full max-h-64 overflow-y-auto no-scrollbar rounded">
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
                                  onClick={() =>
                                    handleTrendClick(trendItem.trend)
                                  }
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
                                  title={`${trendItem.trend}`}
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

                    <div className="mb-5">
                      <h3 className="text-sm md:text-base font-medium mb-2 text-zinc-900">
                        Reasoning model
                      </h3>
                      <div className="flex justify-between items-center">
                        <p className="text-gray-600 text-sm">
                          Better, more detailed results.
                        </p>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            value=""
                            className="sr-only peer focus:ring-0 active:ring-0"
                            checked
                            readOnly
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-zinc-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="font-gamja p-0 border-0 shadow-2xl sm:rounded-t-lg rounded-t-lg sm:rounded-b-lg h-[calc(100vh-100px)] overflow-hidden animate-in slide-in-from-bottom duration-300">
        <DrawerTitle className="sr-only">Daydream Assistant Drawer</DrawerTitle>
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
                variant={"outline"}
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
            {/* Main chat area */}
            <div
              className={`flex-1 flex flex-col overflow-hidden transition-all ${
                showSettings ? "w-0 sm:w-1/2 md:w-3/5" : "w-full"
              }`}
            >
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 bg-gray-50">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-xl ${
                        message.role === "user"
                          ? "bg-zinc-800 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
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
                      Standby, thinking...
                      <Loader2 className="h-5 w-5 animate-spin text-gray-500 ml-1" />{" "}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={e => {
                      setInputMessage(e.target.value);
                      handleResizeInput(e);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="flex-1 bg-white border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none  resize-none min-h-[44px] max-h-[200px]"
                    rows={1}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-zinc-900 hover:bg-zinc-700 text-white p-3 rounded-lg h-[50px] w-[48px] flex items-center justify-center"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Settings panel - slides in from right */}
            <div
              className={`bg-gray-50 border-l border-gray-200 overflow-y-auto no-scrollbar transition-all duration-300 ${
                showSettings ? "w-full sm:w-1/2 md:w-2/5" : "w-0"
              }`}
            >
              {showSettings && (
                <div className="p-4 sm:p-6">
                  <div className="mb-5">
                    <h3 className="text-sm md:text-base font-medium mb-2 text-zinc-900">
                      Choose a style
                    </h3>

                    <div className="relative">
                      <div
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto py-2 px-1 scrollbar-hide gap-2 snap-x"
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                        }}
                      >
                        {presets.map(preset => (
                          <button
                            key={preset.id}
                            onClick={() => handlePresetClick(preset)}
                            className={`shrink-0 min-w-[100px] flex justify-center items-center text-sm gap-2 whitespace-nowrap py-2 px-4 cursor-pointer rounded-full transition-all snap-start ${
                              selectedPreset?.id === preset.id
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
                    <h3 className="text-sm md:text-base font-medium mb-2 text-zinc-900">
                      Enter keywords
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {keywords.map((keyword, index) => (
                        <div
                          key={index}
                          className="bg-white border border-gray-300 rounded-full px-3 py-2 flex items-center gap-1"
                        >
                          <span className="text-gray-700 text-sm">
                            {keyword}
                          </span>
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
                          placeholder="Type and press Enter (optional)"
                          className="bg-white border border-gray-300 placeholder:text-sm rounded-full w-full sm:w-[230px] px-4 py-2 focus:outline-none "
                        />
                      )}
                    </div>
                  </div>

                  {/* Trends dropdown */}
                  <div className="relative mb-5">
                    <h3 className="text-sm md:text-base font-medium mb-2 text-zinc-900">
                      Use world trends 🔥
                    </h3>

                    <div className="mt-1.5 w-full max-h-64 overflow-y-auto no-scrollbar rounded">
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
                                onClick={() =>
                                  handleTrendClick(trendItem.trend)
                                }
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
                                title={`${trendItem.trend}`}
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

                  <div className="mb-5">
                    <h3 className="text-sm md:text-base font-medium mb-2 text-zinc-900">
                      Reasoning model
                    </h3>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600 text-sm">
                        Better, more detailed results.
                      </p>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          value=""
                          className="sr-only peer focus:ring-0 active:ring-0"
                          checked
                          readOnly
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-zinc-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
