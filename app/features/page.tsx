import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Leaf,
  Camera,
  MessageCircle,
  TrendingUp,
  Recycle,
  Users,
  Award,
  Target,
  BarChart3,
  Smartphone,
} from "lucide-react"

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-green-800 dark:text-green-400">EcoTrack AI</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-green-600 font-medium">
              Features
            </Link>
            <Link
              href="/about"
              className="text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
            >
              Contact
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            AI-Powered Environmental Tracking
          </Badge>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 text-balance">
            Everything You Need to Track Your Environmental Impact
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto text-pretty">
            Discover all the powerful features that make EcoTrack AI the most comprehensive environmental tracking
            platform available.
          </p>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Core AI Features</h3>
          <div className="grid lg:grid-cols-2 gap-12">
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Camera className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">AI Waste Classification</CardTitle>
                    <Badge variant="secondary">Powered by Computer Vision</Badge>
                  </div>
                </div>
                <CardDescription className="text-base">
                  Upload photos of waste items and get instant AI-powered classification with disposal recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Identifies 50+ waste categories
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Provides recycling instructions
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Suggests eco-friendly alternatives
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Real-time processing
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <MessageCircle className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">EcoChat Assistant</CardTitle>
                    <Badge variant="secondary">Powered by Groq AI</Badge>
                  </div>
                </div>
                <CardDescription className="text-base">
                  Get personalized environmental advice and answers to your sustainability questions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    24/7 environmental guidance
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Personalized recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Context-aware responses
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Multi-language support
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tracking Features */}
      <section className="py-16 px-4 bg-white/50 dark:bg-gray-900/50">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Comprehensive Tracking</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Carbon Footprint</CardTitle>
                <CardDescription>
                  Track your daily carbon emissions from transportation, energy use, and consumption.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Recycle className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Waste Management</CardTitle>
                <CardDescription>
                  Monitor your waste generation and recycling habits with detailed analytics.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-teal-600 mb-4" />
                <CardTitle>Progress Analytics</CardTitle>
                <CardDescription>
                  Visualize your environmental impact over time with comprehensive charts.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Gamification Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Gamification & Community
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <Award className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Unlock badges and rewards for eco-friendly actions.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Target className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <CardTitle>Goals & Challenges</CardTitle>
                <CardDescription>Set personal targets and join community challenges.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Leaderboards</CardTitle>
                <CardDescription>Compete with friends and see community rankings.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Smartphone className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Mobile Ready</CardTitle>
                <CardDescription>Access all features on any device, anywhere.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-green-600 text-white">
        <div className="container mx-auto text-center">
          <h3 className="text-4xl font-bold mb-6">Ready to Start Your Eco Journey?</h3>
          <p className="text-xl mb-8 text-green-100 max-w-2xl mx-auto">
            Join thousands of users already making a positive environmental impact with these powerful features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                Get Started Free
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-green-600 bg-transparent"
              >
                Try Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
