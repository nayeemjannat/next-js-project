"use client"
import React, { useState, useRef } from "react"

type Msg = { role: "user" | "assistant"; text: string }

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  async function send() {
    if (!input.trim()) return
    const q = input.trim()
    setMessages((m) => [...m, { role: "user", text: q }])
    setInput("")
    setLoading(true)
    try {
      const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ question: q }), headers: { "Content-Type": "application/json" } })
      const data = await res.json()
      if (data?.answer) setMessages((m) => [...m, { role: "assistant", text: data.answer }])
      else setMessages((m) => [...m, { role: "assistant", text: "Sorry, I couldn't get an answer right now." }])
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: "Error contacting assistant." }])
    } finally {
      setLoading(false)
      setOpen(true)
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" })
    }
  }

  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 60 }}>
      {open && (
        <div style={{ width: 340, maxHeight: 480, boxShadow: "0 6px 24px rgba(0,0,0,0.15)", borderRadius: 12, overflow: "hidden", background: "white" }}>
          <div style={{ padding: 10, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>Homease Assistant</strong>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setOpen(false) }} aria-label="Minimize">_</button>
            </div>
          </div>
          <div ref={containerRef} style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", maxHeight: 360 }}>
            {messages.length === 0 && <div style={{ color: "#666" }}>Ask me about services, pricing, booking, and more.</div>}
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", background: m.role === "user" ? "#DCFCE7" : "#F3F4F6", padding: 8, borderRadius: 8, maxWidth: "85%" }}>{m.text}</div>
            ))}
            {loading && <div style={{ color: "#999" }}>Assistant is typing...</div>}
          </div>
          <div style={{ padding: 8, borderTop: "1px solid #eee", display: "flex", gap: 8 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send() }} placeholder="Ask a question..." style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #e5e7eb" }} />
            <button onClick={send} disabled={loading} style={{ padding: "8px 10px", borderRadius: 6, background: "#2563EB", color: "white" }}>Send</button>
          </div>
        </div>
      )}

      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Open chat" style={{ width: 56, height: 56, borderRadius: 28, background: "#2563EB", color: "white", boxShadow: "0 6px 18px rgba(37,99,235,0.35)", border: "none" }}>💬</button>
      )}
    </div>
  )
}
