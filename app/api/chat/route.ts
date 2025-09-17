import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: Request) {
  try {
    const { message } = await request.json()

    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
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
      
      Always be encouraging, informative, and practical in your responses. Provide specific tips and actionable advice when possible.
      
      User question: ${message}`,
    })

    return Response.json({ response: text })
  } catch (error) {
    console.error("Chat API error:", error)
    return Response.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
