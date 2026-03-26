'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Trophy, Medal, Star, Compass } from 'lucide-react'

type Period = 'daily' | 'weekly' | 'monthly'

interface Score {
  _id: string
  userName: string
  score: number
  createdAt: string
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },   
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('daily')
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchScores()
  }, [period])

  const fetchScores = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/scores?period=${period}`)
      const data = await res.json()
      setScores(data)
    } catch (error) {
      console.error('Failed to fetch scores:', error)
    } finally {
      setLoading(false)
    }
  }

  const periods: { value: Period, label: string }[] = [
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'Past Week' },
    { value: 'monthly', label: 'All Time' }
  ]

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" size={32} />
    if (index === 1) return <Medal className="text-slate-300 drop-shadow-[0_0_10px_rgba(203,213,225,0.4)]" size={28} />
    if (index === 2) return <Medal className="text-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.5)]" size={28} />
    return <span className="text-xl font-bold text-neutral-500 w-[28px] text-center">#{index + 1}</span>
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white selection:bg-blue-500/30 font-sans">
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 py-12 max-w-3xl relative z-10">
        <header className="flex items-center justify-between mb-12">
          <Link
            href="/"
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors bg-neutral-900/50 hover:bg-neutral-800 px-4 py-2 rounded-full border border-neutral-800 backdrop-blur-md"
          >
            <ChevronLeft size={20} /> <span className="text-sm font-semibold hidden sm:inline">Return to Arena</span>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-3">
              Hall of Fame <Star className="text-blue-400" fill="currentColor" size={28} />
            </h1>
          </div>
          <div className="w-[140px] hidden sm:block"></div>
        </header>

        <div className="flex bg-neutral-900/40 backdrop-blur-md p-1.5 rounded-2xl mb-8 border border-neutral-800 shadow-xl">
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`flex-1 py-3 text-sm sm:text-base rounded-xl font-bold transition-all relative ${
                period === p.value
                  ? 'text-white'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
              }`}
            >
              {period === p.value && (
                <motion.div 
                  layoutId="active-pill" 
                  className="absolute inset-0 bg-blue-600 rounded-xl"
                  style={{ zIndex: -1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              {p.label}
            </button>
          ))}
        </div>

        <div className="bg-neutral-900/40 backdrop-blur-xl rounded-3xl border border-neutral-800 overflow-hidden shadow-2xl relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-blue-500"
              >
                <Compass className="animate-spin mb-4 text-blue-500" size={40} />
                <p className="font-semibold tracking-widest uppercase text-sm">Searching records...</p>
              </motion.div>
            ) : scores.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500"
              >
                <Compass className="mb-4 opacity-50" size={48} />
                <p className="text-lg font-medium">No records found for this period.</p>
                <p className="text-sm mt-2 text-neutral-600">Be the first to leave your legacy!</p>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="p-2 sm:p-4 flex flex-col gap-2"
              >
                {scores.map((score, index) => (
                  <motion.div
                    key={score._id}
                    variants={itemVariants}
                    className="relative group bg-neutral-950/50 backdrop-blur-sm border border-neutral-800 hover:border-blue-500/30 rounded-2xl flex items-center justify-between p-4 sm:p-5 transition-colors overflow-hidden"
                  >
                    {/* Background glow for top 3 on hover */}
                    {index < 3 && (
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none 
                        ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-300' : 'bg-amber-600'}`} 
                      />
                    )}

                    <div className="flex items-center gap-4 sm:gap-6 z-10 w-full">
                      <div className="flex items-center justify-center w-[40px]">
                        {getRankIcon(index)}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className={`font-black text-lg sm:text-xl truncate ${index === 0 ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600' : 'text-white'}`}>
                          {score.userName}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5 tracking-wider">
                          {new Date(score.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl sm:text-3xl font-black text-white px-2 tracking-tight">
                          {score.score.toLocaleString()}
                        </p>
                        <p className="text-[10px] sm:text-xs text-blue-400 font-bold uppercase tracking-widest mt-1">PTS</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  )
}