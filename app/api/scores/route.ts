import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '../../lib/mongodb'

export async function GET(request: NextRequest) {
    try {
        const { db } = await connectToDatabase()
        const searchParams = request.nextUrl.searchParams
        const period = searchParams.get('period') || 'daily'

        let dateFilter = {}
        const now = new Date()

        if (period === 'daily') {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            dateFilter = { createdAt: { $gte: today } }
        } else if (period === 'weekly') {
            const weekAgo = new Date(now)
            weekAgo.setDate(now.getDate() - 7)
            dateFilter = { createdAt: { $gte: weekAgo } }
        } else if (period === 'monthly') {
            const monthAgo = new Date(now)
            monthAgo.setMonth(now.getMonth() - 1)
            dateFilter = { createdAt: { $gte: monthAgo } }
        }

        const scores = await db
            .collection('scores')
            .find(dateFilter)
            .sort({ score: -1 })
            .limit(50)
            .toArray()

        return NextResponse.json(scores)
    } catch (error) {
        console.error('Error fetching scores:', error)
        return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { db } = await connectToDatabase()
        const { score, type, userName } = await request.json()

        // Check if user exists or create new user
        let user = await db.collection('users').findOne({
            name: userName || 'Anonymous'
        })

        if (!user) {
            const result = await db.collection('users').insertOne({
                name: userName || 'Anonymous',
                referralCode: Math.random().toString(36).substring(7),
                createdAt: new Date(),
                attempts: []
            })
            user = { _id: result.insertedId, name: userName || 'Anonymous' }
        }

        // Save the score
        const newScore = {
            userId: user._id,
            userName: user.name,
            score,
            type: type || 'daily',
            createdAt: new Date(),
        }

        await db.collection('scores').insertOne(newScore)

        // Update user attempts for today
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $push: {
                    attempts: {
                        date: today,
                        score: score
                    }
                } as any
            }
        )

        return NextResponse.json(newScore)
    } catch (error) {
        console.error('Error saving score:', error)
        return NextResponse.json({ error: 'Failed to save score' }, { status: 500 })
    }
}