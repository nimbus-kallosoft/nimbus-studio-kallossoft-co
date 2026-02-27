"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InputBarProps {
  onSend: (text: string) => void;
  onVoiceResult: (text: string) => void;
  disabled?: boolean;
}

export function InputBar({ onSend, onVoiceResult, disabled }: InputBarProps) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");

        try {
          const res = await fetch("/api/voice/transcribe", {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.text) onVoiceResult(data.text);
          }
        } catch {
          // Voice transcription failed silently
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      // Mic access denied or unavailable
    }
  }, [onVoiceResult]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  return (
    <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-white/5 bg-[#050510]/90 backdrop-blur-lg">
      <div className="safe-area-bottom mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
        {/* Mic button */}
        <button
          type="button"
          onPointerDown={startRecording}
          onPointerUp={stopRecording}
          onPointerLeave={stopRecording}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/5"
          aria-label="Hold to record"
        >
          <AnimatePresence>
            {recording && (
              <>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border border-red-400/40"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.5,
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
          <svg
            viewBox="0 0 24 24"
            className={`h-5 w-5 ${recording ? "text-red-400" : "text-gray-400"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
            />
          </svg>
        </button>

        {/* Text input */}
        <form onSubmit={handleSubmit} className="flex flex-1 gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask Nimbus anything..."
            disabled={disabled}
            className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-gray-100 placeholder-gray-500 outline-none transition-colors focus:border-violet-500/50 disabled:opacity-50"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!text.trim() || disabled}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-opacity hover:opacity-90 disabled:opacity-30"
            aria-label="Send message"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
