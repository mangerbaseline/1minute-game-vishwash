interface ScoreDisplayProps {
    score: number
    attemptsLeft: number
}

export default function ScoreDisplay({ score, attemptsLeft }: ScoreDisplayProps) {
    return (
        <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow-sm">
            <div>
                <p className="text-sm text-gray-500">Current Score</p>
                <p className="text-3xl font-bold text-gray-900">{score}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Attempts Left</p>
                <p className="text-2xl font-bold text-blue-600">{attemptsLeft}</p>
            </div>
        </div>
    )
}