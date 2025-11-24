import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { ScheduleDisplay } from '../components/ScheduleDisplay'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog'
import { 
  Calendar, 
  Target, 
  Clock, 
  BookOpen, 
  Sparkles, 
  CheckCircle, 
  Save, 
  RefreshCw,
  TrendingUp,
  Brain,
  Zap,
  Loader2,
  Trash2,
  Edit,
  MoreHorizontal
} from 'lucide-react'

interface ScheduleItem {
  _id?: string;
  week: number;
  day: string;
  subject: string;
  focus: string;
  duration: number;
  completed?: boolean;
}

interface StudyPlan {
  _id: string;
  goal: string;
  subjects: string[];
  deadline: string;
  dailyStudyTime: number;
  schedule: ScheduleItem[];
  generatedBy: 'ai' | 'fallback';
  totalWeeks: number;
  totalDays: number;
  createdAt: string;
}

export default function Scheduler() {
  const { token } = useAuth()
  const [goal, setGoal] = useState('Master React fundamentals in 30 days')
  const [subjects, setSubjects] = useState('React, JavaScript, HTML, CSS')
  const [deadline, setDeadline] = useState(() => new Date(Date.now() + 1000*60*60*24*30).toISOString().slice(0,10))
  const [dailyStudyTime, setDailyStudyTime] = useState(120)
  const [generatedPlan, setGeneratedPlan] = useState<StudyPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showAllSessions, setShowAllSessions] = useState(false)
  const [savedPlans, setSavedPlans] = useState<StudyPlan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)

  // Fetch saved plans on component mount
  useEffect(() => {
    if (token) {
      fetchSavedPlans()
    }
  }, [token])

  async function fetchSavedPlans() {
    setLoadingPlans(true)
    try {
      const client = api(token || undefined)
      const { data } = await client.get('/plans')
      setSavedPlans(data || [])
    } catch (e) {
      console.error('Failed to fetch saved plans:', e)
    } finally {
      setLoadingPlans(false)
    }
  }

  async function generateSchedule() {
    setLoading(true)
    setError(null)
    setShowAllSessions(false)
    
    const requestData = {
      goal,
      subjects: subjects.split(',').map(s=>s.trim()).filter(Boolean),
      deadline,
      dailyStudyTime: Number(dailyStudyTime)
    }
    
    console.log('Sending AI schedule request:', requestData)
    
    try {
      const client = api(token || undefined)
      console.log('API client created, making request...')
      
      const response = await client.post('/schedule/generate-schedule', requestData)
      console.log('AI Schedule response received:', response.data)
      
      if (response.data?.success && response.data?.plan) {
        setGeneratedPlan(response.data.plan)
        console.log('Plan set:', response.data.plan)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (e: any) {
      console.error('AI Schedule generation error:', e)
      console.error('Error response:', e?.response?.data)
      setError(e?.response?.data?.message || e?.message || 'AI schedule generation failed')
    } finally {
      setLoading(false)
    }
  }

  async function savePlan() {
    if (!generatedPlan) return
    setSaving(true)
    try {
      const client = api(token || undefined)
      const payload = {
        goal: generatedPlan.goal,
        subjects: generatedPlan.subjects,
        deadline: generatedPlan.deadline,
        dailyStudyTime: generatedPlan.dailyStudyTime,
        schedule: generatedPlan.schedule,
        generatedBy: generatedPlan.generatedBy,
        totalWeeks: generatedPlan.totalWeeks,
        totalDays: generatedPlan.totalDays
      }
      
      console.log('Saving plan with payload:', payload)
      const response = await client.post('/plans', payload)
      console.log('Plan saved successfully:', response.data)
      
      // Clear the generated plan and refresh saved plans
      setGeneratedPlan(null)
      await fetchSavedPlans() // Refresh the saved plans list
      
      // Show success message with navigation options
      const shouldViewPlans = confirm('🎉 AI Study Plan saved successfully!\n\nWould you like to view your saved plans in the Tasks page?')
      if (shouldViewPlans) {
        // Navigate to tasks page (you can implement navigation here)
        window.location.href = '/tasks'
      }
      
    } catch (e: any) {
      console.error('Failed to save plan:', e)
      const errorMessage = e?.response?.data?.message || e?.message || 'Failed to save plan'
      alert(`❌ Error saving plan: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCompletion = async (itemId: string, completed: boolean) => {
    if (!generatedPlan) return
    
    try {
      const client = api(token || undefined)
      await client.patch(`/schedule/plans/${generatedPlan._id}/schedule/${itemId}`, {
        completed
      })
      
      // Update local state
      setGeneratedPlan(prev => {
        if (!prev) return null
        return {
          ...prev,
          schedule: prev.schedule.map(item => 
            item._id === itemId ? { ...item, completed } : item
          )
        }
      })
    } catch (error) {
      console.error('Failed to update completion:', error)
    }
  }


  const handleManagePlan = (planId: string) => {
    // Navigate to tasks page with the specific plan
    window.location.href = `/tasks?plan=${planId}`
  }

  const totalHours = generatedPlan ? Math.round(generatedPlan.schedule.reduce((sum, item) => sum + item.duration, 0) / 60) : 0
  const daysUntilDeadline = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            AI Study Scheduler
          </h2>
          <p className="text-muted-foreground mt-2">
            Let AI create a personalized study plan tailored to your goals and schedule
          </p>
        </div>
        {generatedPlan && (
          <Button onClick={savePlan} disabled={saving} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
            {saving ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Plan
              </div>
            )}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          <Card className="border-2 border-dashed border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Study Goals & Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Learning Goal
                </label>
                <Input
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., Master React fundamentals in 30 days"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Be specific about what you want to achieve
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Subjects to Study
                </label>
                <Input
                  value={subjects}
                  onChange={(e) => setSubjects(e.target.value)}
                  placeholder="e.g., React, JavaScript, HTML, CSS"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple subjects with commas
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Deadline
                  </label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Daily Study Time
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={dailyStudyTime}
                      onChange={(e) => setDailyStudyTime(Number(e.target.value))}
                      className="h-11 pr-12"
                      min="30"
                      max="480"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      min
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <Button 
                onClick={generateSchedule} 
                disabled={loading || !goal.trim() || !subjects.trim()}
                className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI is generating your schedule...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate AI Schedule
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {generatedPlan && (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Total Hours</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{totalHours}h</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Days Left</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{daysUntilDeadline}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Schedule Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Generated Schedule
                {generatedPlan && (
                  <Badge variant="secondary" className="ml-auto">
                    {generatedPlan.totalDays} sessions
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!generatedPlan ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Brain className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No schedule generated yet</h3>
                  <p className="text-muted-foreground">
                    Fill in your goals and click "Generate AI Schedule" to create your personalized study plan
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="max-h-[500px] overflow-auto space-y-2">
                    {(showAllSessions ? generatedPlan.schedule : generatedPlan.schedule.slice(0, 10)).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.focus}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {item.subject}
                            </Badge>
                            <span>•</span>
                            <span>{item.day}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.duration} min
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    ))}
                    {generatedPlan.schedule.length > 10 && !showAllSessions && (
                      <div className="text-center py-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowAllSessions(true)}
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          ... and {generatedPlan.schedule.length - 10} more sessions
                        </Button>
                      </div>
                    )}
                    {showAllSessions && generatedPlan.schedule.length > 10 && (
                      <div className="text-center py-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowAllSessions(false)}
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          Show less
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Schedule Summary</span>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {generatedPlan.totalDays} sessions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {totalHours}h total
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full Schedule Display */}
      {generatedPlan && (
        <div className="mt-8">
          <ScheduleDisplay 
            plan={generatedPlan} 
            onUpdateCompletion={handleUpdateCompletion}
          />
        </div>
      )}

      {/* Saved Plans Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Your Saved Study Plans
              {savedPlans.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {savedPlans.length} plan{savedPlans.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPlans ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground">Loading saved plans...</span>
                </div>
              </div>
            ) : savedPlans.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No saved plans yet</h3>
                <p className="text-muted-foreground">
                  Generate and save your first AI study plan to get started
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedPlans.map((plan) => (
                  <Card key={plan._id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base line-clamp-2">{plan.goal}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {plan.generatedBy === 'ai' ? 'AI' : 'Fallback'}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleManagePlan(plan._id)}
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                              title="Manage Plan"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                  title="Delete Plan"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Study Plan</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{plan.goal}"? This action cannot be undone and will permanently remove this study plan and all its associated tasks.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={async () => {
                                      try {
                                        const client = api(token || undefined)
                                        await client.delete(`/plans/${plan._id}`)
                                        
                                        // Refresh the saved plans list
                                        await fetchSavedPlans()
                                        
                                      } catch (error: any) {
                                        console.error('Failed to delete plan:', error)
                                        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete plan'
                                        alert(`❌ Error deleting plan: ${errorMessage}`)
                                      }
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete Plan
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BookOpen className="h-3 w-3" />
                          <span>{plan.subjects.join(', ')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Due: {new Date(plan.deadline).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{plan.dailyStudyTime} min/day</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Target className="h-3 w-3" />
                          <span>{plan.totalDays} sessions</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Created {new Date(plan.createdAt).toLocaleDateString()}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.href = '/tasks'}
                            className="text-xs"
                          >
                            View Tasks
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}