import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Button } from '../components/ui/button'
import { Target, CheckCircle, Circle, Clock } from 'lucide-react'

export default function TasksMinimal() {
  console.log('TasksMinimal component rendering...')

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
            <div className="text-2xl font-bold">0%</div>
            <Progress value={0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              0 of 0 tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Study plans in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Tasks scheduled for today</p>
          </CardContent>
        </Card>
      </div>

      {/* No Tasks Message */}
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

      {/* Sample Tasks for Demo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sample Study Plan</CardTitle>
            <Badge variant="secondary">0% Complete</Badge>
          </div>
          <Progress value={0} className="mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Button variant="ghost" size="icon">
                <Circle className="h-5 w-5" />
              </Button>
              
              <div className="flex-1">
                <p className="font-medium">Learn React Fundamentals</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">React</Badge>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    60 min
                  </div>
                  <span>Today</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Button variant="ghost" size="icon">
                <Circle className="h-5 w-5" />
              </Button>
              
              <div className="flex-1">
                <p className="font-medium">Practice JavaScript</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">JavaScript</Badge>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    45 min
                  </div>
                  <span>Tomorrow</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Button variant="ghost" size="icon">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </Button>
              
              <div className="flex-1">
                <p className="font-medium line-through text-muted-foreground">Complete HTML Basics</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">HTML</Badge>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    30 min
                  </div>
                  <span>Yesterday</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
