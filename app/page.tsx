'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Clock, Target, AlertCircle, Play, Flame } from 'lucide-react'
import confetti from 'canvas-confetti'

type GameState = 'waiting' | 'active' | 'too-soon'

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('waiting')
  const [score, setScore] = useState(0)
  const [attemptsLeft, setAttemptsLeft] = useState(3)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [message, setMessage] = useState('Are you fast enough?')
  const [userName, setUserName] = useState('')
  const [showNameInput, setShowNameInput] = useState(true)
  const [todayAttempts, setTodayAttempts] = useState(0)
  const [lastReaction, setLastReaction] = useState<number | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Load attempts from localStorage
  useEffect(() => {
    const lastPlayDate = localStorage.getItem('lastPlayDate')
    const today = new Date().toDateString()

    if (lastPlayDate !== today) {
      localStorage.setItem('lastPlayDate', today)
      localStorage.setItem('attemptsUsed', '0')
      setAttemptsLeft(3)
    } else {
      const used = parseInt(localStorage.getItem('attemptsUsed') || '0')
      setAttemptsLeft(3 - used)
      setTodayAttempts(used)
    }
  }, [])

  const updateAttempts = () => {
    const used = parseInt(localStorage.getItem('attemptsUsed') || '0')
    const newUsed = used + 1
    localStorage.setItem('attemptsUsed', newUsed.toString())
    setAttemptsLeft(3 - newUsed)
    setTodayAttempts(newUsed)
  }

  const startGame = useCallback(() => {
    if (attemptsLeft === 0) {
      setMessage('No attempts left today. Come back tomorrow!')
      return
    }

    if (!userName.trim()) {
      setMessage('Please enter a glorious name first!')
      return
    }

    setShowNameInput(false)
    setIsPlaying(true)
    setGameState('waiting')
    setScore(0)
    setTimeLeft(60)
    setLastReaction(null)
    setMessage('Stay steady... Wait for GREEN!')

    const scheduleNext = () => {
      const delay = Math.random() * 3000 + 1000
      timeoutRef.current = setTimeout(() => {
         setGameState('active')
         startTimeRef.current = Date.now()
         setMessage('⚡ CLICK NOW! ⚡')
      }, delay)
    }

    scheduleNext()

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          endGame(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [attemptsLeft, userName])

  const handleClick = useCallback(() => {
    if (!isPlaying) return

    if (gameState === 'waiting') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
      setGameState('too-soon')
      setMessage('Too eager! You clicked before green. Game Over.')
      setIsPlaying(false)
      updateAttempts()
      return
    }

    if (gameState === 'active') {
      const reactionTime = Date.now() - startTimeRef.current
      setLastReaction(reactionTime)
      
      const points = Math.max(0, Math.floor(2000 / reactionTime) * 100)
      setScore(prev => prev + points)
      setMessage(`+${points} pts (${reactionTime}ms)`)

      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      if (timeLeft > 0) {
        setGameState('waiting')
        const delay = Math.random() * 2000 + 1000
        timeoutRef.current = setTimeout(() => {
          setGameState('active')
          startTimeRef.current = Date.now()
          setMessage('⚡ CLICK NOW! ⚡')
        }, delay)
      }
    }
  }, [gameState, isPlaying, timeLeft])

  const endGame = useCallback(async (isTimeOver = false) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
    setIsPlaying(false)

    if (isTimeOver) {
      setMessage(`Time's up! Final Score: ${score}`)
      if (score > 1000) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#f59e0b']
        })
      }
    }

    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          type: 'daily',
          userName: userName
        }),
      })
    } catch (error) {
      console.error('Failed to save score:', error)
    }

    updateAttempts()
  }, [score, userName])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const boxVariants = {
    waiting: { backgroundColor: '#3b82f6', scale: 1 },
    active: { backgroundColor: '#10b981', scale: 1.05, boxShadow: '0 0 50px rgba(16, 185, 129, 0.6)' },
    'too-soon': { backgroundColor: '#ef4444', scale: 0.95, x: [-10, 10, -10, 10, 0] }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white selection:bg-blue-500/30 font-sans overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-2xl min-h-screen flex flex-col justify-center">
        <header className="text-center mb-12">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
              Rush: One Minute
            </h1>
            <p className="text-neutral-400 text-lg max-w-md mx-auto">
              Test your reflexes. Click on green, dodge the red. Only the agile top the charts.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 mt-6 text-blue-400 hover:text-blue-300 font-semibold transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-6 py-2.5 rounded-full border border-blue-500/20"
            >
              <Trophy size={18} /> View Global Rankings
            </Link>
          </motion.div>
        </header>

        <AnimatePresence mode="wait">
          {showNameInput ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-400 mb-2 uppercase tracking-wider">
                  Enter Participant Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && startGame()}
                    className="w-full bg-neutral-950 border border-neutral-800 text-white px-5 py-4 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all text-lg placeholder:text-neutral-600"
                    placeholder="e.g. Flash..."
                    maxLength={20}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600">
                    <Target size={20} />
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: userName.trim() ? 1.02 : 1 }}
                whileTap={{ scale: userName.trim() ? 0.98 : 1 }}
                onClick={startGame}
                disabled={!userName.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              >
                <Play size={20} /> Initialize Trial
              </motion.button>

              {todayAttempts > 0 && (
                <div className="mt-6 flex justify-center text-sm text-neutral-500">
                  <span className="flex items-center gap-2 bg-neutral-800/50 px-4 py-2 rounded-full border border-neutral-800">
                    <Flame size={16} className="text-orange-500" /> Attempts used: {todayAttempts}/3
                  </span>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col gap-6"
            >
              {/* Game HUD */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 flex flex-col items-center justify-center">
                  <Clock className={timeLeft <= 10 ? 'text-red-400 mb-1 animate-pulse' : 'text-blue-400 mb-1'} size={24} />
                  <span className={`text-2xl font-black font-mono ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
                    00:{timeLeft.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mt-1">Time Left</span>
                </div>
                
                <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 flex flex-col items-center justify-center">
                  <Trophy className="text-yellow-400 mb-1" size={24} />
                  <span className="text-2xl font-black text-white">{score}</span>
                  <span className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mt-1">Score</span>
                </div>

                <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 flex flex-col items-center justify-center">
                  <Target className="text-emerald-400 mb-1" size={24} />
                  <span className="text-2xl font-black text-white">{lastReaction ? `${lastReaction}ms` : '--'}</span>
                  <span className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mt-1">Reaction</span>
                </div>
              </div>

              {/* Game Arena */}
              <motion.div
                variants={boxVariants}
                animate={isPlaying ? gameState : 'waiting'}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                onPointerDown={handleClick}
                className={`relative overflow-hidden w-full aspect-[4/3] sm:aspect-video rounded-3xl cursor-pointer flex items-center justify-center select-none shadow-2xl ${
                  !isPlaying && attemptsLeft === 0 ? 'bg-neutral-800 pointer-events-none' : ''
                } ${!isPlaying && attemptsLeft > 0 ? 'bg-neutral-800 hover:bg-neutral-700' : ''}`}
                style={!isPlaying ? { backgroundColor: '#171717' } : {}}
              >
                {!isPlaying && attemptsLeft > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20" />
                )}
                
                <h2 className="relative z-10 text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-lg pointer-events-none text-center px-4">
                  {!isPlaying && attemptsLeft > 0 && 'Tap to Reveal True Speed'}
                  {!isPlaying && attemptsLeft === 0 && 'Exhausted! Come Back Tomorrow'}
                  {isPlaying && gameState === 'waiting' && 'Wait...'}
                  {isPlaying && gameState === 'active' && 'BAM!'}
                  {isPlaying && gameState === 'too-soon' && 'Missed it!'}
                </h2>
              </motion.div>

              {/* Message Banner */}
              <motion.div 
                key={message}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center h-12 flex items-center justify-center"
              >
                <p className={`text-lg font-medium px-4 py-2 rounded-full inline-flex items-center gap-2 ${
                  gameState === 'too-soon' ? 'bg-red-500/20 text-red-300' : 
                  gameState === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 
                  'bg-neutral-800/50 text-neutral-300'
                }`}>
                  {gameState === 'too-soon' ? <AlertCircle size={18} /> : null}
                  {message}
                </p>
              </motion.div>

              {/* Restart logic for game over */}
              {!isPlaying && attemptsLeft > 0 && score > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-center mt-4"
                >
                  <button
                    onClick={startGame}
                    className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-neutral-200 transition-colors"
                  >
                    Play Again ({attemptsLeft} attempts left)
                  </button>
                </motion.div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}