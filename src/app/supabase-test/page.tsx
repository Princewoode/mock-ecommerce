"use client";

import { useState } from "react";
import { testSupabaseConnection } from "@/utils/supabaseServices";

export default function SupabaseTestPage() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleTestConnection() {
    setIsLoading(true);
    setMessage("");

    const result = await testSupabaseConnection();

    setMessage(result.message);
    setIsLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <section className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-bold text-gray-900">
          Supabase Connection Test
        </h1>

        <p className="mt-4 text-gray-600">
          This page checks whether the project can connect to your Supabase
          database.
        </p>

        <button
          type="button"
          onClick={handleTestConnection}
          className="mt-6 rounded-lg bg-black px-6 py-3 text-white"
        >
          {isLoading ? "Testing..." : "Test Connection"}
        </button>

        {message && (
          <div className="mt-6 rounded-lg bg-gray-50 p-4 text-gray-700">
            {message}
          </div>
        )}
      </section>
    </main>
  );
}