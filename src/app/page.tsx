"use client";

import { useState } from "react";
import ChatWindow from "@/components/chat/ChatWindow";
import StudentDetails from "@/components/chat/StudentDetails";

type Student = {
  id: number;
  name: string;
  email: string;
};

export default function Home() {
  const [student, setStudent] = useState<Student | null>(null);
  const [error, setError] = useState("");

  async function handleStudentDetails(name: string, email: string) {
    setError("");

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to start the conversation.");
        return;
      }

      setStudent(data);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setError("Unable to start the conversation.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-6 py-5">
            <h1 className="text-xl font-semibold text-slate-900">
              Student Support
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Tell us what you need help with and we&apos;ll guide you to the
              right support.
            </p>
          </header>

          {error && (
            <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {student ? (
            <ChatWindow conversationId={student.id} />
          ) : (
            <StudentDetails onContinue={handleStudentDetails} />
          )}
        </div>
      </div>
    </main>
  );
}
