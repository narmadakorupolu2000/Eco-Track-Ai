"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
    Bell,
    Calendar,
    Car,
    Leaf,
    LogOut,
    Plus,
    Recycle,
    Search,
    Settings,
    Target,
    TrendingUp,
    Utensils,
    Zap
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"


// Activity type mapping for smart calculation
const ACTIVITY_TYPES = {
  transportation: {
    label: "Transportation",
    icon: <Car className="h-4 w-4" />,
    color: "text-blue-600",
    subTypes: [
      { value: "car_petrol", label: "Petrol Car", unit: "km" },
      { value: "car_diesel", label: "Diesel Car", unit: "km" },
      { value: "car_electric", label: "Electric Car", unit: "km" },
      { value: "bus", label: "Public Bus", unit: "km" },
      { value: "train", label: "Train/Metro", unit: "km" },
      { value: "bicycle", label: "Bicycle", unit: "km" },
      { value: "walk", label: "Walking", unit: "km" },
      { value: "flight_short", label: "Flight (< 3hr)", unit: "km" },
      { value: "flight_long", label: "Flight (> 3hr)", unit: "km" },
    ],
  },
  energy: {
    label: "Energy",
    icon: <Zap className="h-4 w-4" />,
    color: "text-yellow-600",
    subTypes: [
      { value: "electricity_grid", label: "Grid Electricity", unit: "kWh" },
      { value: "electricity_renewable", label: "Renewable Energy", unit: "kWh" },
      { value: "gas_heating", label: "Natural Gas", unit: "kWh" },
    ],
  },
  food: {
    label: "Food",
    icon: <Utensils className="h-4 w-4" />,
    color: "text-green-600",
    subTypes: [
      { value: "beef", label: "Beef", unit: "kg" },
      { value: "lamb", label: "Lamb", unit: "kg" },
      { value: "pork", label: "Pork", unit: "kg" },
      { value: "chicken", label: "Chicken", unit: "kg" },
      { value: "fish", label: "Fish", unit: "kg" },
      { value: "vegetables", label: "Vegetables", unit: "kg" },
      { value: "fruits", label: "Fruits", unit: "kg" },
      { value: "grains", label: "Grains", unit: "kg" },
    ],
  },
  waste: {
    label: "Waste",
    icon: <Recycle className="h-4 w-4" />,
    color: "text-purple-600",
    subTypes: [
      { value: "general_waste", label: "Landfill (General)", unit: "kg" },
      { value: "recycled", label: "Recycled", unit: "kg" },
      { value: "composted", label: "Composted", unit: "kg" },
      { value: "e_waste", label: "E-Waste", unit: "kg" },
    ],
  },
}

