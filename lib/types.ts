export type ClassificationResult = {
  category: string
  confidence: number
  disposal: string
  tips: string[]
  environmental_impact: string
  points_earned: number
}

export type ApiResponse<T> = {
  result?: T
  error?: string
  raw?: string
}
