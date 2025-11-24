import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Target, Clock, Award, Users } from 'lucide-react'

type Stats = {
  streak: number
  xp: number
  level: number
  totalTasks: number
  completedTasks: number
  completionRate: number
}

type LeaderboardUser = {
  _id: string
  name: string
  xp: number
  level: number
  streak: number
}

type Plan = {
  _id: string
  goal: string
  tasks: Array<{
    subject: string
    completed: boolean
    date: string
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function Analytics() {
  const { token } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  console.log('Analytics component rendering...')

  useEffect(() => {
    if (token) {
      fetchAnalytics()
    }
  }, [token])

  async function fetchAnalytics() {
    try {
      console.log('Fetching analytics...')
      const client = api(token || undefined)
      const [statsRes, leaderboardRes, plansRes] = await Promise.all([
        client.get('/gamification/stats'),
        client.get('/gamification/leaderboard'),
        client.get('/plans')
      ])
      
      console.log('Analytics data fetched:', { stats: statsRes.data, leaderboard: leaderboardRes.data, plans: plansRes.data })
      setStats(statsRes.data)
      setLeaderboard(leaderboardRes.data)
      setPlans(plansRes.data)
      setError(null)
    } catch (e) {
      console.error('Failed to fetch analytics:', e)
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  // Process data for charts
  const subjectData = plans.reduce((acc, plan) => {
    plan.tasks.forEach(task => {
      const subject = task.subject
      if (!acc[subject]) {
        acc[subject] = { completed: 0, total: 0 }
      }
      acc[subject].total++
      if (task.completed) acc[subject].completed++
    })
    return acc
  }, {} as Record<string, { completed: number; total: number }>)

  const subjectChartData = Object.entries(subjectData).map(([subject, data]) => ({
    subject,
    completed: data.completed,
    pending: data.total - data.completed,
    completionRate: Math.round((data.completed / data.total) * 100)
  }))

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dayTasks = plans.flatMap(plan => plan.tasks).filter(task => {
      const taskDate = new Date(task.date)
      return taskDate.toDateString() === date.toDateString()
    })
    
    return {
      day: date.toLocaleDateString('en', { weekday: 'short' }),
      completed: dayTasks.filter(task => task.completed).length,
      total: dayTasks.length
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading analytics</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  const pieData = [
    { name: 'Completed', value: stats?.completedTasks || 0, color: '#00C49F' },
    { name: 'Pending', value: (stats?.totalTasks || 0) - (stats?.completedTasks || 0), color: '#FF8042' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6" />
        <h2 className="text-2xl font-semibold">Analytics & Insights</h2>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.level || 1}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.xp || 0} XP
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.streak || 0}</div>
            <p className="text-xs text-muted-foreground">days in a row</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completionRate || 0}%</div>
            <Progress value={stats?.completionRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              #{leaderboard.findIndex(user => user._id === 'current-user') + 1 || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">on leaderboard</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <p className="text-2xl font-bold mb-2">Weekly Progress</p>
                    <p className="text-sm">Chart will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <p className="text-2xl font-bold mb-2">{stats?.completedTasks || 0}</p>
                    <p className="text-sm">Completed Tasks</p>
                    <p className="text-2xl font-bold mt-4">{(stats?.totalTasks || 0) - (stats?.completedTasks || 0)}</p>
                    <p className="text-sm">Pending Tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subjectChartData.map((data) => (
                  <div key={data.subject} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{data.subject}</span>
                      <Badge variant="secondary">{data.completionRate}%</Badge>
                    </div>
                    <Progress value={data.completionRate} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{data.completed} completed</span>
                      <span>{data.pending} pending</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {subjectChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Subject Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center">
                    <p className="text-lg font-semibold">Subject Comparison Chart</p>
                    <p className="text-sm">Bar chart will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((user, index) => (
                  <div key={user._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">Level {user.level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{user.xp} XP</p>
                      <p className="text-sm text-muted-foreground">{user.streak} day streak</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
