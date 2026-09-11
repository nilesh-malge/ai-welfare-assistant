"use client";

import { FormEvent, useState } from "react";

type ChatWindowProps = {
  conversationId: number;
};

type Message = {
  id: number;
  role: "assistant" | "student";
  content: string;
};

export default function ChatWindow({ conversationId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: -1,
      role: "assistant",
      content:
        "Hi, I’m the student support assistant. Tell me what’s going on and I’ll do my best to help.",
    },
  ]);

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    const temporaryMessageId = -Date.now();

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: temporaryMessageId,
        role: "student",
        content: trimmedMessage,
      },
    ]);

    setMessage("");
    setIsSending(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          content: trimmedMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to send message:", data.error);

        setMessages((currentMessages) =>
          currentMessages.filter((item) => item.id !== temporaryMessageId),
        );

        setMessage(trimmedMessage);

        return;
      }

      setMessages((currentMessages) => {
        const updatedMessages = currentMessages.map((item) =>
          item.id === temporaryMessageId
            ? {
                id: data.studentMessage.id,
                role: "student" as const,
                content: data.studentMessage.content,
              }
            : item,
        );

        if (data.assistantMessage) {
          updatedMessages.push({
            id: data.assistantMessage.id,
            role: "assistant",
            content: data.assistantMessage.content,
          });
        }

        return updatedMessages;
      });
    } catch (error) {
      console.error("Failed to send message:", error);

      setMessages((currentMessages) =>
        currentMessages.filter((item) => item.id !== temporaryMessageId),
      );

      setMessage(trimmedMessage);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex min-h-125 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
        {messages.map((item) => (
          <div
            key={item.id}
            className={`flex ${
              item.role === "student" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                item.role === "student"
                  ? "rounded-br-md bg-slate-900 text-white"
                  : "rounded-tl-md bg-slate-100 text-slate-700"
              }`}
            >
              {item.content}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-md bg-slate-100 px-4 py-3 text-sm text-slate-500">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Type your message..."
            disabled={isSending}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <button
            type="submit"
            disabled={isSending}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
