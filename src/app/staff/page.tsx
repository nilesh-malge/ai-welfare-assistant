"use client";

import { useEffect, useState } from "react";

type CaseMessage = {
  id: number;
  role: string;
  content: string;
  category: string | null;
  urgency: string | null;
  safeguarding: boolean | null;
  disposition: string | null;
  createdAt: string;
};

type SupportCase = {
  id: number;
  conversationId: number;
  summary: string;
  status: string;
  urgency: string;
  safeguarding: boolean;
  claimedBy: string | null;
  claimedAt: string | null;
  createdAt: string;
  student: {
    name: string;
    email: string;
  } | null;
  messages: CaseMessage[];
};

export default function StaffPage() {
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<SupportCase | null>(null);
  const [staffName, setStaffName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState("");
  const [claimMessage, setClaimMessage] = useState("");

  useEffect(() => {
    async function loadCases() {
      try {
        const response = await fetch("/api/staff/cases");
        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Unable to load cases.");
          return;
        }

        setCases(data.cases);

        if (data.cases.length > 0) {
          setSelectedCase(data.cases[0]);
        }
      } catch (error) {
        console.error("Failed to load cases:", error);
        setError("Unable to load cases.");
      } finally {
        setIsLoading(false);
      }
    }

    loadCases();
  }, []);

  async function handleClaim() {
    if (!selectedCase) {
      return;
    }

    const trimmedStaffName = staffName.trim();

    if (!trimmedStaffName) {
      setClaimMessage("Enter your name before claiming a case.");
      return;
    }

    setIsClaiming(true);
    setClaimMessage("");

    try {
      const response = await fetch(
        `/api/staff/cases/${selectedCase.id}/claim`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            staffName: trimmedStaffName,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setClaimMessage(
          data.claimedBy
            ? `This case has already been claimed by ${data.claimedBy}.`
            : (data.error ?? "Unable to claim this case."),
        );
        return;
      }

      const updatedCase: SupportCase = {
        ...selectedCase,
        claimedBy: data.case.claimedBy,
        claimedAt: data.case.claimedAt,
        status: data.case.status,
      };

      setSelectedCase(updatedCase);

      setCases((currentCases) =>
        currentCases.map((supportCase) =>
          supportCase.id === updatedCase.id ? updatedCase : supportCase,
        ),
      );

      setClaimMessage("Case claimed successfully.");
    } catch (error) {
      console.error("Failed to claim case:", error);
      setClaimMessage("Unable to claim this case.");
    } finally {
      setIsClaiming(false);
    }
  }

  async function handleStatusChange(status: string) {
    if (!selectedCase) {
      return;
    }

    try {
      const response = await fetch(
        `/api/staff/cases/${selectedCase.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setClaimMessage(data.error ?? "Unable to update case status.");
        return;
      }

      const updatedCase: SupportCase = {
        ...selectedCase,
        status: data.case.status,
      };

      setSelectedCase(updatedCase);

      setCases((currentCases) =>
        currentCases.map((supportCase) =>
          supportCase.id === updatedCase.id ? updatedCase : supportCase,
        ),
      );

      setClaimMessage("Case status updated.");
    } catch (error) {
      console.error("Failed to update case status:", error);
      setClaimMessage("Unable to update case status.");
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <p className="text-sm text-slate-500">Loading support cases...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            Support cases
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review and manage enquiries that need human follow-up.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-medium text-slate-900">Escalated cases</h2>

              <p className="mt-1 text-sm text-slate-500">
                {cases.length} case{cases.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              {cases.map((supportCase) => (
                <button
                  key={supportCase.id}
                  type="button"
                  onClick={() => {
                    setSelectedCase(supportCase);
                    setClaimMessage("");
                  }}
                  className={`w-full px-5 py-4 text-left hover:bg-slate-50 ${
                    selectedCase?.id === supportCase.id ? "bg-slate-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {supportCase.student?.name ?? "Unknown student"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {supportCase.student?.email ?? "No email available"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        supportCase.urgency === "critical"
                          ? "bg-red-100 text-red-700"
                          : supportCase.urgency === "high"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {supportCase.urgency}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {supportCase.safeguarding && (
                      <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                        Safeguarding
                      </span>
                    )}

                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      {supportCase.status}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-600">
                    {supportCase.summary}
                  </p>
                </button>
              ))}

              {cases.length === 0 && (
                <div className="px-5 py-10 text-center text-sm text-slate-500">
                  No escalated cases.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white">
            {selectedCase ? (
              <>
                <div className="border-b border-slate-200 px-6 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {selectedCase.student?.name ?? "Unknown student"}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {selectedCase.student?.email ?? "No email available"}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {selectedCase.safeguarding && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                          Safeguarding
                        </span>
                      )}

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {selectedCase.status}
                      </span>

                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                        {selectedCase.urgency}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <div className="flex flex-wrap items-center gap-4">
                      {selectedCase.claimedBy ? (
                        <p className="text-sm text-slate-600">
                          Claimed by{" "}
                          <span className="font-medium text-slate-900">
                            {selectedCase.claimedBy}
                          </span>
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          <input
                            type="text"
                            value={staffName}
                            onChange={(event) =>
                              setStaffName(event.target.value)
                            }
                            placeholder="Your name"
                            className="min-w-56 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500"
                          />

                          <button
                            type="button"
                            onClick={handleClaim}
                            disabled={isClaiming}
                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isClaiming ? "Claiming..." : "Claim case"}
                          </button>
                        </div>
                      )}

                      <select
                        value={selectedCase.status}
                        onChange={(event) =>
                          handleStatusChange(event.target.value)
                        }
                        className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500"
                      >
                        <option value="new">New</option>
                        <option value="in progress">In progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>

                    {claimMessage && (
                      <p className="mt-3 text-sm text-slate-600">
                        {claimMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-b border-slate-200 px-6 py-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Case summary
                  </p>

                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                    {selectedCase.summary}
                  </p>
                </div>

                <div className="px-6 py-5">
                  <h3 className="mb-5 font-medium text-slate-900">
                    Conversation
                  </h3>

                  <div className="space-y-4">
                    {selectedCase.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === "student"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                            message.role === "student"
                              ? "rounded-br-md bg-slate-900 text-white"
                              : "rounded-tl-md bg-slate-100 text-slate-700"
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-10 text-center text-sm text-slate-500">
                Select a case to view the conversation.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
