import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import {
  chatWithAI,
  cleanDenoiseParam,
  extractSuggestions,
} from "@/lib/prompting/groq";
import {
  Dialog,
  DialogContent,
} from "@repo/design-system/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
} from "@repo/design-system/components/ui/drawer";
import { useWorldTrends } from "@/hooks/useWorldTrends";
import useMobileStore from "@/hooks/useMobileStore";
import { ChatUI } from "./chat-ui";

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
  const { trends, loading } = useWorldTrends();
  const { isMobile } = useMobileStore();
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState({ id: "none" });

  useEffect(() => {
    if (isMobile) {
      const container = chatContainerRef.current;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isMobile, messages]);


  useEffect(() => {
    const initialMessages: Message[] = [];

    if (initialPrompt) {
      initialMessages.push({
        role: "assistant",
        content: `${initialPrompt}\n\nHow would you like to enhance your prompt?`,
      });
    } else {
      initialMessages.push({
        role: "assistant",
        content:
          "Hi! Tell me what you like to create and I'll craft the perfect prompt. \n\nℹ️ Quick tip: minimize this window to explore randomly with the generate button!",
      });
    }

    setMessages(initialMessages);

    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSendMessage = async (message?: string) => {
    const finalMessage = message ? message.trim() : inputMessage.trim();

    if (!finalMessage) return;

    const userMessage = finalMessage.trim();
    setInputMessage("");
    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const rawResponse = await chatWithAI({
        messages: updatedMessages,
        style: selectedPreset.id,
        keywords,
      });

      const { content, suggestions: newSuggestions } =
        // extract suggestions from response
        extractSuggestions(rawResponse);

      setSuggestions(newSuggestions);

      setMessages([...updatedMessages, { role: "assistant", content }]);
    } catch (error) {
      console.error("Error in chat:", error);
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "That didn't quite work out. Let's give it another spin!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePrompt = () => {
    const lastAssistantMessage = [...messages]
      .reverse()
      .find(msg => msg.role === "assistant" && !msg.content.startsWith("Hi!"));

    if (lastAssistantMessage) {
      let content = lastAssistantMessage.content
        .replace("That didn't quite work out. Let's give it another spin!", "")
        .split("What's New:")[0]
        .trim();

      // for some reason the Denoise param breaks the stream - remove when fixed
      onSavePrompt(cleanDenoiseParam(content));
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! Tell me what you like to create and I'll craft the perfect prompt. \n\nℹ️ Quick tip: minimize this window to explore randomly with the generate button!",
      },
    ]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleResizeInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleKeywordKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && keywordInput.trim()) {
      if (keywords.length < 3) {
        setKeywords([...keywords, keywordInput.trim()]);
        setKeywordInput("");
      }
    }
  };

  return (
    <>
      {!isMobile ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent
            displayCloseButton={false}
            style={{ zIndex: 9999 }}
            className="max-w-[100vw] md:max-w-[70vw] z-[250] p-0 border-0 shadow-2xl sm:rounded-t-lg rounded-t-lg sm:rounded-b-lg sm:mt-0 mt-12 h-[calc(100vh-300px)] fixed bottom-0 sm:bottom-auto animate-in slide-in-from-bottom duration-300"
          >
            <ChatUI
              isMobile={isMobile}
              handleSavePrompt={handleSavePrompt}
              handleReset={handleReset}
              showSettings={showSettings}
              setShowSettings={setShowSettings}
              messages={messages}
              isLoading={isLoading}
              inputMessage={inputMessage}
              suggestions={suggestions}
              setInputMessage={setInputMessage}
              handleSendMessage={handleSendMessage}
              handleKeyDown={handleKeyDown}
              handleResizeInput={handleResizeInput}
              keywords={keywords}
              keywordInput={keywordInput}
              handleKeywordInputChange={e => setKeywordInput(e.target.value)}
              handleKeywordKeyDown={handleKeywordKeyDown}
              removeKeyword={index =>
                setKeywords(keywords.filter((_, i) => i !== index))
              }
              trends={trends}
              loading={loading}
              handleTrendClick={trend =>
                keywords.length < 3 && setKeywords([...keywords, trend])
              }
              selectedPreset={selectedPreset}
              handlePresetClick={setSelectedPreset}
              messagesEndRef={messagesEndRef}
              scrollContainerRef={scrollContainerRef}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="[&>div:first-child]:hidden p-0 z-[250] border-0 shadow-2xl h-[85dvh] overflow-hidden animate-in slide-in-from-bottom duration-300">
            <ChatUI
              isMobile={isMobile}
              handleSavePrompt={handleSavePrompt}
              handleReset={handleReset}
              showSettings={showSettings}
              setShowSettings={setShowSettings}
              messages={messages}
              isLoading={isLoading}
              inputMessage={inputMessage}
              suggestions={suggestions}
              setInputMessage={setInputMessage}
              handleSendMessage={handleSendMessage}
              handleKeyDown={handleKeyDown}
              handleResizeInput={handleResizeInput}
              keywords={keywords}
              keywordInput={keywordInput}
              handleKeywordInputChange={e => setKeywordInput(e.target.value)}
              handleKeywordKeyDown={handleKeywordKeyDown}
              removeKeyword={index =>
                setKeywords(keywords.filter((_, i) => i !== index))
              }
              trends={trends}
              loading={loading}
              handleTrendClick={trend =>
                keywords.length < 3 && setKeywords([...keywords, trend])
              }
              selectedPreset={selectedPreset}
              handlePresetClick={setSelectedPreset}
              messagesEndRef={messagesEndRef}
              scrollContainerRef={scrollContainerRef}
            />
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
};
