"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Leaf,
  Users,
  Settings,
  Shield,
  TrendingUp,
  Camera,
  MessageCircle,
  Award,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react"

export default function AdminDashboardPage() {
  const [stats] = useState({
    totalUsers: 10247,
    activeUsers: 8934,
    totalClassifications: 524891,
    totalChatMessages: 89234,
    carbonSaved: 2547.8,
    pointsAwarded: 1847293,
  })

  const [recentUsers] = useState([
    { id: 1, name: "John Doe", email: "john@example.com", joinDate: "2024-01-15", status: "active", points: 1250 },
    { id: 2, name: "Jane Smith", email: "jane@example.com", joinDate: "2024-01-14", status: "active", points: 890 },
    { id: 3, name: "Mike Johnson", email: "mike@example.com", joinDate: "2024-01-13", status: "inactive", points: 456 },
    { id: 4, name: "Sarah Wilson", email: "sarah@example.com", joinDate: "2024-01-12", status: "active", points: 2100 },
    { id: 5, name: "Tom Brown", email: "tom@example.com", joinDate: "2024-01-11", status: "active", points: 678 },
  ])

  const [systemHealth] = useState({
    apiStatus: "healthy",
    databaseStatus: "healthy",
    aiServiceStatus: "warning",
    storageStatus: "healthy",
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-blue-950">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Leaf className="h-8 w-8 text-green-600" />
                <h1 className="text-2xl font-bold text-green-800 dark:text-green-400">EcoTrack AI</h1>
              </Link>
              <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                Admin Panel
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Back to App
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-300">Monitor and manage your EcoTrack AI platform</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeUsers.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1">+8% from last week</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Classifications</CardTitle>
                <Camera className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalClassifications.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1">+15% from last week</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Chat Messages</CardTitle>
                <MessageCircle className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.totalChatMessages.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1">+22% from last week</p>
            </CardContent>
          </Card>

          <Card className="border-teal-200 dark:border-teal-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Carbon Saved</CardTitle>
                <Leaf className="h-4 w-4 text-teal-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">{stats.carbonSaved}kg</div>
              <p className="text-xs text-green-600 mt-1">+18% from last month</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Points Awarded</CardTitle>
                <Award className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pointsAwarded.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1">+25% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              System Health
            </CardTitle>
            <CardDescription>Real-time status of all system components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">API Service</p>
                  <p className="text-sm text-gray-500">Healthy</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Database</p>
                  <p className="text-sm text-gray-500">Healthy</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">AI Service</p>
                  <p className="text-sm text-gray-500">Warning</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Storage</p>
                  <p className="text-sm text-gray-500">Healthy</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Management Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage user accounts and permissions</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.joinDate}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                        </TableCell>
                        <TableCell>{user.points}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Classification Moderation</CardTitle>
                  <CardDescription>Review and moderate AI classifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                        <div>
                          <p className="font-medium">Plastic Bottle Classification</p>
                          <p className="text-sm text-gray-500">Flagged for review</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Approve
                        </Button>
                        <Button variant="outline" size="sm">
                          Reject
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                        <div>
                          <p className="font-medium">Food Waste Classification</p>
                          <p className="text-sm text-gray-500">Pending review</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Approve
                        </Button>
                        <Button variant="outline" size="sm">
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Chat Monitoring</CardTitle>
                  <CardDescription>Monitor AI chat interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">User: john@example.com</p>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">"How can I reduce my carbon footprint?"</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">User: jane@example.com</p>
                        <Badge variant="secondary">Resolved</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">"What's the best way to recycle electronics?"</p>
                      <p className="text-xs text-gray-500">5 hours ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Analytics</CardTitle>
                  <CardDescription>Platform usage trends and metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Daily Active Users</span>
                        <span className="text-sm text-gray-500">8,934</span>
                      </div>
                      <Progress value={89} />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Classifications per Day</span>
                        <span className="text-sm text-gray-500">2,456</span>
                      </div>
                      <Progress value={76} />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Chat Interactions</span>
                        <span className="text-sm text-gray-500">1,234</span>
                      </div>
                      <Progress value={62} />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">User Retention</span>
                        <span className="text-sm text-gray-500">87%</span>
                      </div>
                      <Progress value={87} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Environmental Impact</CardTitle>
                  <CardDescription>Track the platform's environmental contributions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-3xl font-bold text-green-600 mb-2">2,547.8 kg</div>
                      <p className="text-sm text-green-700 dark:text-green-300">Total CO2 Saved</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-xl font-bold text-blue-600">524K</div>
                        <p className="text-xs text-gray-500">Items Classified</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-xl font-bold text-purple-600">89K</div>
                        <p className="text-xs text-gray-500">Eco Tips Shared</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Server Performance</CardTitle>
                  <CardDescription>Monitor system resources and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">CPU Usage</span>
                        <span className="text-sm text-gray-500">45%</span>
                      </div>
                      <Progress value={45} />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Memory Usage</span>
                        <span className="text-sm text-gray-500">67%</span>
                      </div>
                      <Progress value={67} />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Storage Usage</span>
                        <span className="text-sm text-gray-500">34%</span>
                      </div>
                      <Progress value={34} />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Network I/O</span>
                        <span className="text-sm text-gray-500">23%</span>
                      </div>
                      <Progress value={23} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Monitoring</CardTitle>
                  <CardDescription>Track API performance and errors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Classification API</p>
                        <p className="text-sm text-gray-500">99.9% uptime</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Chat API</p>
                        <p className="text-sm text-gray-500">99.7% uptime</p>
                      </div>
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">User API</p>
                        <p className="text-sm text-gray-500">100% uptime</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                  <CardDescription>Configure platform-wide settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">User Registration</p>
                      <p className="text-sm text-gray-500">Allow new user signups</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enabled
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">AI Classification</p>
                      <p className="text-sm text-gray-500">Enable AI waste classification</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enabled
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Chat Moderation</p>
                      <p className="text-sm text-gray-500">Moderate chat messages</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enabled
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Backup & Maintenance</CardTitle>
                  <CardDescription>System backup and maintenance tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Database Backup</p>
                      <p className="text-sm text-gray-500">Last backup: 2 hours ago</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Run Now
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">System Update</p>
                      <p className="text-sm text-gray-500">Check for updates</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Check
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Cache Clear</p>
                      <p className="text-sm text-gray-500">Clear system cache</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
