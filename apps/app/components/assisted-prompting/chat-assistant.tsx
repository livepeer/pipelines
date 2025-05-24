import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import {
  chatWithAI,
  cleanDenoiseParam,
  trimMessage,
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
  const [keywordInput, setKeywordInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState({ id: "none" });

  useEffect(() => {
    if (isMobile && chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isMobile, messages]);

  useEffect(() => {
    const initialMessages: Message[] = [
      {
        role: "assistant",
        content:
          "Hi 👋, I'll help you create amazing Daydream transformations! Just describe your desired character or scene, and I'll craft the perfect prompt.",
      },
    ];

    setMessages(initialMessages);

    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user" as const, content: userMessage },
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
        { role: "assistant" as const, content: response },
      ]);
    } catch (error) {
      console.error("Error in chat:", error);
      setMessages([
        ...updatedMessages,
        {
          role: "assistant" as const,
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
      .find(msg => msg.role === "assistant");

    // add to ensure only prompt is saved
    if (lastAssistantMessage) {
      let content = lastAssistantMessage.content
        .replace(
          "Hi 👋, how would you like to improve the following prompt?\n\n",
          "",
        )
        .split("Key Improvements and Changes:")[0]
        .trim();

      // for some reason the Denoise param breaks the stream - remove when fixed
      onSavePrompt(cleanDenoiseParam(content));
    }
  };

  const handleReset = () => {
    if (messages.length > 0) {
      setMessages([messages[0]]);
    }
  };

  const handleResizeInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
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

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <>
      {!isMobile ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent
            displayCloseButton={false}
            style={{ zIndex: 9999 }}
            className="max-w-[100vw] md:max-w-[70vw] z-[250] font-gamja p-0 border-0 shadow-2xl sm:rounded-t-lg rounded-t-lg sm:rounded-b-lg sm:mt-0 mt-12 sm:h-[calc(100vh-300px)] h-[calc(100vh-100px)] fixed bottom-0 sm:bottom-auto animate-in slide-in-from-bottom duration-300"
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
          <DrawerContent className="[&>div:first-child]:hidden font-gamja p-0 z-[250] border-0 shadow-2xl sm:rounded-t-lg rounded-t-lg sm:rounded-b-lg h-[calc(100vh-100px)] overflow-hidden animate-in slide-in-from-bottom duration-300">
            <ChatUI
              isMobile={isMobile}
              handleSavePrompt={handleSavePrompt}
              handleReset={handleReset}
              showSettings={showSettings}
              setShowSettings={setShowSettings}
              messages={messages}
              isLoading={isLoading}
              inputMessage={inputMessage}
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
