import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
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
} from "../components/ui/alert-dialog";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import {
  TrendingUp,
  Target,
  Clock,
  Award,
  Flame,
  BookOpen,
  MessageCircle,
  Users,
  Plus,
  Brain,
  Trophy,
  Gamepad2,
  Settings,
  Copy,
  Trash2,
  Square,
  Edit,
  ChevronDown,
} from "lucide-react";

type Task = {
  _id: string;
  title: string;
  subject: string;
  date: string;
  durationMinutes: number;
  completed: boolean;
};
type Plan = { _id: string; goal: string; tasks: Task[] };
type Reminder = { _id: string; message: string; scheduledAt: string };
type Room = {
  room_id: string;
  name: string;
  status: "active" | "ended";
  created_at: string;
};
type Stats = {
  streak: number;
  xp: number;
  level: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
};

export default function Dashboard() {
  const { token } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editRoomName, setEditRoomName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [roomToEnd, setRoomToEnd] = useState<string | null>(null);

  console.log("Dashboard component rendering...");

  useEffect(() => {
    console.log("Dashboard useEffect running...");
    const client = api(token || undefined);

    // Load data with individual error handling
    const loadData = async () => {
      try {
        // Load plans
        try {
          const plansRes = await client.get("/plans");
          setPlans(plansRes.data || []);
        } catch (err) {
          console.warn(
            "Failed to load plans:",
            err instanceof Error ? err.message : String(err)
          );
          setPlans([]);
        }

        // Load reminders
        try {
          const remindersRes = await client.get("/reminders");
          setReminders(remindersRes.data || []);
        } catch (err) {
          console.warn(
            "Failed to load reminders:",
            err instanceof Error ? err.message : String(err)
          );
          setReminders([]);
        }

        // Load stats
        try {
          const statsRes = await client.get("/gamification/stats");
          setStats(
            statsRes.data || {
              streak: 0,
              xp: 0,
              level: 1,
              totalTasks: 0,
              completedTasks: 0,
              completionRate: 0,
            }
          );
        } catch (err) {
          console.warn(
            "Failed to load stats:",
            err instanceof Error ? err.message : String(err)
          );
          setStats({
            streak: 0,
            xp: 0,
            level: 1,
            totalTasks: 0,
            completedTasks: 0,
            completionRate: 0,
          });
        }

        // Load rooms
        try {
          const roomsRes = await client.get("/rooms");
          setRooms(roomsRes.data || []);
        } catch (err) {
          console.warn(
            "Failed to load rooms:",
            err instanceof Error ? err.message : String(err)
          );
          setRooms([]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Dashboard data loading error:", err);
        setError("Network error - some features may not work properly");
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  async function createRoom() {
    if (!newRoomName.trim()) return;

    setCreatingRoom(true);
    setError(null); // Clear any previous errors
    try {
      console.log("Creating room with name:", newRoomName.trim());
      console.log("Token available:", !!token);

      const client = api(token || undefined);
      const response = await client.post("/rooms", {
        name: newRoomName.trim(),
      });

      console.log("Room created successfully:", response.data);
      setRooms((prev) => [response.data, ...prev]);
      setNewRoomName("");
    } catch (error) {
      console.error("Failed to create room:", error);
      const axiosError = error as any;
      console.error("Error details:", {
        message: axiosError?.message,
        response: axiosError?.response?.data,
        status: axiosError?.response?.status,
        statusText: axiosError?.response?.statusText,
      });

      let errorMessage = "Failed to create room. ";
      if (axiosError?.response?.status === 401) {
        errorMessage += "Authentication failed. Please log in again.";
      } else if (axiosError?.response?.status === 500) {
        errorMessage += "Server error. Please try again.";
      } else if (axiosError?.code === "ECONNREFUSED") {
        errorMessage +=
          "Cannot connect to server. Please check if the backend is running.";
      } else {
        errorMessage +=
          axiosError?.response?.data?.error ||
          axiosError?.message ||
          "Unknown error.";
      }

      setError(errorMessage);
    } finally {
      setCreatingRoom(false);
    }
  }

  const copyRoomLink = (roomId: string) => {
    const roomLink = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard
      .writeText(roomLink)
      .then(() => {
        alert("Room link copied to clipboard!");
      })
      .catch(() => {
        alert("Failed to copy link");
      });
  };

  const openDeleteDialog = (roomId: string) => {
    setRoomToDelete(roomId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;

    try {
      const client = api(token || undefined);
      await client.delete(`/rooms/${roomToDelete}`);
      setRooms((prev) => prev.filter((room) => room.room_id !== roomToDelete));
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    } catch (err) {
      console.error("Failed to delete room:", err);
      alert("Failed to delete room");
    }
  };

  const openEndDialog = (roomId: string) => {
    setRoomToEnd(roomId);
    setEndDialogOpen(true);
  };

  const confirmEndRoom = async () => {
    if (!roomToEnd) return;

    try {
      const client = api(token || undefined);
      await client.patch(`/rooms/${roomToEnd}/end`);
      setRooms((prev) =>
        prev.map((room) =>
          room.room_id === roomToEnd ? { ...room, status: "ended" } : room
        )
      );
      setEndDialogOpen(false);
      setRoomToEnd(null);
    } catch (err) {
      console.error("Failed to end room:", err);
      alert("Failed to end room");
    }
  };

  const startEditRoom = (roomId: string, currentName: string) => {
    setEditingRoom(roomId);
    setEditRoomName(currentName);
  };

  const saveRoomName = async (roomId: string) => {
    if (!editRoomName.trim()) return;

    try {
      const client = api(token || undefined);
      await client.patch(`/rooms/${roomId}`, { name: editRoomName });
      setEditingRoom(null);
      setEditRoomName("");
      setRooms((prev) =>
        prev.map((room) =>
          room.room_id === roomId ? { ...room, name: editRoomName } : room
        )
      );
    } catch (err) {
      console.error("Failed to update room name:", err);
      alert("Failed to update room name");
    }
  };

  const cancelEditRoom = () => {
    setEditingRoom(null);
    setEditRoomName("");
  };

  const chartData = useMemo(() => {
    // Simplified data processing to avoid complex calculations
    const subjectRows: Array<{
      subject: string;
      total: number;
      done: number;
      pct: number;
    }> = [];
    const overall = { total: 0, done: 0, pct: 0 };
    return { subjectRows, overall };
  }, [plans]);

  const pieData = [
    { name: "Completed", value: stats?.completedTasks || 0, color: "#00C49F" },
    {
      name: "Pending",
      value: (stats?.totalTasks || 0) - (stats?.completedTasks || 0),
      color: "#FF8042",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading dashboard</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Welcome back!</h2>
          <p className="text-muted-foreground">
            Here's your study progress overview
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/scheduler">New Schedule</Link>
          </Button>
          <Button asChild>
            <Link to="/tasks">View Tasks</Link>
          </Button>
        </div>
      </div>

      {/* Gamification Stats */}
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
            <p className="text-xs text-muted-foreground">{stats?.xp || 0} XP</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4" />
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
              <Target className="h-4 w-4" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chartData.overall.pct}%</div>
            <Progress value={chartData.overall.pct} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {chartData.overall.done} / {chartData.overall.total} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-xs text-muted-foreground">study plans</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Subject Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.subjectRows.map((r) => (
                <div key={r.subject} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{r.subject}</span>
                    <Badge variant="secondary">{r.pct}%</Badge>
                  </div>
                  <Progress value={r.pct} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{r.done} completed</span>
                    <span>{r.total - r.done} pending</span>
                  </div>
                </div>
              ))}
              {chartData.subjectRows.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No data yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Task Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              <div className="text-center">
                <p className="text-2xl font-bold mb-2">
                  {stats?.completedTasks || 0}
                </p>
                <p className="text-sm">Completed Tasks</p>
                <p className="text-2xl font-bold mt-4">
                  {(stats?.totalTasks || 0) - (stats?.completedTasks || 0)}
                </p>
                <p className="text-sm">Pending Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">AI Mentor</h3>
                <p className="text-sm text-muted-foreground">
                  Get help with your studies
                </p>
              </div>
            </div>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link to="/mentor">Chat with AI</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Resources</h3>
                <p className="text-sm text-muted-foreground">
                  AI-curated learning materials
                </p>
              </div>
            </div>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link to="/resources">Browse Resources</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Track your progress
                </p>
              </div>
            </div>
            <Button asChild className="w-full mt-4" variant="outline">
              <Link to="/analytics">View Analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Rooms */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Quiz Rooms
            </CardTitle>
            <Button
              onClick={createRoom}
              disabled={creatingRoom || !newRoomName.trim()}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {creatingRoom ? "Creating..." : "Create Room"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Create Room Form */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter room name..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="flex-1 px-3 py-2 border bg-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === "Enter" && createRoom()}
              />
            </div>

            {/* Rooms List */}
            {rooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room) => (
                  <Card
                    key={room.room_id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        {editingRoom === room.room_id ? (
                          <div className="flex-1 mr-2">
                            <input
                              type="text"
                              value={editRoomName}
                              onChange={(e) => setEditRoomName(e.target.value)}
                              className="w-full px-2 py-1 border bg-white border-gray-300 rounded text-sm"
                              onKeyPress={(e) => {
                                if (e.key === "Enter")
                                  saveRoomName(room.room_id);
                                if (e.key === "Escape") cancelEditRoom();
                              }}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <h3 className="font-semibold text-lg">{room.name}</h3>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              room.status === "ended" ? "secondary" : "default"
                            }
                            className={
                              room.status === "ended"
                                ? "bg-gray-200"
                                : "bg-emerald-100 text-emerald-700"
                            }
                          >
                            {room.status === "ended" ? "Ended" : "Active"}
                          </Badge>
                          {editingRoom === room.room_id && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => saveRoomName(room.room_id)}
                                className="h-6 w-6 p-0"
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditRoom}
                                className="h-6 w-6 p-0"
                              >
                                ✕
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>Room ID: {room.room_id.slice(0, 8)}...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            Created:{" "}
                            {new Date(room.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button asChild size="sm" className="flex-1">
                          <Link to={`/host/${room.room_id}`}>
                            <Brain className="h-4 w-4 mr-1" />
                            Host
                          </Link>
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          <Link to={`/room/${room.room_id}`}>
                            <Trophy className="h-4 w-4 mr-1" />
                            Join
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Manage
                              <ChevronDown className="h-3 w-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Room Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => copyRoomLink(room.room_id)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                startEditRoom(room.room_id, room.name)
                              }
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Change Name
                            </DropdownMenuItem>
                            {room.status === "active" && (
                              <DropdownMenuItem
                                onClick={() => openEndDialog(room.room_id)}
                              >
                                <Square className="h-4 w-4 mr-2" />
                                End Room
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(room.room_id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Room
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Gamepad2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No quiz rooms yet</p>
                <p className="text-sm">
                  Create your first room to start hosting quizzes!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reminders */}
      {reminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reminders.map((r) => (
                <div
                  key={r._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <span>{r.message}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(r.scheduledAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Room Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quiz room? This action cannot
              be undone and will permanently remove the room and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteRoom}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Room
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End Room Dialog */}
      <AlertDialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this quiz room? This will stop the
              current quiz session and prevent new participants from joining.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEndRoom}
              className="bg-orange-600 hover:bg-orange-700"
            >
              End Room
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
