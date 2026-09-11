"use client";

import { FormEvent, useState } from "react";

type StudentDetailsProps = {
  onContinue: (name: string, email: string) => Promise<void>;
};

export default function StudentDetails({ onContinue }: StudentDetailsProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      return;
    }

    onContinue(trimmedName, trimmedEmail);
  }

  return (
    <form onSubmit={handleSubmit} className="px-6 py-8">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-slate-900">Before we start</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Please tell us who you are so the support team can follow up if
          needed.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-500"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
        >
          Start conversation
        </button>
      </div>
    </form>
  );
}
