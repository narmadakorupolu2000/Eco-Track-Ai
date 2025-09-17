import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Leaf, Recycle, Users, TrendingUp, Camera, MessageCircle } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-green-800 dark:text-green-400">EcoTrack AI</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/features"
              className="text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
            >
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
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 text-balance">
            Track Your Environmental Impact with <span className="text-green-600">AI Power</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto text-pretty">
            Join the movement towards a sustainable future. Use AI to classify waste, track your carbon footprint, and
            get personalized eco-friendly recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Start Tracking Today
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline">
                Try Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-white/50 dark:bg-gray-900/50">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Powerful Features for Environmental Tracking
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <Camera className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>AI Waste Classification</CardTitle>
                <CardDescription>
                  Upload photos of waste items and get instant AI-powered classification and disposal recommendations.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <MessageCircle className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>EcoChat Assistant</CardTitle>
                <CardDescription>
                  Get personalized environmental advice and answers to your sustainability questions from our AI
                  chatbot.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Carbon Footprint Tracking</CardTitle>
                <CardDescription>
                  Monitor your daily activities and see their environmental impact with detailed analytics.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader>
                <Recycle className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>Gamified Experience</CardTitle>
                <CardDescription>
                  Earn points, unlock achievements, and compete with friends to make sustainability fun.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-teal-200 dark:border-teal-800">
              <CardHeader>
                <Users className="h-12 w-12 text-teal-600 mb-4" />
                <CardTitle>Community Impact</CardTitle>
                <CardDescription>
                  Join a community of eco-warriors and see collective environmental improvements.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <Leaf className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Personalized Tips</CardTitle>
                <CardDescription>
                  Receive AI-generated recommendations tailored to your lifestyle and environmental goals.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-green-600 text-white">
        <div className="container mx-auto text-center">
          <h3 className="text-4xl font-bold mb-6">Ready to Make a Difference?</h3>
          <p className="text-xl mb-8 text-green-100 max-w-2xl mx-auto">
            Join thousands of users already making a positive environmental impact with EcoTrack AI.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="h-6 w-6 text-green-400" />
                <span className="text-xl font-bold">EcoTrack AI</span>
              </div>
              <p className="text-gray-400">
                Making environmental tracking accessible and engaging through AI technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/waste-classifier" className="hover:text-white">
                    Waste Classification
                  </Link>
                </li>
                <li>
                  <Link href="/eco-chat" className="hover:text-white">
                    EcoChat
                  </Link>
                </li>
                <li>
                  <Link href="/tracking" className="hover:text-white">
                    Carbon Tracking
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-white">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/community" className="hover:text-white">
                    Community
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 EcoTrack AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
