import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Leaf, Target, Users, Globe, Heart, Lightbulb } from "lucide-react"

export default function AboutPage() {
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
            <Link
              href="/features"
              className="text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
            >
              Features
            </Link>
            <Link href="/about" className="text-green-600 font-medium">
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
            Our Mission: <span className="text-green-600">A Sustainable Future</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto text-pretty">
            EcoTrack AI was born from the belief that technology can empower individuals to make meaningful
            environmental changes. We're making sustainability accessible, engaging, and impactful.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4 bg-white/50 dark:bg-gray-900/50">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <Target className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle className="text-2xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  To democratize environmental tracking and make sustainable living accessible to everyone through
                  innovative AI technology. We believe that when people understand their environmental impact, they're
                  empowered to make better choices for our planet.
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <Globe className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle className="text-2xl">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  A world where every individual has the tools and knowledge to live sustainably. We envision a future
                  where environmental consciousness is seamlessly integrated into daily life, creating a collective
                  positive impact on our planet.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Our Core Values</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Lightbulb className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <CardTitle>Innovation</CardTitle>
                <CardDescription className="text-base">
                  We leverage cutting-edge AI technology to solve environmental challenges in creative and accessible
                  ways.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Heart className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <CardTitle>Empathy</CardTitle>
                <CardDescription className="text-base">
                  We understand that sustainable living can be challenging, so we create supportive tools that meet
                  people where they are.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Community</CardTitle>
                <CardDescription className="text-base">
                  We believe in the power of collective action and build features that connect and inspire environmental
                  stewards.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-16 px-4 bg-green-600 text-white">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Our Growing Impact</h3>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-green-100">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500K+</div>
              <div className="text-green-100">Items Classified</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2.5M</div>
              <div className="text-green-100">CO2 Tons Tracked</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-green-100">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Built by Environmental Enthusiasts
          </h3>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
              Our team combines expertise in artificial intelligence, environmental science, and user experience design.
              We're passionate about creating technology that makes a real difference in the fight against climate
              change.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              From data scientists to environmental researchers, every team member brings unique insights that help us
              build better tools for sustainable living.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-white/50 dark:bg-gray-900/50">
        <div className="container mx-auto text-center">
          <h3 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">Join Our Mission</h3>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Be part of the solution. Start tracking your environmental impact today and join thousands of users making a
            difference.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
