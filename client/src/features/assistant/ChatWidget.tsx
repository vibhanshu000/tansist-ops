import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, X, Loader2, Sparkles } from "lucide-react";
import { apiPost } from "../../lib/api";
import { useAuth } from "../auth/AuthContext";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  reply: string;
  actions: { tool: string; args: unknown; result: unknown }[];
}

const SUGGESTIONS = [
  "How many vehicles are available right now?",
  "Show me a fleet summary",
  "Which driver licenses expire in the next 30 days?",
  "Put vehicle Van-05 in the shop for a brake repair",
];

export function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  if (!user) return null;

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await apiPost<ChatResponse>("/assistant/chat", { messages: next });
      setMessages([...next, { role: "assistant", content: res.reply || "(no response)" }]);
    } catch (err: any) {
      setMessages([
        ...next,
        { role: "assistant", content: `⚠️ ${err.message ?? "Something went wrong."}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Launcher */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary-hover"
        aria-label="Open assistant"
      >
        {open ? <X size={24} /> : <Bot size={24} />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-6 z-40 flex h-[560px] max-h-[80vh] w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-card border border-appborder bg-surface shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-appborder bg-primary px-4 py-3 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold">TransitOps Copilot</div>
                <div className="text-xs text-white/80">Signed in as {user.role}</div>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-text-secondary">
                    Ask about the fleet or manage vehicles in plain English. Try:
                  </p>
                  <div className="flex flex-col gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-btn border border-appborder px-3 py-2 text-left text-sm text-text-primary transition-colors hover:bg-appbg"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-card px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-white"
                        : "border border-appborder bg-appbg text-text-primary"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {busy && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-card border border-appborder bg-appbg px-3 py-2 text-sm text-text-secondary">
                    <Loader2 size={14} className="animate-spin" /> Thinking…
                  </div>
                </div>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-appborder p-3"
            >
              <input
                className="input"
                placeholder="Ask or instruct…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={busy}
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="btn-primary !px-3"
                aria-label="Send"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
