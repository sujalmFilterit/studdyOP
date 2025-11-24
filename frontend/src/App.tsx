import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Scheduler from './pages/Scheduler'
import Tasks from './pages/TasksTest'
import Mentor from './pages/Mentor'
import Resources from './pages/Resources'
import Analytics from './pages/AnalyticsSimple'
import Rooms from './pages/Rooms'
import Profile from './pages/Profile'
import Chat from './pages/Chat'
import Host from './pages/Host'
import Room from './pages/Room'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { Avatar, AvatarFallback } from './components/ui/avatar'
import { 
  LayoutDashboard, 
  Calendar, 
  Target, 
  MessageCircle, 
  MessageSquare,
  BookOpen, 
  TrendingUp, 
  Users,
  LogOut,
  User
} from 'lucide-react'

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { token, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }
  
  if (!token) return <Navigate to="/login" replace />
  return children
}

function Layout({ children }: { children: JSX.Element }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/scheduler', label: 'Scheduler', icon: Calendar },
    { path: '/tasks', label: 'Tasks', icon: Target },
    { path: '/mentor', label: 'AI Mentor', icon: MessageCircle },
    { path: '/chat', label: 'AI Chat', icon: MessageSquare },
    { path: '/resources', label: 'Resources', icon: BookOpen },
    { path: '/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/rooms', label: 'Study Rooms', icon: Users },
    { path: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Fixed Sidebar */}
        <aside className="w-64 border-r bg-card flex flex-col fixed left-0 top-0 h-full z-50">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-primary">StudyBuddy</h1>
            <p className="text-sm text-muted-foreground">AI-Powered Learning</p>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t bg-card">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">L{user?.level || 1}</Badge>
                  <span className="text-xs text-muted-foreground">{user?.xp || 0} XP</span>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-2"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </aside>
        
        {/* Main Content with Left Margin */}
        <main className="flex-1 ml-64 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
        <Route path="/scheduler" element={<PrivateRoute><Layout><Scheduler /></Layout></PrivateRoute>} />
        <Route path="/tasks" element={<PrivateRoute><Layout><Tasks /></Layout></PrivateRoute>} />
        <Route path="/mentor" element={<PrivateRoute><Layout><Mentor /></Layout></PrivateRoute>} />
        <Route path="/resources" element={<PrivateRoute><Layout><Resources /></Layout></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><Layout><Analytics /></Layout></PrivateRoute>} />
        <Route path="/rooms" element={<PrivateRoute><Layout><Rooms /></Layout></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><Layout><Chat /></Layout></PrivateRoute>} />
        <Route path="/host/:roomId" element={<PrivateRoute><Host /></PrivateRoute>} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}


