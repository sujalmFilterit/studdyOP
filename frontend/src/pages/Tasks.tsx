import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { CheckCircle, Circle, Clock, Target, Trash2 } from 'lucide-react'

type Task = {
  _id: string
  title: string
  subject: string
  date: string
  durationMinutes: number
  completed: boolean
}

type Plan = {
  _id: string
  goal: string
  tasks: Task[]
}

export default function Tasks() {
  const { token } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  console.log('Tasks component rendering...')

  useEffect(() => {
    if (token) {
      fetchPlans()
    }
  }, [token])

  async function fetchPlans() {
    try {
      console.log('Fetching plans...')
      const client = api(token || undefined)
      const { data } = await client.get('/plans')
      console.log('Plans fetched:', data)
      
      // Transform schedule items to tasks format
      const transformedPlans = (data || []).map((plan: any) => ({
        ...plan,
        tasks: plan.schedule?.map((item: any) => ({
          _id: item._id,
          title: item.focus,
          subject: item.subject,
          date: item.day,
          durationMinutes: item.duration,
          completed: item.completed || false
        })) || plan.tasks || []
      }))
      
      setPlans(transformedPlans)
      setError(null)
    } catch (e) {
      console.error('Failed to fetch plans:', e)
      setError('Failed to load tasks')
    } finally {
      setInitialLoading(false)
    }
  }

  async function toggleTask(planId: string, taskId: string) {
    setLoading(true)
    try {
      const client = api(token || undefined)
      await client.patch(`/tasks/${planId}/${taskId}/toggle`)
      
      // Update local state
      setPlans(prev => prev.map(plan => 
        plan._id === planId 
          ? {
              ...plan,
              tasks: plan.tasks.map(task =>
                task._id === taskId 
                  ? { ...task, completed: !task.completed }
                  : task
              )
            }
          : plan
      ))
      
      // Update gamification stats
      await client.post('/gamification/complete-task', { xpGained: 10 })
    } catch (e) {
      console.error('Failed to toggle task')
    } finally {
      setLoading(false)
    }
  }

  async function deleteTask(planId: string, taskId: string) {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }

    setLoading(true)
    try {
      const client = api(token || undefined)
      await client.delete(`/tasks/${planId}/${taskId}`)
      
      // Update local state - remove the task
      setPlans(prev => prev.map(plan => 
        plan._id === planId 
          ? {
              ...plan,
              tasks: plan.tasks.filter(task => task._id !== taskId)
            }
          : plan
      ))
    } catch (e) {
      console.error('Failed to delete task:', e)
      setError('Failed to delete task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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

  const allTasks = plans.flatMap(plan => plan.tasks)
  const completedTasks = allTasks.filter(task => task.completed)
  const completionRate = allTasks.length ? Math.round((completedTasks.length / allTasks.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Target className="h-6 w-6" />
        <h2 className="text-2xl font-semibold">Tasks & Progress</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      {/* Tasks by Plan */}
      {plans.map(plan => {
        const planCompleted = plan.tasks.filter(task => task.completed).length
        const planTotal = plan.tasks.length
        const planRate = planTotal ? Math.round((planCompleted / planTotal) * 100) : 0

        return (
          <Card key={plan._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.goal}</CardTitle>
                <Badge variant="secondary">{planRate}% Complete</Badge>
              </div>
              <Progress value={planRate} className="mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plan.tasks.map(task => (
                  <div key={task._id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleTask(plan._id, task._id)}
                      disabled={loading}
                    >
                      {task.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </Button>
                    
                    <div className="flex-1">
                      <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{task.subject}</Badge>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.durationMinutes} min
                        </div>
                        <span>{new Date(task.date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTask(plan._id, task._id)}
                      disabled={loading}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {plans.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
            <p className="text-muted-foreground mb-4">
              Create a study plan to get started with your tasks
            </p>
            <Button>Go to Scheduler</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
