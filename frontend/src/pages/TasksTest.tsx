import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Input } from '../components/ui/input'
import { CheckCircle, Circle, Clock, Target, Plus, Filter, Search, Calendar, AlertCircle, Star, Trash2, ChevronDown, ChevronRight } from 'lucide-react'

type Task = {
  _id: string
  title: string
  description?: string
  subject: string
  date: string
  durationMinutes: number
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  category: string
}

type ScheduleItem = {
  _id: string
  week: number
  day: string
  subject: string
  focus: string
  duration: number
  completed: boolean
}

type Plan = {
  _id: string
  goal: string
  subjects: string[]
  deadline: string
  dailyStudyTime: number
  schedule: ScheduleItem[]
  generatedBy: 'ai' | 'fallback'
  totalWeeks: number
  totalDays: number
  createdAt: string
}

export default function TasksTest() {
  const { token, isLoading: authLoading } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    subject: '',
    durationMinutes: 60,
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: 'General'
  })
  const [collapsedPlans, setCollapsedPlans] = useState<Set<string>>(new Set())

  console.log('TasksTest component rendering...', { token, authLoading, initialLoading, error, plans })

  // Handle authentication loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  // Handle no token
  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Please log in to view tasks</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    console.log('useEffect triggered', { token })
    if (token) {
      fetchPlans()
    } else {
      setInitialLoading(false)
    }
  }, [token])

  async function fetchPlans() {
    try {
      console.log('Fetching plans...')
      const client = api(token || undefined)
      const { data } = await client.get('/plans')
      console.log('Plans fetched:', data)
      setPlans(data || [])
      setError(null)
    } catch (e) {
      console.error('Failed to fetch plans:', e)
      setError('Failed to load tasks')
      setPlans([]) // Set empty array on error
    } finally {
      setInitialLoading(false)
    }
  }

  async function toggleScheduleItem(planId: string, itemId: string) {
    setLoading(true)
    try {
      const client = api(token || undefined)
      await client.patch(`/schedule/plans/${planId}/schedule/${itemId}`, {
        completed: !plans.find(p => p._id === planId)?.schedule.find(i => i._id === itemId)?.completed
      })
      
      // Update local state
      setPlans(prev => prev.map(plan => 
        plan._id === planId 
          ? {
              ...plan,
              schedule: plan.schedule.map(item =>
                item._id === itemId 
                  ? { ...item, completed: !item.completed }
                  : item
              )
            }
          : plan
      ))
      
      // Update gamification stats
      await client.post('/gamification/complete-task', { xpGained: 10 })
    } catch (e) {
      console.error('Failed to toggle schedule item')
    } finally {
      setLoading(false)
    }
  }

  // Note: Adding/removing schedule items is handled in the Scheduler page
  // This page is for viewing and completing existing study plans

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading tasks...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading tasks</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  // Convert schedule items to tasks for display
  const allTasks = plans.flatMap(plan => 
    plan.schedule.map(item => ({
      _id: item._id,
      title: item.focus,
      subject: item.subject,
      date: item.day,
      durationMinutes: item.duration,
      completed: item.completed,
      priority: 'medium' as 'low' | 'medium' | 'high',
      category: 'Study'
    }))
  )
  const completedTasks = allTasks.filter(task => task.completed)
  const completionRate = allTasks.length ? Math.round((completedTasks.length / allTasks.length) * 100) : 0

  // Filter tasks based on search and filters
  const filteredTasks = allTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'completed' && task.completed) ||
                         (filterStatus === 'pending' && !task.completed)
    
    return matchesSearch && matchesPriority && matchesStatus
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-3 w-3" />
      case 'medium': return <Star className="h-3 w-3" />
      case 'low': return <Circle className="h-3 w-3" />
      default: return <Circle className="h-3 w-3" />
    }
  }

  const togglePlanCollapse = (planId: string) => {
    setCollapsedPlans(prev => {
      const newSet = new Set(prev)
      if (newSet.has(planId)) {
        newSet.delete(planId)
      } else {
        newSet.add(planId)
      }
      return newSet
    })
  }

  try {
    return (
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6" />
          <h2 className="text-2xl font-semibold">Study Plans & Progress</h2>
        </div>
        <Button onClick={() => window.location.href = '/scheduler'} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {completedTasks.length} of {allTasks.length} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-xs text-muted-foreground">Study plans in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allTasks.filter(task => 
                new Date(task.date).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Tasks scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allTasks.filter(task => task.priority === 'high' && !task.completed).length}
            </div>
            <p className="text-xs text-muted-foreground">Urgent tasks pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Search & Filter Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border bg-white border-gray-300 rounded-md text-sm"
              >
                <option className='bg-white' value="all">All Priorities</option>
                <option className='bg-white' value="high">High Priority</option>
                <option className='bg-white' value="medium">Medium Priority</option>
                <option className='bg-white' value="low">Low Priority</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border bg-white border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Tasks by Plan */}
      {plans.map(plan => {
        const planCompleted = plan.schedule.filter(item => item.completed).length
        const planTotal = plan.schedule.length
        const planRate = planTotal ? Math.round((planCompleted / planTotal) * 100) : 0

        return (
          <Card key={plan._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.goal}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{planRate}% Complete</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePlanCollapse(plan._id)}
                    className="h-8 w-8 hover:bg-gray-100 border border-gray-200"
                    title={collapsedPlans.has(plan._id) ? "Expand plan details" : "Collapse plan details"}
                  >
                    {collapsedPlans.has(plan._id) ? (
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    )}
                  </Button>
                </div>
              </div>
              <Progress value={planRate} className="mt-2" />
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <span>Subjects: {plan.subjects.join(', ')}</span>
                <span>Due: {new Date(plan.deadline).toLocaleDateString()}</span>
                <span>{plan.dailyStudyTime} min/day</span>
              </div>
            </CardHeader>
            {!collapsedPlans.has(plan._id) && (
              <CardContent>
                <div className="space-y-3">
                  {plan.schedule.map(item => (
                    <div key={item._id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleScheduleItem(plan._id, item._id)}
                        disabled={loading}
                      >
                        {item.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </Button>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {item.focus}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            Week {item.week}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{item.subject}</Badge>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.duration} min
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.day).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}

      {plans.length === 0 && !error && (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No study plans yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first AI study plan to get started
            </p>
            <Button onClick={() => window.location.href = '/scheduler'}>Create Study Plan</Button>
          </CardContent>
        </Card>
      )}

      {/* Debug information */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs space-y-1">
            <p>Token: {token ? 'Present' : 'Missing'}</p>
            <p>Loading: {initialLoading ? 'Yes' : 'No'}</p>
            <p>Error: {error || 'None'}</p>
            <p>Plans: {plans.length}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
  } catch (error) {
    console.error('Error rendering TasksTest component:', error)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error rendering tasks page</p>
          <p className="text-sm text-muted-foreground">Please refresh the page</p>
        </div>
      </div>
    )
  }
}
