'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Timer from './Timer'
import ScoreDisplay from './ScoreDisplay'

type GameState = 'waiting' | 'active' | 'too-soon'

export default function Game() {
    const [gameState, setGameState] = useState<GameState>('waiting')
    const [score, setScore] = useState(0)
    const [attemptsLeft, setAttemptsLeft] = useState(3)
    const [isPlaying, setIsPlaying] = useState(false)
    const [message, setMessage] = useState('Click to start!')

    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
    const startTimeRef = useRef<number>(0)

    const startGame = useCallback(() => {
        if (attemptsLeft === 0) {
            setMessage('No attempts left! Come back tomorrow.')
            return
        }

        setIsPlaying(true)
        setGameState('waiting')
        setScore(0)
        setMessage('Wait for green...')

        // Random delay between 1-5 seconds
        const delay = Math.random() * 4000 + 1000

        timeoutRef.current = setTimeout(() => {
            setGameState('active')
            startTimeRef.current = Date.now()
            setMessage('CLICK NOW!')
        }, delay)
    }, [attemptsLeft])

    const handleClick = useCallback(() => {
        if (!isPlaying) return

        if (gameState === 'waiting') {
            // Clicked too early
            clearTimeout(timeoutRef.current)
            setGameState('too-soon')
            setMessage('Too soon! Game over.')
            setIsPlaying(false)
            setAttemptsLeft(prev => prev - 1)
            return
        }

        if (gameState === 'active') {
            // Calculate reaction time
            const reactionTime = Date.now() - startTimeRef.current
            const points = Math.max(0, Math.floor(1000 / reactionTime) * 100)

            setScore(prev => prev + points)
            setMessage(`+${points} points! (${reactionTime}ms)`)

            // Next round
            clearTimeout(timeoutRef.current)

            const delay = Math.random() * 3000 + 1000
            timeoutRef.current = setTimeout(() => {
                setGameState('active')
                startTimeRef.current = Date.now()
                setMessage('CLICK NOW!')
            }, delay)

            setGameState('waiting')
        }
    }, [gameState, isPlaying])

    const endGame = useCallback(() => {
        if (isPlaying) {
            clearTimeout(timeoutRef.current)
            setIsPlaying(false)

            // Save score
            fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score, type: 'daily' }),
            })

            setMessage(`Game over! Final score: ${score}`)
        }
    }, [isPlaying, score])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [])

    return (
        <div className="max-w-md mx-auto p-4">
            <div className="mb-6 text-center">
                <ScoreDisplay score={score} attemptsLeft={attemptsLeft} />
                <Timer isPlaying={isPlaying} onTimeEnd={endGame} />
            </div>

            <button
                onClick={isPlaying ? handleClick : startGame}
                className={`game-button ${gameState === 'active' ? 'active' : gameState === 'too-soon' ? 'too-soon' : 'waiting'}`}
                disabled={attemptsLeft === 0 && !isPlaying}
            >
                {!isPlaying && attemptsLeft > 0 && 'Start Game'}
                {!isPlaying && attemptsLeft === 0 && 'No Attempts Left'}
                {isPlaying && gameState === 'waiting' && 'Wait for green...'}
                {isPlaying && gameState === 'active' && 'CLICK!'}
                {isPlaying && gameState === 'too-soon' && 'Too Soon!'}
            </button>

            {message && (
                <p className="text-center mt-4 text-gray-600">{message}</p>
            )}
        </div>
    )
}