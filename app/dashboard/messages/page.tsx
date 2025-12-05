"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Search, Send } from "lucide-react"
import { useState } from "react"

export default function MessagesPage() {
  const [selectedChat, setSelectedChat] = useState<number | null>(1)

  const conversations = [
    {
      id: 1,
      name: "Alex R.",
      service: "Home Cleaning",
      lastMessage: "Perfect! See you tomorrow at 10 AM",
      unread: false,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop",
    },
    {
      id: 2,
      name: "Sarah L.",
      service: "Electrical Repair",
      lastMessage: "Can you provide a quote for the work?",
      unread: true,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop",
    },
    {
      id: 3,
      name: "Mike J.",
      service: "Plumbing Service",
      lastMessage: "I'll bring all necessary tools",
      unread: false,
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop",
    },
  ]

  const messages = [
    { id: 1, sender: "provider", text: "Hi! I'm interested in your home cleaning service.", time: "10:30 AM" },
    { id: 2, sender: "user", text: "Great! Are you available next Saturday?", time: "10:32 AM" },
    { id: 3, sender: "provider", text: "Perfect! See you tomorrow at 10 AM", time: "10:35 AM" },
  ]

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Messages</h1>

      <div className="flex gap-6 h-[600px]">
        {/* Conversations List */}
        <div className="w-80 flex flex-col">
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search conversations..." className="pl-10" />
          </div>

          <div className="space-y-2 overflow-y-auto flex-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedChat(conv.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  selectedChat === conv.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                }`}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={conv.image || "/placeholder.svg"} />
                  <AvatarFallback>{conv.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{conv.name}</p>
                  <p className={`text-xs ${conv.unread ? "font-semibold" : "text-muted-foreground"}`}>
                    {conv.lastMessage}
                  </p>
                </div>
                {conv.unread && <div className="w-2 h-2 bg-primary rounded-full"></div>}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col">
          {selectedChat && (
            <>
              {/* Chat Header */}
              <div className="border-b border-border p-4">
                <h2 className="font-semibold">{conversations[selectedChat - 1].name}</h2>
                <p className="text-xs text-muted-foreground">{conversations[selectedChat - 1].service}</p>
              </div>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p
                        className={`text-xs mt-1 ${msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                      >
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>

              {/* Input Area */}
              <div className="border-t border-border p-4 flex gap-2">
                <Input placeholder="Type a message..." className="flex-1" />
                <Button size="icon" className="bg-primary hover:bg-primary/90">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
