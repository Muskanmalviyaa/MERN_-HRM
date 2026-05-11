import { Link } from "wouter";
import { Fingerprint, Clock, CheckCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-xl tracking-tight">
            <Fingerprint className="w-6 h-6 text-primary" />
            <span>Attendance Core</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Sign In
            </Link>
            <Button asChild className="font-semibold shadow-sm">
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="max-w-3xl space-y-8">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Professional Time Tracking, <br />
            <span className="text-primary">Verified & Secure.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            A dense, high-clarity internal tool for modern HR teams. Live selfie validation, GPS boundaries, and authoritative reporting.
          </p>
          <div className="pt-8">
            <Button asChild size="lg" className="h-14 px-8 text-base font-semibold shadow-md">
              <Link href="/sign-up">Deploy to Your Team</Link>
            </Button>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full text-left">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-primary">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Precision Tracking</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Real-time punch records with exact timestamp logging. No manual entry errors.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Live Selfie Capture</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Direct camera feed integration ensures the right person is clocking in. File uploads are blocked.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">GPS Boundaries</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Location logging on every punch ensures employees are on-site when they claim to be.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-500 font-medium">
        &copy; {new Date().getFullYear()} Attendance Core. All rights reserved.
      </footer>
    </div>
  );
}
