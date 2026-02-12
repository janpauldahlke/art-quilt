"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import heroImage from "@/assets/landing/hero-image.png";
import backgroundImage from "@/assets/landing/background.png";

/**
 * Landing page component containing meta information about the project
 * This page showcases ArtQuilt's capabilities and value proposition
 */

export default function LandingPage() {
  const router = useRouter();

  const handleStartCreating = () => {
    // Clear any existing image data when starting fresh
    if (typeof window !== "undefined") {
      localStorage.removeItem("art-quilt-upload-image");
      localStorage.removeItem("art-quilt-svg");
      localStorage.removeItem("art-quilt-design");
      sessionStorage.removeItem("art-quilt-user-prompt");
    }
    router.push("/upload");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-purple-600 transition-colors">
                ArtQuilt
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
                How It Works
              </a>
              <button
                onClick={handleStartCreating}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-colors"
              >
                Start Creating
              </button>
            </div>
            <div className="md:hidden">
              <button
                onClick={handleStartCreating}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-colors"
              >
                Start
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section with Background */}
      <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden">
        {/* Full Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundImage}
            alt="Quilted fabric background"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          {/* Subtle overlay to ensure text readability */}
          <div className="absolute inset-0 bg-white/70" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-8 text-left">
              <div className="space-y-4">
                <p className="text-base md:text-lg text-purple-700 font-semibold uppercase tracking-wider">
                  Welcome to ArtQuilt
                </p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Turn Images Into{" "}
                  <span className="text-purple-600">Quilt Designs</span>
                </h1>
              </div>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                Transform your photos or AI-generated images into beautiful,
                quilt-ready designs. From beginners to experienced makers, create
                printable patterns with color maps and fabric requirements.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleStartCreating}
                  className="px-8 py-4 bg-purple-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-purple-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                  Start Creating
                </button>
                <a
                  href="#how-it-works"
                  className="px-8 py-4 bg-white text-purple-600 text-lg font-semibold rounded-lg border-2 border-purple-600 hover:bg-purple-50 transition-colors text-center shadow-md"
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Hero Image - Prominently Displayed */}
            <div className="relative h-[500px] md:h-[600px] lg:h-[700px] rounded-3xl shadow-2xl overflow-hidden border-8 border-white/90">
              <Image
                src={heroImage}
                alt="Colorful art quilt design example showing vibrant textile art"
                fill
                className="object-cover"
                priority
                quality={90}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Create
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools designed for quilters and textile artists of all
              skill levels
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 hover:shadow-lg transition-shadow">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Upload or Generate
              </h3>
              <p className="text-gray-600">
                Upload your own photos or generate unique images with AI to use
                as your starting point
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 hover:shadow-lg transition-shadow">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Multiple Styles
              </h3>
              <p className="text-gray-600">
                Choose from geometric, pixelated, organic, and other visual
                styles to match your vision
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 hover:shadow-lg transition-shadow">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Printable Patterns
              </h3>
              <p className="text-gray-600">
                Get quilt-ready patterns with color maps and detailed fabric
                requirements
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 hover:shadow-lg transition-shadow">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Smart Simplification
              </h3>
              <p className="text-gray-600">
                Automatic color and shape simplification makes designs practical
                and easy to sew
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 hover:shadow-lg transition-shadow">
              <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Flexible Workflow
              </h3>
              <p className="text-gray-600">
                Faster, more flexible design workflows for experienced makers
                who want efficiency
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 hover:shadow-lg transition-shadow">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Beginner Friendly
              </h3>
              <p className="text-gray-600">
                Guidance and support for beginners who want to explore art
                quilting
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your images into quilt designs in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Upload or Generate
              </h3>
              <p className="text-gray-600 text-lg">
                Start with your own photo or use AI to generate a unique image
                that inspires you
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Choose Your Style
              </h3>
              <p className="text-gray-600 text-lg">
                Select from geometric, pixelated, organic, or other visual
                styles to transform your image
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Get Your Pattern
              </h3>
              <p className="text-gray-600 text-lg">
                Download your quilt-ready design with color maps and fabric
                requirements
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Made for Every Quilter
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Whether you&apos;re a hobby quilter exploring new techniques, a beginner
            looking for guidance, or an experienced maker seeking faster design
            workflows, ArtQuilt adapts to your needs and skill level.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="px-6 py-3 bg-purple-100 text-purple-700 rounded-full font-semibold shadow-sm">
              Hobby Quilters
            </span>
            <span className="px-6 py-3 bg-blue-100 text-blue-700 rounded-full font-semibold shadow-sm">
              Modern Quilters
            </span>
            <span className="px-6 py-3 bg-green-100 text-green-700 rounded-full font-semibold shadow-sm">
              Art Quilters
            </span>
            <span className="px-6 py-3 bg-orange-100 text-orange-700 rounded-full font-semibold shadow-sm">
              Beginners
            </span>
            <span className="px-6 py-3 bg-pink-100 text-pink-700 rounded-full font-semibold shadow-sm">
              Experienced Makers
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">ArtQuilt</h3>
              <p className="text-gray-400">
                Transform images into beautiful art quilt designs
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">About</h4>
              <p className="text-gray-400 text-sm">
                Created for the Cursor Hackathon 2026<br />
                at Bucerius Law School HH
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2026 ArtQuilt. Built by Jan, Roman & Ulla.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
