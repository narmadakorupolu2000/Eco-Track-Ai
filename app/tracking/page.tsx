"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Leaf,
  TrendingUp,
  Car,
  Zap,
  Home,
  Utensils,
  Plus,
  Calendar,
  Target,
  Settings,
  LogOut,
  Bell,
  Search,
} from "lucide-react"

export default function TrackingPage() {
  const [carbonData] = useState({
    totalFootprint: 2.4,
    monthlyGoal: 3.0,
    weeklyFootprint: 0.6,
    categories: {
      transportation: 1.2,
      energy: 0.8,
      food: 0.3,
      waste: 0.1,
    },
  })

  const [activities] = useState([
    { id: 1, type: "transportation", activity: "Bike to work", impact: -0.5, date: "2024-01-15", points: 20 },
    { id: 2, type: "energy", activity: "Used LED bulbs", impact: -0.2, date: "2024-01-14", points: 15 },
    { id: 3, type: "food", activity: "Plant-based meal", impact: -0.3, date: "2024-01-14", points: 10 },
    { id: 4, type: "waste", activity: "Recycled plastic", impact: -0.1, date: "2024-01-13", points: 5 },
  ])

  const [newActivity, setNewActivity] = useState({
    type: "",
    activity: "",
    impact: "",
  })

  const handleAddActivity = () => {
    // TODO: Implement activity logging
    console.log("Adding activity:", newActivity)
    setNewActivity({ type: "", activity: "", impact: "" })
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
                <div className="text-2xl font-bold text-green-600">{carbonData.totalFootprint} tons</div>
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
                <div className="text-2xl font-bold text-blue-600">{carbonData.categories.transportation} tons</div>
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
                <div className="text-2xl font-bold text-yellow-600">{carbonData.categories.energy} tons</div>
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
                  {carbonData.categories.food + carbonData.categories.waste} tons
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
                      Log New Activity
                    </CardTitle>
                    <CardDescription>Track your daily environmental activities and their impact.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newActivity.type}
                        onValueChange={(value) => setNewActivity({ ...newActivity, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transportation">Transportation</SelectItem>
                          <SelectItem value="energy">Energy</SelectItem>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="waste">Waste</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="activity">Activity</Label>
                      <Input
                        id="activity"
                        placeholder="e.g., Biked to work, Used renewable energy"
                        value={newActivity.activity}
                        onChange={(e) => setNewActivity({ ...newActivity, activity: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="impact">Carbon Impact (kg CO2)</Label>
                      <Input
                        id="impact"
                        type="number"
                        placeholder="e.g., -2.5 (negative for reduction)"
                        value={newActivity.impact}
                        onChange={(e) => setNewActivity({ ...newActivity, impact: e.target.value })}
                      />
                    </div>

                    <Button onClick={handleAddActivity} className="w-full bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Log Activity
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common activities for quick logging.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Car className="h-4 w-4 mr-3 text-blue-600" />
                      Biked instead of driving
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Zap className="h-4 w-4 mr-3 text-yellow-600" />
                      Used renewable energy
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Utensils className="h-4 w-4 mr-3 text-green-600" />
                      Ate plant-based meal
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Leaf className="h-4 w-4 mr-3 text-purple-600" />
                      Recycled waste items
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Home className="h-4 w-4 mr-3 text-teal-600" />
                      Reduced home energy use
                    </Button>
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
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Monthly Carbon Reduction</span>
                        <span className="text-sm text-gray-500">80% complete</span>
                      </div>
                      <Progress value={80} />
                      <p className="text-xs text-gray-500 mt-1">Target: Reduce by 20% from last month</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Weekly Eco Activities</span>
                        <span className="text-sm text-gray-500">60% complete</span>
                      </div>
                      <Progress value={60} />
                      <p className="text-xs text-gray-500 mt-1">Target: Log 10 activities this week</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Transportation Goal</span>
                        <span className="text-sm text-gray-500">90% complete</span>
                      </div>
                      <Progress value={90} />
                      <p className="text-xs text-gray-500 mt-1">Target: Use sustainable transport 5 days/week</p>
                    </div>
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
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select goal type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="carbon">Carbon Reduction</SelectItem>
                          <SelectItem value="activities">Activity Count</SelectItem>
                          <SelectItem value="category">Category Focus</SelectItem>
                          <SelectItem value="streak">Streak Goal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="goalTarget">Target</Label>
                      <Input id="goalTarget" placeholder="e.g., Reduce carbon by 25%" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="goalDeadline">Deadline</Label>
                      <Input id="goalDeadline" type="date" />
                    </div>

                    <Button className="w-full bg-green-600 hover:bg-green-700">
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">Transportation</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <Progress value={50} />
                          </div>
                          <span className="text-sm font-medium">50%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm">Energy</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <Progress value={33} />
                          </div>
                          <span className="text-sm font-medium">33%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Utensils className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Food</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <Progress value={13} />
                          </div>
                          <span className="text-sm font-medium">13%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Leaf className="h-4 w-4 text-purple-600" />
                          <span className="text-sm">Waste</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <Progress value={4} />
                          </div>
                          <span className="text-sm font-medium">4%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                    <CardDescription>AI-powered suggestions to reduce your carbon footprint.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Car className="h-4 w-4 text-blue-600" />
                          <h4 className="font-semibold text-blue-800 dark:text-blue-400">Transportation</h4>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Consider using public transport or biking 2 more days per week to reduce your footprint by
                          15%.
                        </p>
                      </div>

                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-yellow-600" />
                          <h4 className="font-semibold text-yellow-800 dark:text-yellow-400">Energy</h4>
                        </div>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Switch to LED bulbs and unplug devices when not in use to save 0.3 tons CO2 monthly.
                        </p>
                      </div>

                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Utensils className="h-4 w-4 text-green-600" />
                          <h4 className="font-semibold text-green-800 dark:text-green-400">Food</h4>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Try having 2 plant-based meals per week to reduce your food-related emissions by 20%.
                        </p>
                      </div>
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
