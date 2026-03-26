'use client'

import { useState, useEffect } from 'react'

interface TimerProps {
    isPlaying: boolean
    onTimeEnd: () => void
}

export default function Timer({ isPlaying, onTimeEnd }: TimerProps) {
    const [timeLeft, setTimeLeft] = useState(60)

    useEffect(() => {
        if (!isPlaying) {
            setTimeLeft(60)
            return
        }

        if (timeLeft <= 0) {
            onTimeEnd()
            return
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [isPlaying, timeLeft, onTimeEnd])

    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60

    return (
        <div className="text-center mb-4">
            <div className="text-4xl font-bold text-gray-800">
                {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            {isPlaying && timeLeft <= 10 && (
                <p className="text-red-500 font-bold animate-pulse">Hurry!</p>
            )}
        </div>
    )
}