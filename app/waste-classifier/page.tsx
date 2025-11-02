"use client"

import type React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from '@/hooks/use-toast'
import {
    AlertCircle,
    Bell,
    Camera,
    CheckCircle,
    Leaf,
    LogOut,
    Recycle,
    Search,
    Settings,
    Trash2,
    Upload,
    X,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

interface ClassificationResult {
  category: string
  item?: string
  recyclability?: string
  is_waste?: boolean
  confidence: number
  disposal: string
  tips: string[]
  environmental_impact: string
  points_earned: number
  carbon_impact?: number
  carbon_source?: string
  low_confidence?: boolean
  advice?: string
}

interface RecentClassification {
  item_name: string
  category: string
  disposal: string
  color: string
  points_earned: number
  carbon_impact: number
  timestamp: string
}

export default function WasteClassifierPage() {
  const { user, isAuthenticated } = useAuth()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isClassifying, setIsClassifying] = useState(false)
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [error, setError] = useState("")
  const [recentClassifications, setRecentClassifications] = useState<RecentClassification[]>([])
  const [loadingRecent, setLoadingRecent] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [verifiedInfo, setVerifiedInfo] = useState<{ is_waste: boolean; confidence: number } | null>(null)

  // Backend URL from environment
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'
  
  // Local recents storage key for unauthenticated users
  const LOCAL_RECENTS_KEY = "ecotrack_recent_classifications"

  const loadLocalRecents = (): RecentClassification[] => {
    try {
      const raw = localStorage.getItem(LOCAL_RECENTS_KEY)
      if (!raw) return []
      return JSON.parse(raw) as RecentClassification[]
    } catch (e) {
      console.error("Failed to load local recents", e)
      return []
    }
  }

  const saveLocalRecent = (entry: RecentClassification) => {
    try {
      const cur = loadLocalRecents()
      cur.unshift(entry)
      const trimmed = cur.slice(0, 10)
      localStorage.setItem(LOCAL_RECENTS_KEY, JSON.stringify(trimmed))
      setRecentClassifications(trimmed)
    } catch (e) {
      console.error("Failed to save local recent", e)
    }
  }

  // Fetch recent classifications
  useEffect(() => {
    const fetchRecentClassifications = async () => {
      // Always load local recents first
      const local = loadLocalRecents()
      if (local.length) {
        setRecentClassifications(local)
      }

      if (!isAuthenticated) {
        setLoadingRecent(false)
        return
      }

      try {
        setLoadingRecent(true)
        const token = localStorage.getItem('auth_token')
        
        if (!token) return

        const response = await fetch(`${backendBase}/api/user/classifications?limit=5`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          // Merge server recents with local, preferring server entries and then filling with local
          const server: RecentClassification[] = data.classifications || []
          const merged = [...server]
          for (const l of local) {
            if (!merged.find((s) => s.item_name === l.item_name && s.timestamp === l.timestamp)) {
              merged.push(l)
            }
          }
          setRecentClassifications(merged.slice(0, 10))
        }
      } catch (err) {
        console.error('Error fetching classifications:', err)
      } finally {
        setLoadingRecent(false)
      }
    }

    fetchRecentClassifications()
  }, [isAuthenticated])

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
      setSelectedFile(file)
    }
  }

  const handleClassify = async () => {
    if (!selectedImage) return

    setIsClassifying(true)
    setError("")

    try {
      let res: Response

      // Decide which classifier to call.
      // Use mock if toggled, otherwise call FastAPI backend directly for Perplexity classification.
      const useMock = (process.env.NEXT_PUBLIC_USE_MOCK || 'false') === 'true'
      const endpoint = useMock ? `${backendBase}/api/waste-classify-mock` : `${backendBase}/api/waste-classify`

      console.log('🔍 Classification Debug:', {
        backendBase,
        endpoint,
        hasFile: !!selectedFile,
        hasImage: !!selectedImage,
        imageType: selectedFile ? 'file' : 'dataURL'
      })

      // If we have a File object, send multipart/form-data
      if (selectedFile) {
        const form = new FormData()
        form.append('file', selectedFile)
        console.log('📤 Sending FormData with file:', selectedFile.name, selectedFile.type, selectedFile.size)
        res = await fetch(endpoint, {
          method: 'POST',
          body: form,
        })
      } else {
        // Fallback: selectedImage is a data URL string
        console.log('📤 Sending JSON with data URL (length:', selectedImage.length, ')')
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: selectedImage }),
        })
      }

      console.log('📥 Response status:', res.status, res.statusText)


      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Classification API error:', err)
        const errorMsg = err.detail || err.message || `Classification failed (${res.status})`
        setError(errorMsg)
        toast({
          title: 'Classification Failed',
          description: errorMsg,
          variant: 'destructive',
        })
        return
      }

      const data = await res.json()
      if (data?.result) {
        setResult(data.result)
        setVerifiedInfo(data.verified || null)

        // Optionally save classification to backend as activity if authenticated
        if (isAuthenticated) {
          try {
            const token = localStorage.getItem('auth_token')
            if (token) {
              // Log as a tracking activity
              await fetch(`${backendBase}/api/tracking/log`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  activity_type: 'classify_waste',
                  description: `Classified: ${data.result.category || 'Unknown'}${data.result.item ? ` - ${data.result.item}` : ''}`,
                  points_earned: data.result.points_earned || 0,
                  carbon_impact: data.result.carbon_impact || 0,
                }),
              })

              // Refresh recent classifications
              const resp = await fetch(`${backendBase}/api/user/classifications?limit=5`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              })
              if (resp.ok) {
                const refreshed = await resp.json()
                setRecentClassifications(refreshed.classifications || [])
              }
            }
          } catch (err) {
            console.error('Error saving classification:', err)
          }
        }
        // Also save to local recents so unauthenticated users see history
        try {
          const now = new Date().toISOString()
          const localEntry: RecentClassification = {
            item_name: data.result.category || 'Unknown',
            category: data.result.category || 'unknown',
            disposal: data.result.disposal || 'Unknown',
            color: 'gray',
            points_earned: data.result.points_earned || 0,
            carbon_impact: 0,
            timestamp: now,
          }
          saveLocalRecent(localEntry)
        } catch (e) {
          console.error('Error saving local recent', e)
        }
      } else {
        setError('Classification returned no result')
      }
    } catch (err) {
      console.error('Classification error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Network error - cannot reach backend'
      setError(errorMsg)
      toast({
        title: 'Classification Error',
        description: errorMsg,
        variant: 'destructive',
      })
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

  const handleClearConfirmed = async () => {
    setIsClearing(true)

    // Clear local recents first
    try {
      localStorage.removeItem(LOCAL_RECENTS_KEY)
      setRecentClassifications([])
      toast({ title: 'History cleared', description: 'Local recent classifications were removed.' })
    } catch (e) {
      console.error('Failed to clear local recents', e)
      toast({ title: 'Error', description: 'Failed to clear local history', variant: 'destructive' })
    }

    // If authenticated, attempt to clear server-side recents as well
    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          const resp = await fetch('/api/user/classifications', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          })
          if (resp.ok) {
            if (resp.status === 202) {
              toast({ title: 'Server queued', description: 'Backend unavailable — clear request queued for retry.' })
            } else {
              toast({ title: 'Server history cleared', description: 'Server-side recent classifications deleted.' })
            }
          } else {
            toast({ title: 'Partial success', description: 'Local history cleared but server clear failed.', variant: 'destructive' })
          }
        }
      } catch (err) {
        console.error('Failed to clear server recents', err)
        toast({ title: 'Server error', description: 'Could not clear server-side history', variant: 'destructive' })
      }
    }

    setIsClearing(false)
    setIsClearDialogOpen(false)
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
      {isClearing && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 flex items-center gap-3 shadow-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" />
            <div className="text-sm font-medium">Clearing history…</div>
          </div>
        </div>
      )}
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
                    {/* If verifier indicates not-waste, show a helpful banner */}
                    {((verifiedInfo && verifiedInfo.is_waste === false) || result.is_waste === false || result.category === 'Not waste') && (
                      <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/20">
                        <div className="font-semibold">This image does not appear to be waste</div>
                        <div className="text-sm mt-1">Try uploading a clearer photo focused on the item, or ensure the photo shows the object you want classified (avoid people, scenery, receipts). The model confidence: {verifiedInfo?.confidence ?? 0}%.</div>
                      </div>
                    )}
                    {result.low_confidence && (
                      <div className="p-3 rounded-md bg-orange-50 border border-orange-200 text-orange-800 dark:bg-orange-900/20">
                        <div className="font-semibold">Low confidence result</div>
                        <div className="text-sm mt-1">{result.advice || 'Retake a clear, well-lit photo focusing on a single item. Avoid background clutter and reflective glare.'}</div>
                      </div>
                    )}
                    {/* Classification */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{result.category}</h3>
                          {result.item && (
                            <p className="text-sm text-gray-500">Item: {result.item}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {result.recyclability && (
                            <Badge variant="outline">{result.recyclability}</Badge>
                          )}
                          <Badge variant="secondary">{result.confidence}% confident</Badge>
                        </div>
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
                      {typeof result.carbon_impact === 'number' && (
                        <p className="text-sm text-blue-600/80 mt-2">Estimated carbon impact: {result.carbon_impact.toFixed(2)} kg CO₂e {result.carbon_source ? `(source: ${result.carbon_source})` : ''}</p>
                      )}
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Classifications</CardTitle>
                    <CardDescription>Your latest waste classification history.</CardDescription>
                  </div>
                  <div>
                    <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">Clear history</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Clear recent classifications</DialogTitle>
                          <DialogDescription>This will remove local recent classifications and attempt to clear server history. This action cannot be undone.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="ghost" onClick={() => setIsClearDialogOpen(false)} disabled={isClearing}>Cancel</Button>
                          <Button variant="destructive" onClick={handleClearConfirmed} className="ml-2" disabled={isClearing}>
                            {isClearing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Clearing...
                              </>
                            ) : (
                              'Confirm'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
            </CardHeader>
            <CardContent>
              {loadingRecent ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">Loading classifications...</p>
                </div>
              ) : recentClassifications.length > 0 ? (
                <div className="space-y-4">
                  {recentClassifications.map((classification, index) => {
                    // Determine icon and background color
                    const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
                      'green': { bg: 'bg-green-100 dark:bg-green-900', icon: 'text-green-600', text: 'text-green-700' },
                      'blue': { bg: 'bg-blue-100 dark:bg-blue-900', icon: 'text-blue-600', text: 'text-blue-700' },
                      'red': { bg: 'bg-red-100 dark:bg-red-900', icon: 'text-red-600', text: 'text-red-700' },
                      'yellow': { bg: 'bg-yellow-100 dark:bg-yellow-900', icon: 'text-yellow-600', text: 'text-yellow-700' },
                      'purple': { bg: 'bg-purple-100 dark:bg-purple-900', icon: 'text-purple-600', text: 'text-purple-700' },
                      'gray': { bg: 'bg-gray-100 dark:bg-gray-900', icon: 'text-gray-600', text: 'text-gray-700' }
                    }
                    const colors = colorMap[classification.color] || colorMap['gray']
                    const IconComponent = classification.disposal === 'Compostable' ? Trash2 : Recycle

                    // Format timestamp
                    const timeAgo = new Date(classification.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric'
                    })

                    return (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                            <IconComponent className={`h-6 w-6 ${colors.icon}`} />
                          </div>
                          <div>
                            <p className="font-medium">{classification.item_name}</p>
                            <p className="text-sm text-gray-500">{timeAgo}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">{classification.disposal}</Badge>
                          <p className="text-sm text-gray-500 mt-1">+{classification.points_earned} points</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No classifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">Upload an image to start classifying waste!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
