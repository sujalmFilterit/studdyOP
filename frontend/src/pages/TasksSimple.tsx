import { Target, Plus, CheckCircle, Circle, Clock, Calendar } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'

export default function TasksSimple() {
  console.log('TasksSimple component rendering...')

  // Sample data for demonstration
  const sampleTasks = [
    {
      id: '1',
      title: 'Learn React Fundamentals',
      subject: 'React',
      duration: 60,
      completed: false,
      priority: 'high',
      date: new Date().toISOString()
    },
    {
      id: '2', 
      title: 'Practice JavaScript',
      subject: 'JavaScript',
      duration: 45,
      completed: true,
      priority: 'medium',
      date: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Complete HTML Basics',
      subject: 'HTML',
      duration: 30,
      completed: false,
      priority: 'low',
      date: new Date().toISOString()
    }
  ]

  const completedTasks = sampleTasks.filter(task => task.completed).length
  const totalTasks = sampleTasks.length
  const completionRate = Math.round((completedTasks / totalTasks) * 100)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6" />
          <h2 className="text-2xl font-semibold">Tasks & Progress</h2>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
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
              {completedTasks} of {totalTasks} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Study plans in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">Tasks scheduled for today</p>
          </CardContent>
        </Card>
      </div>

      {/* Sample Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sample Study Plan</CardTitle>
            <Badge variant="secondary">{completionRate}% Complete</Badge>
          </div>
          <Progress value={completionRate} className="mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sampleTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <Button variant="ghost" size="icon">
                  {task.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </Button>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </p>
                    <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">{task.subject}</Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.duration} min
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(task.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}