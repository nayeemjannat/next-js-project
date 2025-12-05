"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Star, Wrench, Droplets, Zap, Brush, Leaf } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-secondary to-white pt-20 pb-32">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
              Find Trusted Professionals for Any Home Project
            </h1>
            <p className="text-lg text-muted-foreground mb-8 text-balance">
              Connect with skilled service providers in your area for all your home needs.
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Enter your location"
                className="flex-1 px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button className="bg-primary hover:bg-primary/90 text-white px-8">Search</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 container">
        <h2 className="text-3xl font-bold mb-12">Featured Services</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[
            { icon: Droplets, label: "Cleaning", color: "bg-cyan-100" },
            { icon: Zap, label: "Electrical", color: "bg-amber-100" },
            { icon: Wrench, label: "Plumbing", color: "bg-blue-100" },
            { icon: Brush, label: "Painting", color: "bg-teal-100" },
            { icon: Leaf, label: "Gardening", color: "bg-green-100" },
          ].map((service, idx) => {
            const Icon = service.icon
            return (
              <div
                key={idx}
                className={`${service.color} rounded-lg p-6 text-center cursor-pointer hover:shadow-lg transition`}
              >
                <Icon className="w-8 h-8 mx-auto mb-3 text-gray-700" />
                <p className="font-semibold text-sm">{service.label}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Trending Providers */}
      <section className="py-16 container">
        <h2 className="text-3xl font-bold mb-12">Trending Providers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              name: "Alex R.",
              role: "Plumber",
              image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
            },
            {
              name: "Sarah L.",
              role: "Electrician",
              image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
            },
            {
              name: "Mike J.",
              role: "Gardener",
              image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
            },
          ].map((provider, idx) => (
            <div key={idx} className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                <Image
                  src={provider.image || "/placeholder.svg"}
                  alt={provider.name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-lg">{provider.name}</h3>
              <p className="text-muted-foreground">{provider.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-secondary container">
        <h2 className="text-3xl font-bold mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "1", title: "Search for Services", desc: "Find the service you need and enter your location." },
            {
              step: "2",
              title: "Connect with Providers",
              desc: "Browse provider profiles and reviews to find the best match.",
            },
            { step: "3", title: "Get the Job Done", desc: "Schedule and manage your service appointment with ease." },
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-lg p-8 text-center">
              <div className="text-4xl font-bold text-primary mb-4">{item.step}</div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 container">
        <h2 className="text-3xl font-bold mb-12">Customer Testimonials</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Emily C.",
              text: "I had a great experience with Homease! The plumber I hired was professional, efficient, and fixed the issue quickly.",
            },
            {
              name: "David S.",
              text: "Finding a reliable electrician made easy. The service was prompt and the quality of work was excellent.",
            },
            {
              name: "Jessica M.",
              text: "I used Homease to find a gardener, and I couldn't be happier with the results. Highly recommend!",
            },
          ].map((testimonial, idx) => (
            <div key={idx} className="bg-card rounded-lg p-6 border border-border">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground mb-4">"{testimonial.text}"</p>
              <p className="font-semibold text-sm">{testimonial.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white text-center container">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-lg mb-8 text-white/90">Find the perfect service provider for your next project.</p>
        <Link href="/auth/login">
          <Button className="bg-white text-primary hover:bg-gray-100">Book a Service Now</Button>
        </Link>
      </section>

      <Footer />
    </div>
  )
}
