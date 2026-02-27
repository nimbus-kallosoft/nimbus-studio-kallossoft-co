"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signInError) {
      if (signInError.message.includes("invite-only")) {
        setError("Registration is invite-only");
      } else {
        setError(signInError.message);
      }
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#050510] px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }}
        className="w-full max-w-sm"
      >
        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          {/* Glow effect */}
          <div className="pointer-events-none absolute -inset-px rounded-2xl">
            <motion.div
              className="h-full w-full rounded-2xl opacity-30 blur-xl"
              style={{
                background:
                  "conic-gradient(from 0deg, #8b5cf6, #3b82f6, #8b5cf6)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <div className="relative z-10">
            {/* Nimbus logo */}
            <div className="mb-6 flex justify-center">
              <motion.div
                className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(139,92,246,0.3)",
                    "0 0 40px rgba(59,130,246,0.4)",
                    "0 0 20px rgba(139,92,246,0.3)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                  />
                </svg>
              </motion.div>
            </div>

            <h1 className="mb-1 text-center text-xl font-semibold text-gray-100">
              Nimbus Studio
            </h1>
            <p className="mb-6 text-center text-sm text-gray-400">
              Sign in with your email
            </p>

            <AnimatePresence mode="wait">
              {!sent ? (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 outline-none transition-colors focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
                  />

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-400"
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send magic link"}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <motion.div
                    className="mb-4 text-4xl"
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    ✉️
                  </motion.div>
                  <p className="text-sm text-gray-300">
                    Check your email for the magic link
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Sent to {email}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
