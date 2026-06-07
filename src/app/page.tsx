import Link from 'next/link'
import { auth } from '@/auth'
import { ArrowRight, Zap, GitMerge, FileText, CheckCircle } from 'lucide-react'

export default async function LandingPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  const features = [
    {
      title: 'Automated Task Extraction',
      description: 'Isolate engineering tickets, owners, priority, and deadlines directly from dialog transcripts.',
      icon: Zap,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'Ecosystem Sync',
      description: 'Push tasks directly to Atlassian Jira and GitHub issues in a single click.',
      icon: GitMerge,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Specs & Documentation',
      description: 'Draft software design requirements, API schemas, and summaries from technical discussions.',
      icon: FileText,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
  ]

  return (
    <div className="relative min-h-screen bg-[#030712] overflow-hidden flex flex-col justify-between">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[100px] pointer-events-none" />

      {/* Navigation bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-lg shadow-md shadow-indigo-600/20">
            <Zap className="w-4.5 h-4.5 text-white fill-white/10" />
          </div>
          <span className="font-extrabold text-white text-base tracking-tight">SynapseTask</span>
          <span className="text-indigo-400 font-bold text-xs">Pro</span>
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10"
            >
              Go to Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-xs font-bold text-gray-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-505 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-4xl mx-auto z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/5 mb-6 animate-fade-in">
          <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
          <span className="text-xxs font-semibold text-indigo-300 tracking-wider uppercase">Unified Meeting Action Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
          Spoken Meetings to <br className="hidden sm:inline" />
          <span className="text-gradient">Engineering Backlogs.</span>
        </h1>

        <p className="text-gray-400 text-sm sm:text-lg leading-relaxed max-w-2xl mb-10">
          SynapseTask automatically extracts structured tasks, priority ratings, and system specifications directly from video or audio transcripts. Bridge conversations and git boards seamlessly.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-20">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-505 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/25 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              Enter Workspace Dashboard
              <ArrowRight className="w-4.5 h-4.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-505 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/25 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                Get Started for Free
                <ArrowRight className="w-4.5 h-4.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 border border-gray-800 hover:bg-gray-850 text-gray-300 hover:text-white rounded-xl text-sm font-bold transition-colors cursor-pointer"
              >
                Sign In to Platform
              </Link>
            </>
          )}
        </div>

        {/* Feature section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {features.map((feat, idx) => {
            const Icon = feat.icon
            return (
              <div
                key={idx}
                className="glass-card rounded-2xl p-6 text-left border border-gray-850 hover:border-gray-800 transition-all hover:scale-[1.01]"
              >
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-4 ${feat.color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{feat.description}</p>
              </div>
            )
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-gray-900/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-xxs text-gray-500 z-10">
        <p>© 2026 SynapseTask. All rights reserved.</p>
        <div className="flex gap-6">
          <span className="hover:text-gray-400 transition-colors cursor-pointer">Privacy Policy</span>
          <span className="hover:text-gray-400 transition-colors cursor-pointer">Terms of Service</span>
        </div>
      </footer>
    </div>
  )
}