export default function TrackingPage() {
  const { toast } = useToast()
  const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

  // State management
  const [carbonData, setCarbonData] = useState({
    totalFootprint: 0,
    monthlyGoal: 3.0,
    categories: {
      transportation: 0,
      energy: 0,
      food: 0,
      waste: 0,
    },
    foodWaste: 0,
    trends: [] as { month: string; carbon_kg: number }[],
  })

  const [userStats, setUserStats] = useState({
    total_points: 0,
    carbon_saved: 0,
    streak_days: 0,
    weekly_progress: 0,
    level: "Eco Beginner",
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activities, setActivities] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])

  // New activity form state (smart mode)
  const [newActivity, setNewActivity] = useState({
    activityType: "",
    subType: "",
    amount: "",
    description: "",
  })

  // Goal setting state
  const [newGoal, setNewGoal] = useState({
    goalType: "weekly",
    target: "",
  })
  // Fetch all tracking data from backend
  useEffect(() => {
    let mounted = true
    const fetchAllData = async () => {
      setLoading(true)
      setError("")
      try {
        const token = localStorage.getItem("auth_token")
        if (!token) {
          setError("Not authenticated. Please log in to view your tracking data.")
          setLoading(false)
          return
        }

        const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

        const [
          monthlyRes,
          transportRes,
          energyRes,
          foodRes,
          trendsRes,
          historyRes,
          insightsRes,
          achievementsRes,
          goalsRes,
          dashboardRes,
        ] = await Promise.all([
          fetch(`${apiBase}/api/carbon/monthly`, { headers }),
          fetch(`${apiBase}/api/carbon/transportation`, { headers }),
          fetch(`${apiBase}/api/carbon/energy`, { headers }),
          fetch(`${apiBase}/api/carbon/food-waste`, { headers }),
          fetch(`${apiBase}/api/carbon/trends`, { headers }),
          fetch(`${apiBase}/api/tracking/history?limit=20`, { headers }),
          fetch(`${apiBase}/api/user/insights`, { headers }),
          fetch(`${apiBase}/api/user/achievements`, { headers }),
          fetch(`${apiBase}/api/user/goals`, { headers }),
          fetch(`${apiBase}/api/user/dashboard`, { headers }),
        ])

        // Check for auth errors (401)
        if (monthlyRes.status === 401 || historyRes.status === 401) {
          setError("Session expired. Please log in again.")
          localStorage.removeItem("auth_token")
          setLoading(false)
          return
        }

        // Parse JSON
        const monthly = await monthlyRes.json().catch(() => ({}))
        const transportation = await transportRes.json().catch(() => ({}))
        const energy = await energyRes.json().catch(() => ({}))
        const foodWaste = await foodRes.json().catch(() => ({}))
        const trends = await trendsRes.json().catch(() => ({ trends: [] }))
        const history = await historyRes.json().catch(() => ({ activities: [] }))
        const insightsData = await insightsRes.json().catch(() => ({ insights: [] }))
        const achievementsData = await achievementsRes.json().catch(() => ({ achievements: [] }))
        const goalsData = await goalsRes.json().catch(() => ({ goals: [] }))
        const dashboard = await dashboardRes.json().catch(() => ({}))

        // Debug logging
        console.log('📊 Insights fetched:', insightsData)
        console.log('🏆 Achievements fetched:', achievementsData)
        console.log('🎯 Goals fetched:', goalsData)

        if (mounted) {
          setCarbonData({
            totalFootprint: (monthly.monthly_carbon_kg || 0) / 1000,
            monthlyGoal: 3.0,
            categories: {
              transportation: (transportation.transportation_carbon_kg || 0) / 1000,
              energy: (energy.energy_carbon_kg || 0) / 1000,
              food: (foodWaste.food_waste_carbon_kg || 0) / 2000,
              waste: (foodWaste.food_waste_carbon_kg || 0) / 2000,
            },
            foodWaste: (foodWaste.food_waste_carbon_kg || 0) / 1000,
            trends: Array.isArray(trends.trends) ? trends.trends : [],
          })

          // Map history activities
          const mapped = Array.isArray(history.activities)
            ? history.activities.map((a: any, i: number) => ({
                id: a._id || a.timestamp || `act_${i}`,
                type: a.activity_type || "activity",
                activity: a.description || "",
                date: a.timestamp ? new Date(a.timestamp).toLocaleString() : "",
                impact: a.carbon_impact ?? 0,
                points: a.points_earned ?? 0,
                amount: a.amount,
                unit: a.unit,
                subType: a.sub_type,
              }))
            : []

          setActivities(mapped)
          setInsights(insightsData.insights || [])
          setAchievements(achievementsData.achievements || [])
          setGoals(goalsData.goals || [])

          // User stats from dashboard
          if (dashboard) {
            setUserStats({
              total_points: dashboard.total_points || 0,
              carbon_saved: dashboard.carbon_saved || 0,
              streak_days: dashboard.streak_days || 0,
              weekly_progress: dashboard.weekly_progress || 0,
              level: dashboard.level || "Eco Beginner",
            })
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load carbon data")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchAllData()

    const onRefresh = () => {
      fetchAllData()
    }

    window.addEventListener("refreshCarbon", onRefresh)

    return () => {
      mounted = false
      window.removeEventListener("refreshCarbon", onRefresh)
    }
  }, [apiBase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-600 dark:text-gray-300">Loading carbon data...</span>
      </div>
    )
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-red-600 dark:text-red-400">{error}</span>
      </div>
    )
  }

  // Smart activity logging
  const handleAddActivity = async () => {
    setError("")

    if (!newActivity.activityType || !newActivity.subType || !newActivity.amount) {
      toast({
        title: "Missing Information",
        description: "Please select activity type, sub-type, and enter amount.",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) throw new Error("Not authenticated")

      const selectedType = ACTIVITY_TYPES[newActivity.activityType as keyof typeof ACTIVITY_TYPES]
      const selectedSubType = selectedType.subTypes.find((s) => s.value === newActivity.subType)

      const payload = {
        activity_type: newActivity.activityType,
        sub_type: newActivity.subType,
        amount: parseFloat(newActivity.amount),
        unit: selectedSubType?.unit || "kg",
        description: newActivity.description || `${selectedSubType?.label} (${newActivity.amount} ${selectedSubType?.unit})`,
        is_positive: ["bicycle", "walk", "electricity_renewable", "recycled", "composted"].includes(newActivity.subType),
      }

      const res = await fetch(`${apiBase}/api/tracking/log`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || "Failed to log activity")
      }

      const data = await res.json()

      // Show success toast
      toast({
        title: "Activity Logged!",
        description: `Earned ${data.activity.points_earned} points! Carbon impact: ${Math.abs(data.activity.carbon_impact).toFixed(2)} kg CO₂e`,
      })

      // Show achievement unlocks
      if (data.unlocked_achievements && data.unlocked_achievements.length > 0) {
        data.unlocked_achievements.forEach((ach: any) => {
          toast({
            title: `🎉 Achievement Unlocked!`,
            description: `${ach.icon} ${ach.name} - ${ach.description} (+${ach.points} pts)`,
          })
        })
      }

      // Reset form
      setNewActivity({ activityType: "", subType: "", amount: "", description: "" })

      // Refresh data
      const evt = new Event("refreshCarbon")
      window.dispatchEvent(evt)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to log activity",
        variant: "destructive",
      })
    }
  }

  // Set a new goal
  const handleSetGoal = async () => {
    if (!newGoal.target) {
      toast({
        title: "Missing Information",
        description: "Please enter a target carbon reduction goal.",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) throw new Error("Not authenticated")

      const payload = {
        goal_type: newGoal.goalType,
        target_carbon_kg: parseFloat(newGoal.target),
      }

      const res = await fetch(`${apiBase}/api/user/goals`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || "Failed to set goal")
      }

      toast({
        title: "Goal Set!",
        description: `${newGoal.goalType === "weekly" ? "Weekly" : "Monthly"} goal of ${newGoal.target} kg CO₂e reduction created.`,
      })

      // Reset form
      setNewGoal({ goalType: "weekly", target: "" })

      // Refresh data
      const evt = new Event("refreshCarbon")
      window.dispatchEvent(evt)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to set goal",
        variant: "destructive",
      })
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "transportation":
        return <Car className="h-4 w-4" />
      case "energy":
        return <Zap className="h-4 w-4" />
      case "food":
        return <Utensils className="h-4 w-4" />
      case "waste":
        return <Leaf className="h-4 w-4" />
      default:
        return <TrendingUp className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "transportation":
        return "text-blue-600"
      case "energy":
        return "text-yellow-600"
      case "food":
        return "text-green-600"
      case "waste":
        return "text-purple-600"
      default:
        return "text-gray-600"
    }
  }
  // ...existing code...
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
                <Link
                  href="/eco-chat"
                  className="text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
                >
                  EcoChat
                </Link>
                <Link href="/tracking" className="text-green-600 font-medium">
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Carbon Footprint Tracking</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Monitor your environmental impact and track progress toward your sustainability goals.
            </p>
          </div>

          {/* Overview Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Monthly Footprint
                  </CardTitle>
                  <Leaf className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{carbonData.totalFootprint.toFixed(2)} tons</div>
                <Progress value={(carbonData.totalFootprint / carbonData.monthlyGoal) * 100} className="mt-2" />
                <p className="text-xs text-gray-500 mt-1">Goal: {carbonData.monthlyGoal} tons</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Transportation</CardTitle>
                  <Car className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{carbonData.categories.transportation.toFixed(2)} tons</div>
                <p className="text-xs text-green-600 mt-1">-15% from last month</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Energy</CardTitle>
                  <Zap className="h-4 w-4 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{carbonData.categories.energy.toFixed(2)} tons</div>
                <p className="text-xs text-green-600 mt-1">-8% from last month</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Food & Waste</CardTitle>
                  <Utensils className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {(carbonData.categories.food + carbonData.categories.waste).toFixed(2)} tons
                </div>
          {/* Trends Chart (optional, simple list for now) */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Carbon Trends (last 6 months)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {carbonData.trends.length === 0 ? (
                    <span className="text-gray-500">No trend data available.</span>
                  ) : (
                    carbonData.trends.map((t, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{t.month}</span>
                        <span>{(t.carbon_kg / 1000).toFixed(2)} tons</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
                <p className="text-xs text-green-600 mt-1">-12% from last month</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="log" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="log">Log Activity</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            {/* Log Activity Tab */}
            <TabsContent value="log">
              <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-green-600" />
                      Log New Activity (Smart Mode)
                    </CardTitle>
                    <CardDescription>Automatic carbon calculation based on activity type and amount.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newActivity.activityType}
                        onValueChange={(value) => setNewActivity({ ...newActivity, activityType: value, subType: "" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ACTIVITY_TYPES).map(([key, val]) => (
                            <SelectItem key={key} value={key}>
                              {val.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {newActivity.activityType && (
                      <div className="space-y-2">
                        <Label htmlFor="subType">Activity Type</Label>
                        <Select
                          value={newActivity.subType}
                          onValueChange={(value) => setNewActivity({ ...newActivity, subType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select activity" />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTIVITY_TYPES[newActivity.activityType as keyof typeof ACTIVITY_TYPES]?.subTypes.map((sub) => (
                              <SelectItem key={sub.value} value={sub.value}>
                                {sub.label} ({sub.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {newActivity.subType && (
                      <div className="space-y-2">
                        <Label htmlFor="amount">
                          Amount ({ACTIVITY_TYPES[newActivity.activityType as keyof typeof ACTIVITY_TYPES]?.subTypes.find(s => s.value === newActivity.subType)?.unit})
                        </Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.1"
                          placeholder="e.g., 10"
                          value={newActivity.amount}
                          onChange={(e) => setNewActivity({ ...newActivity, amount: e.target.value })}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Input
                        id="description"
                        placeholder="e.g., Biked to work"
                        value={newActivity.description}
                        onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                      />
                    </div>

                    <Button 
                      onClick={handleAddActivity} 
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={!newActivity.activityType || !newActivity.subType || !newActivity.amount}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Log Activity
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>📊 Your Stats</CardTitle>
                    <CardDescription>Track your environmental impact and progress.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">🏆 Total Points</span>
                        <span className="text-2xl font-bold text-green-600">{userStats.total_points}</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Level: {userStats.level}</div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">💚 Carbon Saved</span>
                        <span className="text-2xl font-bold text-blue-600">{userStats.carbon_saved.toFixed(2)} kg</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        That's like planting {(userStats.carbon_saved / 20).toFixed(1)} trees! 🌳
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">🔥 Streak Days</span>
                        <span className="text-2xl font-bold text-orange-600">{userStats.streak_days}</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Keep logging daily to maintain your streak!
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">📈 Weekly Progress</span>
                        <span className="text-2xl font-bold text-purple-600">{userStats.weekly_progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={userStats.weekly_progress} className="mt-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Activity History
                  </CardTitle>
                  <CardDescription>Your recent environmental activities and their impact.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${getCategoryColor(activity.type)}`}
                          >
                            {getCategoryIcon(activity.type)}
                          </div>
                          <div>
                            <p className="font-medium">{activity.activity}</p>
                            <p className="text-sm text-gray-500">{activity.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Badge variant={activity.impact < 0 ? "default" : "destructive"}>
                              {activity.impact > 0 ? "+" : ""}
                              {activity.impact} kg CO2
                            </Badge>
                            <Badge variant="secondary">+{activity.points} pts</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Goals Tab */}
            <TabsContent value="goals">
              <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-600" />
                      Current Goals
                    </CardTitle>
                    <CardDescription>Track your progress toward sustainability targets.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {goals.length === 0 ? (
                      <p className="text-gray-500 text-sm py-8 text-center">
                        No active goals. Create your first goal to get started!
                      </p>
                    ) : (
                      goals.map((goal: any) => (
                        <div key={goal._id}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium capitalize">
                              {goal.goal_type} Carbon Reduction
                            </span>
                            <span className="text-sm text-gray-500">
                              {goal.progress_percent}% complete
                            </span>
                          </div>
                          <Progress value={goal.progress_percent} />
                          <p className="text-xs text-gray-500 mt-1">
                            Target: {goal.target_carbon_kg} kg CO₂e | Saved: {goal.current_carbon_saved} kg | Remaining: {goal.remaining_carbon_kg} kg
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Set New Goal</CardTitle>
                    <CardDescription>Create a new sustainability goal to work toward.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="goalType">Goal Type</Label>
                      <Select
                        value={newGoal.goalType}
                        onValueChange={(value) => setNewGoal({ ...newGoal, goalType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select goal type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly Goal</SelectItem>
                          <SelectItem value="monthly">Monthly Goal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="goalTarget">Target Carbon Reduction (kg CO₂e)</Label>
                      <Input 
                        id="goalTarget" 
                        type="number"
                        step="0.1"
                        placeholder="e.g., 5.0" 
                        value={newGoal.target}
                        onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                      />
                      <p className="text-xs text-gray-500">How many kg of CO₂e do you want to save?</p>
                    </div>

                    <Button 
                      onClick={handleSetGoal}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Create Goal
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights">
              <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Carbon Footprint Breakdown
                    </CardTitle>
                    <CardDescription>Analyze your environmental impact by category.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(() => {
                        const total = carbonData.categories.transportation + carbonData.categories.energy + 
                                     carbonData.categories.food + carbonData.categories.waste
                        const transportPct = total > 0 ? (carbonData.categories.transportation / total) * 100 : 0
                        const energyPct = total > 0 ? (carbonData.categories.energy / total) * 100 : 0
                        const foodPct = total > 0 ? (carbonData.categories.food / total) * 100 : 0
                        const wastePct = total > 0 ? (carbonData.categories.waste / total) * 100 : 0
                        
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-blue-600" />
                                <span className="text-sm">Transportation</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-24">
                                  <Progress value={transportPct} />
                                </div>
                                <span className="text-sm font-medium">{transportPct.toFixed(0)}%</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm">Energy</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-24">
                                  <Progress value={energyPct} />
                                </div>
                                <span className="text-sm font-medium">{energyPct.toFixed(0)}%</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Utensils className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Food</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-24">
                                  <Progress value={foodPct} />
                                </div>
                                <span className="text-sm font-medium">{foodPct.toFixed(0)}%</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Leaf className="h-4 w-4 text-purple-600" />
                                <span className="text-sm">Waste</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-24">
                                  <Progress value={wastePct} />
                                </div>
                                <span className="text-sm font-medium">{wastePct.toFixed(0)}%</span>
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Personalized Insights</CardTitle>
                    <CardDescription>AI-powered suggestions to reduce your carbon footprint.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {insights.length === 0 ? (
                        <p className="text-gray-500 text-sm py-8 text-center">
                          Start logging activities to get personalized insights!
                        </p>
                      ) : (
                        insights.map((insight: any, idx: number) => {
                          const bgColors = {
                            success: "bg-green-50 dark:bg-green-900/20",
                            tip: "bg-blue-50 dark:bg-blue-900/20",
                            info: "bg-yellow-50 dark:bg-yellow-900/20",
                          }
                          const textColors = {
                            success: "text-green-700 dark:text-green-300",
                            tip: "text-blue-700 dark:text-blue-300",
                            info: "text-yellow-700 dark:text-yellow-300",
                          }
                          const titleColors = {
                            success: "text-green-800 dark:text-green-400",
                            tip: "text-blue-800 dark:text-blue-400",
                            info: "text-yellow-800 dark:text-yellow-400",
                          }

                          return (
                            <div 
                              key={idx} 
                              className={`p-4 rounded-lg ${bgColors[insight.type as keyof typeof bgColors] || bgColors.info}`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{insight.icon}</span>
                                <h4 className={`font-semibold ${titleColors[insight.type as keyof typeof titleColors] || titleColors.info}`}>
                                  {insight.title}
                                </h4>
                              </div>
                              <p className={`text-sm ${textColors[insight.type as keyof typeof textColors] || textColors.info}`}>
                                {insight.message}
                              </p>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
