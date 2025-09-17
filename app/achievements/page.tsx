"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Leaf,
  Award,
  Trophy,
  Star,
  Target,
  Zap,
  Users,
  Camera,
  MessageCircle,
  Calendar,
  Settings,
  LogOut,
  Bell,
  Search,
  Crown,
  Medal,
} from "lucide-react"

export default function AchievementsPage() {
  const [userStats] = useState({
    level: 12,
    totalPoints: 2450,
    nextLevelPoints: 2800,
    streak: 15,
    rank: 47,
    totalUsers: 10247,
  })

  const [achievements] = useState([
    {
      id: 1,
      title: "Eco Starter",
      description: "Complete your first waste classification",
      icon: Leaf,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
      earned: true,
      earnedDate: "2024-01-10",
      points: 50,
    },
    {
      id: 2,
      title: "Classification Master",
      description: "Classify 100 waste items",
      icon: Camera,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      earned: true,
      earnedDate: "2024-01-12",
      points: 200,
    },
    {
      id: 3,
      title: "Chat Champion",
      description: "Have 50 conversations with EcoBot",
      icon: MessageCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900",
      earned: true,
      earnedDate: "2024-01-14",
      points: 150,
    },
    {
      id: 4,
      title: "Streak Keeper",
      description: "Maintain a 30-day activity streak",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900",
      earned: false,
      progress: 15,
      target: 30,
      points: 300,
    },
    {
      id: 5,
      title: "Carbon Crusher",
      description: "Reduce carbon footprint by 50%",
      icon: Zap,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
      earned: false,
      progress: 32,
      target: 50,
      points: 500,
    },
    {
      id: 6,
      title: "Community Leader",
      description: "Reach top 10 on the leaderboard",
      icon: Crown,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900",
      earned: false,
      progress: 47,
      target: 10,
      points: 1000,
    },
  ])

  const [leaderboard] = useState([
    { rank: 1, name: "EcoWarrior2024", points: 5420, level: 18, badge: "🏆" },
    { rank: 2, name: "GreenThumb", points: 4890, level: 16, badge: "🥈" },
    { rank: 3, name: "SustainableSam", points: 4650, level: 15, badge: "🥉" },
    { rank: 4, name: "ClimateChamp", points: 4200, level: 14, badge: "⭐" },
    { rank: 5, name: "EcoFriendly", points: 3980, level: 13, badge: "⭐" },
    { rank: 47, name: "You", points: 2450, level: 12, badge: "🌱" },
  ])

  const [challenges] = useState([
    {
      id: 1,
      title: "Weekly Warrior",
      description: "Log 7 eco-activities this week",
      progress: 4,
      target: 7,
      timeLeft: "3 days",
      reward: 100,
      participants: 1247,
    },
    {
      id: 2,
      title: "Classification Challenge",
      description: "Classify 20 items this month",
      progress: 12,
      target: 20,
      timeLeft: "18 days",
      reward: 250,
      participants: 892,
    },
    {
      id: 3,
      title: "Carbon Reduction Sprint",
      description: "Reduce footprint by 10% this month",
      progress: 6,
      target: 10,
      timeLeft: "18 days",
      reward: 500,
      participants: 634,
    },
  ])

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
                <Link
                  href="/tracking"
                  className="text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
                >
                  Tracking
                </Link>
                <Link href="/achievements" className="text-green-600 font-medium">
                  Achievements
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
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Achievements & Rewards</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Track your progress, earn badges, and compete with the community.
            </p>
          </div>

          {/* User Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Level</CardTitle>
                  <Star className="h-4 w-4 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{userStats.level}</div>
                <Progress value={(userStats.totalPoints / userStats.nextLevelPoints) * 100} className="mt-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {userStats.nextLevelPoints - userStats.totalPoints} points to next level
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Points</CardTitle>
                  <Award className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{userStats.totalPoints.toLocaleString()}</div>
                <p className="text-xs text-green-600 mt-1">+125 this week</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Streak</CardTitle>
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{userStats.streak} days</div>
                <p className="text-xs text-orange-600 mt-1">Personal best!</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Rank</CardTitle>
                  <Trophy className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">#{userStats.rank}</div>
                <p className="text-xs text-gray-500 mt-1">of {userStats.totalUsers.toLocaleString()} users</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="achievements" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
            </TabsList>

            {/* Achievements Tab */}
            <TabsContent value="achievements">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement) => (
                  <Card
                    key={achievement.id}
                    className={`${achievement.earned ? "border-green-200 dark:border-green-800" : "border-gray-200 dark:border-gray-700"}`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${achievement.bgColor}`}>
                          <achievement.icon className={`h-6 w-6 ${achievement.color}`} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{achievement.title}</CardTitle>
                          <CardDescription className="text-sm">{achievement.description}</CardDescription>
                        </div>
                        {achievement.earned && <Badge className="bg-green-100 text-green-800">Earned</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {achievement.earned ? (
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-2">Earned on {achievement.earnedDate}</p>
                          <Badge variant="secondary">+{achievement.points} points</Badge>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm text-gray-500">
                              {achievement.progress}/{achievement.target}
                            </span>
                          </div>
                          <Progress value={(achievement.progress! / achievement.target!) * 100} />
                          <p className="text-xs text-gray-500 mt-2">Reward: +{achievement.points} points</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Global Leaderboard
                  </CardTitle>
                  <CardDescription>See how you rank against other eco-warriors worldwide.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leaderboard.map((user) => (
                      <div
                        key={user.rank}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          user.name === "You"
                            ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800"
                            : "border"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">{user.badge}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.name}</span>
                              {user.name === "You" && <Badge variant="secondary">You</Badge>}
                            </div>
                            <p className="text-sm text-gray-500">Level {user.level}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">#{user.rank}</div>
                          <p className="text-sm text-gray-500">{user.points.toLocaleString()} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Challenges Tab */}
            <TabsContent value="challenges">
              <div className="grid lg:grid-cols-2 gap-6">
                {challenges.map((challenge) => (
                  <Card key={challenge.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{challenge.title}</CardTitle>
                          <CardDescription>{challenge.description}</CardDescription>
                        </div>
                        <Badge variant="outline">{challenge.timeLeft} left</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-gray-500">
                            {challenge.progress}/{challenge.target}
                          </span>
                        </div>
                        <Progress value={(challenge.progress / challenge.target) * 100} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-500">{challenge.participants} participants</span>
                        </div>
                        <Badge variant="secondary">+{challenge.reward} points</Badge>
                      </div>

                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <Target className="h-4 w-4 mr-2" />
                        Join Challenge
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Rewards Tab */}
            <TabsContent value="rewards">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Medal className="h-5 w-5 text-yellow-600" />
                      Available Rewards
                    </CardTitle>
                    <CardDescription>Redeem your points for exclusive rewards.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Eco-Friendly Water Bottle</p>
                        <p className="text-sm text-gray-500">Sustainable bamboo water bottle</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">500 points</Badge>
                        <Button size="sm" className="ml-2">
                          Redeem
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Tree Planting Certificate</p>
                        <p className="text-sm text-gray-500">Plant a tree in your name</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">1000 points</Badge>
                        <Button size="sm" className="ml-2">
                          Redeem
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Premium Features</p>
                        <p className="text-sm text-gray-500">1 month premium access</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">2000 points</Badge>
                        <Button size="sm" className="ml-2" disabled>
                          Not enough points
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Reward History</CardTitle>
                    <CardDescription>Your recently redeemed rewards.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">EcoTrack Stickers</p>
                          <p className="text-sm text-gray-500">Redeemed on Jan 10, 2024</p>
                        </div>
                        <Badge variant="secondary">-200 pts</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Digital Badge Pack</p>
                          <p className="text-sm text-gray-500">Redeemed on Jan 5, 2024</p>
                        </div>
                        <Badge variant="secondary">-100 pts</Badge>
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
