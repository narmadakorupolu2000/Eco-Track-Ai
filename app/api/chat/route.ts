import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";

// In-memory session storage (for development - use database in production)
const chatSessions = new Map<string, Array<{ role: string; content: string }>>()

export async function POST(request: Request) {
  try {
    const { message, sessionId = "default" } = await request.json()

    // Get or create session history
    if (!chatSessions.has(sessionId)) {
      chatSessions.set(sessionId, [])
    }
    
    const history = chatSessions.get(sessionId)!

    // Add user message to history
    history.push({ role: "user", content: message })

    // Keep only last 10 messages to avoid token limits
    const recentHistory = history.slice(-10)

    // Build conversation context
    const conversationContext = recentHistory
      .map((msg) => `${msg.role === "user" ? "User" : "EcoBot"}: ${msg.content}`)
      .join("\n\n")

    const result = await streamText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `You are EcoBot, an AI assistant specialized in environmental sustainability and eco-friendly living. 
      
      Your role is to provide helpful, accurate, and actionable advice on:
      - Environmental conservation
      - Sustainable living practices
      - Recycling and waste management
      - Carbon footprint reduction
      - Renewable energy
      - Eco-friendly products and alternatives
      - Climate change awareness
      - Green technology
      
      IMPORTANT: Keep your responses CONCISE and BRIEF (2-4 sentences maximum). Be direct and actionable. Avoid long explanations unless specifically asked.
      
      Previous conversation:
      ${conversationContext}
      
      Please provide a helpful, BRIEF response to the user's latest message.`,
      temperature: 0.7,
      onFinish: async ({ text }) => {
        // Add assistant response to history after streaming completes
        history.push({ role: "assistant", content: text })
      },
    })

    return result.toTextStreamResponse({
      headers: {
        "X-Session-Id": sessionId,
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return Response.json({ error: "Failed to generate response" }, { status: 500 })
  }
}

