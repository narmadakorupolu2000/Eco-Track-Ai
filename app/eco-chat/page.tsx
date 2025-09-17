"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Leaf, Send, Bot, User, Lightbulb, Recycle, TreePine, Zap, Settings, LogOut, Bell, Search } from "lucide-react"

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  suggestions?: string[]
}

export default function EcoChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm your EcoChat assistant. I'm here to help you with environmental questions, sustainability tips, and eco-friendly advice. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
      suggestions: [
        "How can I reduce my carbon footprint?",
        "What are the best ways to recycle plastic?",
        "Tips for sustainable living",
        "How to start composting at home?",
      ],
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateBotResponse = async (userMessage: string): Promise<string> => {
    // Simulate API call to Groq
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock responses based on keywords
    const lowerMessage = userMessage.toLowerCase()

    if (lowerMessage.includes("carbon") || lowerMessage.includes("footprint")) {
      return "Great question about carbon footprint! Here are some effective ways to reduce it:\n\n• Use public transportation, bike, or walk instead of driving\n• Switch to renewable energy sources\n• Reduce meat consumption and eat more plant-based meals\n• Buy local and seasonal produce\n• Minimize air travel\n• Use energy-efficient appliances\n• Reduce, reuse, and recycle\n\nWould you like specific tips for any of these areas?"
    }

    if (lowerMessage.includes("recycle") || lowerMessage.includes("plastic")) {
      return "Recycling plastic effectively is crucial for environmental protection! Here's what you need to know:\n\n• Check the recycling number (1-7) on plastic items\n• Clean containers before recycling\n• Remove caps and labels when possible\n• Numbers 1 (PET) and 2 (HDPE) are most commonly recycled\n• Avoid putting plastic bags in regular recycling bins\n• Look for specialized drop-off points for plastic films\n\nRemember: Reduce and reuse before recycling! Would you like tips on reducing plastic use?"
    }

    if (lowerMessage.includes("compost")) {
      return "Composting is an excellent way to reduce waste and create nutrient-rich soil! Here's how to start:\n\n• Choose a composting method (bin, tumbler, or pile)\n• Add 'greens' (nitrogen): fruit scraps, vegetables, coffee grounds\n• Add 'browns' (carbon): dry leaves, paper, cardboard\n• Maintain a 3:1 ratio of browns to greens\n• Turn regularly and keep moist but not soggy\n• Avoid meat, dairy, and oily foods\n• Compost will be ready in 3-6 months\n\nWould you like specific tips for indoor or outdoor composting?"
    }

    if (lowerMessage.includes("sustainable") || lowerMessage.includes("living")) {
      return "Sustainable living is about making choices that meet our needs without compromising future generations! Here are key principles:\n\n• Reduce consumption and waste\n• Choose renewable and recyclable materials\n• Support local and ethical businesses\n• Conserve water and energy\n• Grow your own food when possible\n• Use eco-friendly transportation\n• Buy quality items that last longer\n• Share and repair instead of buying new\n\nWhat aspect of sustainable living interests you most?"
    }

    // Default response
    return "That's an interesting environmental question! While I'd love to provide a detailed answer, I'm still learning about that specific topic. Here are some general eco-friendly tips:\n\n• Reduce energy consumption at home\n• Choose sustainable products\n• Support renewable energy\n• Practice the 3 R's: Reduce, Reuse, Recycle\n\nCould you rephrase your question or ask about a specific environmental topic like recycling, energy conservation, or sustainable living?"
  }

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputMessage.trim()
    if (!content) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    try {
      const botResponse = await generateBotResponse(content)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        sender: "bot",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickActions = [
    { icon: Lightbulb, text: "Energy saving tips", color: "text-yellow-600" },
    { icon: Recycle, text: "Recycling guide", color: "text-green-600" },
    { icon: TreePine, text: "Sustainable living", color: "text-green-700" },
    { icon: Zap, text: "Carbon footprint", color: "text-blue-600" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Leaf className="h-8 w-8 text-green-600" />
                <h1 className="text-2xl font-bold text-green-800 dark:text-green-400">EcoTrack AI</h1>
              </Link>
              <nav className="hidden md:flex items-center gap-6 ml-8">
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
                >
                  Dashboard
                </Link>
                <Link
                  href="/waste-classifier"
                  className="text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
                >
                  Classify Waste
                </Link>
                <Link href="/eco-chat" className="text-green-600 font-medium">
                  EcoChat
                </Link>
                <Link
                  href="/tracking"
                  className="text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
                >
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 h-[calc(100vh-88px)]">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">EcoChat Assistant</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Get personalized environmental advice powered by AI
            </p>
          </div>

          <div className="flex-1 flex gap-6">
            {/* Chat Area */}
            <Card className="flex-1 flex flex-col border-green-200 dark:border-green-800">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-green-600" />
                  <CardTitle>Chat with EcoBot</CardTitle>
                  <Badge variant="secondary" className="ml-auto">
                    Online
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <ScrollArea className="flex-1 px-6">
                  <div className="space-y-4 pb-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.sender === "bot" && (
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-green-600" />
                          </div>
                        )}

                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-3 ${
                            message.sender === "user"
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p
                            className={`text-xs mt-2 ${message.sender === "user" ? "text-green-100" : "text-gray-500"}`}
                          >
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>

                          {message.suggestions && (
                            <div className="mt-3 space-y-2">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Try asking about:</p>
                              <div className="flex flex-wrap gap-2">
                                {message.suggestions.map((suggestion, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs bg-transparent"
                                    onClick={() => handleSendMessage(suggestion)}
                                  >
                                    {suggestion}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {message.sender === "user" && (
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about environmental sustainability..."
                      className="flex-1"
                      disabled={isTyping}
                    />
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={!inputMessage.trim() || isTyping}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sidebar */}
            <div className="w-80 space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Topics</CardTitle>
                  <CardDescription>Popular environmental questions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => handleSendMessage(`Tell me about ${action.text.toLowerCase()}`)}
                    >
                      <action.icon className={`h-4 w-4 mr-3 ${action.color}`} />
                      {action.text}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Chat Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Chat Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Questions Asked</span>
                    <Badge variant="secondary">47</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tips Received</span>
                    <Badge variant="secondary">156</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Points Earned</span>
                    <Badge variant="secondary">+235</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Topics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start text-sm p-2 h-auto">
                      Composting basics
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-sm p-2 h-auto">
                      Solar panel installation
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-sm p-2 h-auto">
                      Plastic alternatives
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-sm p-2 h-auto">
                      Water conservation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
