"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Leaf,
  Camera,
  MessageCircle,
  TrendingUp,
  Award,
  Target,
  Users,
  Settings,
  LogOut,
  Bell,
  Search,
} from "lucide-react"

export default function DashboardPage() {
  const [user] = useState({
    name: "John Doe",
    email: "john@example.com",
    points: 1250,
    level: "Eco Warrior",
    streak: 7,
  })

  const [stats] = useState({
    carbonSaved: 45.2,
    itemsClassified: 128,
    weeklyGoal: 75,
    weeklyProgress: 60,
  })

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
                <Link href="/dashboard" className="text-green-600 font-medium">
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back, {user.name}! 👋</h2>
          <p className="text-gray-600 dark:text-gray-300">
            You're on a {user.streak}-day streak! Keep up the great environmental work.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Points</CardTitle>
                <Award className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{user.points}</div>
              <Badge variant="secondary" className="mt-2">
                {user.level}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Carbon Saved</CardTitle>
                <Leaf className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.carbonSaved} kg</div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Items Classified</CardTitle>
                <Camera className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.itemsClassified}</div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Weekly Goal</CardTitle>
                <Target className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.weeklyProgress}%</div>
              <Progress value={stats.weeklyProgress} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-green-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>Start tracking your environmental impact right away.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/waste-classifier">
                <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                  <Camera className="h-4 w-4 mr-2" />
                  Classify Waste Item
                </Button>
              </Link>
              <Link href="/eco-chat">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Ask EcoChat
                </Button>
              </Link>
              <Link href="/tracking">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Log Activity
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest environmental actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Classified plastic bottle</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                  <Badge variant="secondary">+10 pts</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Completed daily challenge</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                  <Badge variant="secondary">+25 pts</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Used EcoChat for recycling tips</p>
                    <p className="text-xs text-gray-500">2 days ago</p>
                  </div>
                  <Badge variant="secondary">+5 pts</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements & Community */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                Recent Achievements
              </CardTitle>
              <CardDescription>Badges you've earned for your eco-friendly actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Leaf className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-xs font-medium">Eco Starter</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Camera className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-xs font-medium">Classifier Pro</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-xs font-medium">Goal Crusher</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                Community Impact
              </CardTitle>
              <CardDescription>See how you're contributing to the global effort.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Global CO2 Saved</span>
                    <span className="text-sm text-gray-500">2.5M kg</span>
                  </div>
                  <Progress value={65} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Items Classified</span>
                    <span className="text-sm text-gray-500">500K+</span>
                  </div>
                  <Progress value={80} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Active Users</span>
                    <span className="text-sm text-gray-500">10K+</span>
                  </div>
                  <Progress value={45} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
