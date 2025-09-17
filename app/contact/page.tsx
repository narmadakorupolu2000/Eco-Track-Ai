import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Leaf, Mail, MessageSquare, Phone, MapPin } from "lucide-react"

export default function ContactPage() {
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
            <Link
              href="/about"
              className="text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
            >
              About
            </Link>
            <Link href="/contact" className="text-green-600 font-medium">
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
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 text-balance">Get in Touch</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto text-pretty">
            Have questions about EcoTrack AI? We'd love to hear from you. Send us a message and we'll respond as soon as
            possible.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Send us a Message</CardTitle>
                <CardDescription>Fill out the form below and we'll get back to you within 24 hours.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john@example.com" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="How can we help you?" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us more about your question or feedback..."
                      className="min-h-[120px]"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Contact Information</CardTitle>
                  <CardDescription>Reach out to us through any of these channels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Mail className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Email</h4>
                      <p className="text-gray-600 dark:text-gray-300">hello@ecotrack.ai</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Phone className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Phone</h4>
                      <p className="text-gray-600 dark:text-gray-300">+1 (555) 123-4567</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <MapPin className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Address</h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        123 Green Street
                        <br />
                        San Francisco, CA 94102
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">How accurate is the AI waste classification?</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Our AI model has over 95% accuracy across 50+ waste categories and is continuously improving.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Is my data secure?</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Yes, we use enterprise-grade encryption and never share your personal data with third parties.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Can I use EcoTrack AI offline?</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Some features work offline, but AI classification and chat require an internet connection.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 px-4 bg-white/50 dark:bg-gray-900/50">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Other Ways to Get Help</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Live Chat</CardTitle>
                <CardDescription>Chat with our support team in real-time during business hours.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent">
                  Start Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Help Center</CardTitle>
                <CardDescription>Browse our comprehensive documentation and tutorials.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/help">
                  <Button variant="outline" className="w-full bg-transparent">
                    Visit Help Center
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Community</CardTitle>
                <CardDescription>Join our community forum to connect with other users.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/community">
                  <Button variant="outline" className="w-full bg-transparent">
                    Join Community
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
