import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Target, Clock, Award, Users } from 'lucide-react'

type Stats = {
  streak: number
  xp: number
  level: number
  totalTasks: number
  completedTasks: number
  completionRate: number
}

export default function AnalyticsSimple() {
  const { token } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  console.log('AnalyticsSimple component rendering...')

  useEffect(() => {
    if (token) {
      fetchAnalytics()
    }
  }, [token])

  async function fetchAnalytics() {
    try {
      console.log('Fetching analytics...')
      const client = api(token || undefined)
      const [statsRes, plansRes] = await Promise.all([
        client.get('/gamification/stats'),
        client.get('/plans')
      ])
      
      console.log('Analytics data fetched:', { stats: statsRes.data, plans: plansRes.data })
      setStats(statsRes.data)
      setPlans(plansRes.data)
      setError(null)
    } catch (e) {
      console.error('Failed to fetch analytics:', e)
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

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

  // Process data for charts
  const allTasks = plans.flatMap(plan => plan.tasks || [])
  const subjectData = allTasks.reduce((acc, task) => {
    const subject = task.subject || 'Unknown'
    if (!acc[subject]) {
      acc[subject] = { completed: 0, total: 0 }
    }
    acc[subject].total++
    if (task.completed) acc[subject].completed++
    return acc
  }, {} as Record<string, { completed: number; total: number }>)

  const subjectChartData = (Object.entries(subjectData) as [string, { completed: number; total: number }][]).map(([subject, data]) => ({
    subject,
    completed: data.completed,
    pending: data.total - data.completed,
    completionRate: Math.round((data.completed / data.total) * 100)
  }))

  // Weekly data for line chart
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dayTasks = allTasks.filter(task => {
      const taskDate = new Date(task.date)
      return taskDate.toDateString() === date.toDateString()
    })
    
    return {
      day: date.toLocaleDateString('en', { weekday: 'short' }),
      completed: dayTasks.filter(task => task.completed).length,
      total: dayTasks.length
    }
  })

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
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTasks || 0}</div>
            <p className="text-xs text-muted-foreground">total tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Simple Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#00C49F" strokeWidth={2} />
                <Line type="monotone" dataKey="total" stroke="#8884D8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectChartData.length > 0 ? (
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-lg font-semibold mb-2">No subject data yet</p>
                <p className="text-sm">Complete some tasks to see your subject performance</p>
              </div>
            )}
          </CardContent>
        </Card>

        {subjectChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Subject Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subjectChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#00C49F" />
                  <Bar dataKey="pending" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg font-semibold mb-2">No leaderboard data yet</p>
            <p className="text-sm">Complete more tasks to see your ranking</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
