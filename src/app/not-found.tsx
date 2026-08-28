'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Home, Search, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center">
          {/* 404 Number */}
          <div className="mb-8">
            <h1 className="text-9xl font-outfit-bold text-[#114373] mb-4">
              404
            </h1>
            <div className="w-24 h-1 bg-[#6db99f] mx-auto mb-6"></div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#114373]/10 rounded-full mb-6">
              <FileQuestion className="w-10 h-10 text-[#114373]" />
            </div>
            <h2 className="text-3xl font-outfit-bold text-gray-900 mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <p className="text-base text-gray-500">
              Please check the URL or return to the homepage.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#114373] text-white rounded-lg hover:bg-[#0d3559] transition-colors font-medium shadow-md hover:shadow-lg"
            >
              <Home className="w-5 h-5" />
              Go to Homepage
            </Link>
            <Link
              href="/job-search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#114373] border-2 border-[#114373] rounded-lg hover:bg-[#114373]/5 transition-colors font-medium"
            >
              <Search className="w-5 h-5" />
              Browse Jobs
            </Link>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Quick Links:</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/" className="text-[#114373] hover:text-[#0d3559] hover:underline">
                Home
              </Link>
              <Link href="/job-search" className="text-[#114373] hover:text-[#0d3559] hover:underline">
                Job Search
              </Link>
              <Link href="/candidate/register" className="text-[#114373] hover:text-[#0d3559] hover:underline">
                Candidate Registration
              </Link>
              <Link href="/employer/register" className="text-[#114373] hover:text-[#0d3559] hover:underline">
                Employer Registration
              </Link>
              <Link href="/contact" className="text-[#114373] hover:text-[#0d3559] hover:underline">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

