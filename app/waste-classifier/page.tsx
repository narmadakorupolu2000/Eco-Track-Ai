"use client"

import type React from "react"

import { useState, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Leaf,
  Camera,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Recycle,
  Trash2,
  Settings,
  LogOut,
  Bell,
  Search,
} from "lucide-react"

interface ClassificationResult {
  category: string
  confidence: number
  disposal: string
  tips: string[]
  environmental_impact: string
  points_earned: number
}

export default function WasteClassifierPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isClassifying, setIsClassifying] = useState(false)
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setError("")
        setResult(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClassify = async () => {
    if (!selectedImage) return

    setIsClassifying(true)
    setError("")

    try {
      // Simulate AI classification - in real app, this would call the AI API
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock classification result
      const mockResult: ClassificationResult = {
        category: "Plastic Bottle (PET #1)",
        confidence: 94.5,
        disposal: "Recyclable - Place in recycling bin",
        tips: [
          "Remove cap and label if possible",
          "Rinse out any remaining liquid",
          "Crush to save space in recycling bin",
          "Check local recycling guidelines for PET plastics",
        ],
        environmental_impact: "Recycling this bottle saves 0.2kg of CO2 emissions",
        points_earned: 15,
      }

      setResult(mockResult)
    } catch (err) {
      setError("Classification failed. Please try again.")
    } finally {
      setIsClassifying(false)
    }
  }

  const handleReset = () => {
    setSelectedImage(null)
    setResult(null)
    setError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

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
                <Link href="/waste-classifier" className="text-green-600 font-medium">
                  Classify Waste
                </Link>
                <Link
                  href="/eco-chat"
                  className="text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
                >
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
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">AI Waste Classifier</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Upload a photo of any waste item and get instant AI-powered classification with disposal recommendations.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-green-600" />
                  Upload Waste Item
                </CardTitle>
                <CardDescription>Take a photo or upload an image of the item you want to classify.</CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedImage ? (
                  <div className="space-y-4">
                    <div
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-green-400 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">PNG, JPG, JPEG up to 5MB</p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                      <Button variant="outline" className="flex-1 bg-transparent">
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={selectedImage || "/placeholder.svg"}
                        alt="Selected waste item"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={handleReset}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleClassify}
                      disabled={isClassifying}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isClassifying ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Classifying...
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mr-2" />
                          Classify Item
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results Section */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  Classification Results
                </CardTitle>
                <CardDescription>AI-powered analysis and disposal recommendations.</CardDescription>
              </CardHeader>
              <CardContent>
                {!result ? (
                  <div className="text-center py-12">
                    <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Upload an image to see classification results</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Classification */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{result.category}</h3>
                        <Badge variant="secondary">{result.confidence}% confident</Badge>
                      </div>
                      <Progress value={result.confidence} className="mb-4" />
                    </div>

                    {/* Disposal Instructions */}
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Recycle className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-green-800 dark:text-green-400">Disposal Method</h4>
                      </div>
                      <p className="text-green-700 dark:text-green-300">{result.disposal}</p>
                    </div>

                    {/* Tips */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Disposal Tips
                      </h4>
                      <ul className="space-y-2">
                        {result.tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Environmental Impact */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Leaf className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-800 dark:text-blue-400">Environmental Impact</h4>
                      </div>
                      <p className="text-blue-700 dark:text-blue-300">{result.environmental_impact}</p>
                    </div>

                    {/* Points Earned */}
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600 mb-1">+{result.points_earned} Points</div>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">Great job classifying this item!</p>
                    </div>

                    <Button onClick={handleReset} variant="outline" className="w-full bg-transparent">
                      Classify Another Item
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Classifications */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Classifications</CardTitle>
              <CardDescription>Your latest waste classification history.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <Recycle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Aluminum Can</p>
                      <p className="text-sm text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">Recyclable</Badge>
                    <p className="text-sm text-gray-500 mt-1">+20 points</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                      <Trash2 className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">Food Waste</p>
                      <p className="text-sm text-gray-500">1 day ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">Compostable</Badge>
                    <p className="text-sm text-gray-500 mt-1">+10 points</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Recycle className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Glass Bottle</p>
                      <p className="text-sm text-gray-500">2 days ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">Recyclable</Badge>
                    <p className="text-sm text-gray-500 mt-1">+15 points</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
