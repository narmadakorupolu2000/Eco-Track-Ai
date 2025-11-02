"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bell,
  Bot,
  Leaf,
  LogOut,
  MessageCircle,
  Search,
  Send,
  Settings,
  Trash2,
  User,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function EcoChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm EcoBot, your AI assistant for all things eco-friendly and sustainable. How can I help you today?",
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Generate unique session ID on mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem("ecobot_session_id")
    if (storedSessionId) {
      setSessionId(storedSessionId)
      // Load conversation history from localStorage
      const storedMessages = localStorage.getItem(`ecobot_messages_${storedSessionId}`)
      if (storedMessages) {
        try {
          const parsedMessages = JSON.parse(storedMessages)
          setMessages(parsedMessages)
        } catch (error) {
          console.error("Error loading messages:", error)
        }
      }
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setSessionId(newSessionId)
      localStorage.setItem("ecobot_session_id", newSessionId)
    }
  }, [])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (sessionId && messages.length > 1) {
      localStorage.setItem(`ecobot_messages_${sessionId}`, JSON.stringify(messages))
    }
  }, [messages, sessionId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage("")
    
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    // Add a placeholder message for the assistant that will be updated with streaming content
    const assistantMessageIndex = messages.length + 1
    setMessages((prev) => [...prev, { role: "assistant", content: "" }])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: userMessage,
          sessionId: sessionId 
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      // Handle streaming response - simple text stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let accumulatedText = ""
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Decode the chunk and add to accumulated text
          const chunk = decoder.decode(value, { stream: true })
          accumulatedText += chunk
          
          // Update the assistant message in real-time
          setMessages((prev) => {
            const newMessages = [...prev]
            newMessages[assistantMessageIndex] = {
              role: "assistant",
              content: accumulatedText
            }
            return newMessages
          })
        }
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) => {
        const newMessages = [...prev]
        newMessages[assistantMessageIndex] = {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        }
        return newMessages
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = () => {
    if (confirm("Are you sure you want to clear the chat history?")) {
      setMessages([
        {
          role: "assistant",
          content: "Hello! I'm EcoBot, your AI assistant for all things eco-friendly and sustainable. How can I help you today?",
        },
      ])
      if (sessionId) {
        localStorage.removeItem(`ecobot_messages_${sessionId}`)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Leaf className="h-8 w-8 text-green-600" />
                <h1 className="text-2xl font-bold text-green-800 dark:text-green-400">EcoTrack AI</h1>
              </Link>
              <nav className="hidden md:flex items-center gap-6 ml-8">
                <Link href="/dashboard" className="text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400">
                  Dashboard
                </Link>
                <Link href="/waste-classifier" className="text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400">
                  Classify Waste
                </Link>
                <Link href="/eco-chat" className="text-green-600 font-medium">
                  EcoChat
                </Link>
                <Link href="/tracking" className="text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400">
                  Tracking
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <MessageCircle className="h-10 w-10 text-green-600" />
              EcoChat Assistant
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Ask me anything about sustainability, eco-friendly living, and reducing your carbon footprint!
            </p>
          </div>
          <Card className="shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-green-600" />
                  Chat with EcoBot
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearChat}
                  className="text-gray-600 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Chat
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px] p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                      )}
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[80%] ${
                          message.role === "user"
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {message.role === "assistant" && !message.content && isLoading ? (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content || ""}</p>
                        )}
                      </div>
                      {message.role === "user" && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-green-600 animate-pulse" />
                        </div>
                      </div>
                      <div className="rounded-lg px-4 py-2 bg-gray-100 dark:bg-gray-800">
                        <p className="text-sm text-gray-500">Typing...</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me about eco-friendly tips, recycling, carbon footprint..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Quick Questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="justify-start text-left h-auto py-3"
                onClick={() => setInputMessage("How can I reduce my carbon footprint?")}
              >
                How can I reduce my carbon footprint?
              </Button>
              <Button
                variant="outline"
                className="justify-start text-left h-auto py-3"
                onClick={() => setInputMessage("What are the best recycling practices?")}
              >
                What are the best recycling practices?
              </Button>
              <Button
                variant="outline"
                className="justify-start text-left h-auto py-3"
                onClick={() => setInputMessage("How to start composting at home?")}
              >
                How to start composting at home?
              </Button>
              <Button
                variant="outline"
                className="justify-start text-left h-auto py-3"
                onClick={() => setInputMessage("What are eco-friendly alternatives to plastic?")}
              >
                What are eco-friendly alternatives to plastic?
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
