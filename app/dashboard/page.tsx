"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/AuthContext"
import {
    Award,
    Bell,
    Camera,
    Leaf,
    LogOut,
    MessageCircle,
    Search,
    Settings,
    Target,
    TrendingUp,
    Users,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const { user, logout, isAuthenticated, isLoading } = useAuth()
  
  // State for dashboard data
  const [stats, setStats] = useState({
    carbonSaved: 0,
    itemsClassified: 0,
    weeklyGoal: 100,
    weeklyProgress: 0,
    points: 0,
    level: "Eco Beginner",
    streak: 0,
  })
  const [activities, setActivities] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [communityStats, setCommunityStats] = useState({
    totalCarbonSaved: 0,
    totalItemsClassified: 0,
    activeUsers: 0,
    totalUsers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated || !user) return
      
      try {
        setLoading(true)
        const token = localStorage.getItem('auth_token')
        
        if (!token) {
          console.error('No auth token found')
          return
        }

        const response = await fetch('https://eco-track-ai.onrender.com/api/user/dashboard', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const data = await response.json()
        
        // Update stats from backend
        setStats({
          carbonSaved: data.stats.carbon_saved || 0,
          itemsClassified: data.stats.items_classified || 0,
          weeklyGoal: data.stats.weekly_goal || 100,
          weeklyProgress: data.stats.weekly_progress || 0,
          points: data.stats.total_points || 0,
          level: data.stats.level || "Eco Beginner",
          streak: data.stats.streak_days || 0,
        })

        // Update activities
        setActivities(data.recent_activities || [])
        
        // Update achievements
        setAchievements(data.achievements || [])
        
        // Update community stats
        setCommunityStats({
          totalCarbonSaved: data.community_stats.total_carbon_saved || 0,
          totalItemsClassified: data.community_stats.total_items_classified || 0,
          activeUsers: data.community_stats.active_users || 0,
          totalUsers: data.community_stats.total_users || 0,
        })
        
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err)
        setError(err.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    if (!isLoading && isAuthenticated) {
      fetchDashboardData()
    }
  }, [isAuthenticated, isLoading, user])
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login'
    }
  }, [isAuthenticated, isLoading])

  const handleLogout = () => {
    logout()
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <Leaf className="h-12 w-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null
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
              
              {/* User Profile Info */}
              <div className="hidden md:flex items-center gap-3 px-3 py-2 border rounded-lg bg-white/50 dark:bg-gray-800/50">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                </div>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
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
            You're on a {stats.streak}-day streak! Keep up the great environmental work.
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
              <div className="text-2xl font-bold text-green-600">{stats.points}</div>
              <Badge variant="secondary" className="mt-2">
                {stats.level}
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
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Loading activities...</p>
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.slice(0, 3).map((activity, index) => {
                    const colors = ['green', 'blue', 'purple', 'orange']
                    const color = colors[index % colors.length]
                    const timeAgo = new Date(activity.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric'
                    })
                    
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div className={`w-2 h-2 bg-${color}-500 rounded-full`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-gray-500">{timeAgo}</p>
                        </div>
                        <Badge variant="secondary">+{activity.points_earned} pts</Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No activities yet</p>
                  <p className="text-xs text-gray-400 mt-1">Start by classifying waste items!</p>
                </div>
              )}
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
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Loading achievements...</p>
                </div>
              ) : achievements.filter(a => a.unlocked).length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {achievements.filter(a => a.unlocked).slice(0, 3).map((achievement, index) => {
                    const iconMap: Record<string, any> = {
                      'Leaf': Leaf,
                      'Camera': Camera,
                      'Target': Target,
                      'Award': Award,
                      'TrendingUp': TrendingUp
                    }
                    const IconComponent = iconMap[achievement.icon] || Award
                    const colorMap: Record<string, string> = {
                      'green': 'bg-green-100 dark:bg-green-900 text-green-600',
                      'blue': 'bg-blue-100 dark:bg-blue-900 text-blue-600',
                      'purple': 'bg-purple-100 dark:bg-purple-900 text-purple-600',
                      'yellow': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600',
                      'orange': 'bg-orange-100 dark:bg-orange-900 text-orange-600',
                      'red': 'bg-red-100 dark:bg-red-900 text-red-600'
                    }
                    const colorClass = colorMap[achievement.color] || 'bg-gray-100 dark:bg-gray-900 text-gray-600'
                    
                    return (
                      <div key={index} className="text-center">
                        <div className={`w-12 h-12 ${colorClass} rounded-full flex items-center justify-center mx-auto mb-2`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <p className="text-xs font-medium">{achievement.name}</p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No achievements yet</p>
                  <p className="text-xs text-gray-400 mt-1">Start classifying waste to unlock badges!</p>
                </div>
              )}
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
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Loading community stats...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Global CO2 Saved</span>
                      <span className="text-sm text-gray-500">
                        {communityStats.totalCarbonSaved >= 1000 
                          ? `${(communityStats.totalCarbonSaved / 1000).toFixed(1)}M kg`
                          : `${communityStats.totalCarbonSaved.toFixed(1)} kg`}
                      </span>
                    </div>
                    <Progress value={Math.min((communityStats.totalCarbonSaved / 10000) * 100, 100)} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Items Classified</span>
                      <span className="text-sm text-gray-500">
                        {communityStats.totalItemsClassified >= 1000
                          ? `${(communityStats.totalItemsClassified / 1000).toFixed(0)}K+`
                          : communityStats.totalItemsClassified}
                      </span>
                    </div>
                    <Progress value={Math.min((communityStats.totalItemsClassified / 5000) * 100, 100)} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Active Users</span>
                      <span className="text-sm text-gray-500">
                        {communityStats.activeUsers >= 1000
                          ? `${(communityStats.activeUsers / 1000).toFixed(0)}K+`
                          : communityStats.activeUsers}
                      </span>
                    </div>
                    <Progress value={Math.min((communityStats.activeUsers / communityStats.totalUsers) * 100, 100)} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
