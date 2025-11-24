import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { 
  User, 
  Mail, 
  Award, 
  Flame, 
  Target, 
  Calendar,
  Edit,
  Save,
  X
} from 'lucide-react'

type Stats = {
  streak: number
  xp: number
  level: number
  totalTasks: number
  completedTasks: number
  completionRate: number
}

export default function Profile() {
  const { user, token } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) {
      fetchStats()
    }
  }, [token])

  async function fetchStats() {
    try {
      const client = api(token || undefined)
      const { data } = await client.get('/gamification/stats')
      setStats(data)
    } catch (e) {
      console.error('Failed to fetch stats')
    }
  }

  async function updateProfile() {
    setLoading(true)
    try {
      const client = api(token || undefined)
      await client.put('/auth/profile', { name, email })
      // Update local user state
      alert('Profile updated successfully!')
      setIsEditing(false)
    } catch (e) {
      console.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const xpToNextLevel = stats ? (stats.level * 100) - stats.xp : 0
  const xpProgress = stats ? (stats.xp % 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <User className="h-6 w-6" />
        <h2 className="text-2xl font-semibold">Profile</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{user?.name}</h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <Badge variant="outline" className="mt-1">
                    {user?.role === 'admin' ? 'Administrator' : 'Student'}
                  </Badge>
                </div>
              </div>

              {isEditing && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={updateProfile} disabled={loading}>
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          Save Changes
                        </div>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Study Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Study Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats?.totalTasks || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Tasks</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats?.completedTasks || 0}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats?.completionRate || 0}%</div>
                  <div className="text-sm text-muted-foreground">Completion Rate</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats?.streak || 0}</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Level & Progress */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Level Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">L{stats?.level || 1}</div>
                <div className="text-sm text-muted-foreground">Current Level</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>XP Progress</span>
                  <span>{stats?.xp || 0} / {stats?.level ? stats.level * 100 : 100} XP</span>
                </div>
                <Progress value={xpProgress} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">
                  {xpToNextLevel} XP to next level
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>{stats?.streak || 0} day streak</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Study session completed</div>
                    <div className="text-xs text-muted-foreground">2 hours ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">New study plan created</div>
                    <div className="text-xs text-muted-foreground">1 day ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Level up achieved!</div>
                    <div className="text-xs text-muted-foreground">3 days ago</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
