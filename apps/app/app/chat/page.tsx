import { ChatContainer } from "@/components/chat/chat-container";

export default function ChatPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-full max-w-5xl">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Daydream Prompting System
        </h1>
        <p className="text-lg text-center mb-8 text-muted-foreground">
          Describe what you want to visualize, and I&apos;ll help you create it.
        </p>
        <ChatContainer />
      </div>
    </main>
  );
}
