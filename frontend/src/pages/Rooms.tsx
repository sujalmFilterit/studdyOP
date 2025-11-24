import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Users, Plus, UserPlus, Share2, Copy } from 'lucide-react'

type StudyRoom = {
  _id: string
  name: string
  description: string
  owner: { _id: string; name: string; email: string }
  members: Array<{ _id: string; name: string; email: string; xp: number; level: number }>
  inviteCode: string
  isPublic: boolean
}

export default function Rooms() {
  const { token, user } = useAuth()
  const [rooms, setRooms] = useState<StudyRoom[]>([])
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDesc, setNewRoomDesc] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) {
      fetchRooms()
    }
  }, [token])

  async function fetchRooms() {
    try {
      const client = api(token || undefined)
      const { data } = await client.get('/rooms')
      setRooms(data)
    } catch (e) {
      console.error('Failed to fetch rooms')
    }
  }

  async function createRoom() {
    if (!newRoomName.trim()) return

    setLoading(true)
    try {
      const client = api(token || undefined)
      const { data } = await client.post('/rooms', {
        name: newRoomName,
        description: newRoomDesc,
        isPublic: false
      })
      setRooms(prev => [data, ...prev])
      setNewRoomName('')
      setNewRoomDesc('')
    } catch (e) {
      console.error('Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  async function joinRoom() {
    if (!inviteCode.trim()) return

    setLoading(true)
    try {
      const client = api(token || undefined)
      const { data } = await client.post('/rooms/join', { inviteCode })
      setRooms(prev => [data, ...prev])
      setInviteCode('')
    } catch (e: any) {
      console.error('Failed to join room:', e?.response?.data?.message)
    } finally {
      setLoading(false)
    }
  }

  function copyInviteCode(code: string) {
    navigator.clipboard.writeText(code)
    // You could add a toast notification here
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6" />
        <h2 className="text-2xl font-semibold">Study Rooms</h2>
      </div>

      <Tabs defaultValue="my-rooms" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-rooms">My Rooms</TabsTrigger>
          <TabsTrigger value="create">Create Room</TabsTrigger>
          <TabsTrigger value="join">Join Room</TabsTrigger>
        </TabsList>

        <TabsContent value="my-rooms" className="space-y-4">
          {rooms.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No study rooms yet</h3>
                <p className="text-muted-foreground">
                  Create a room or join one with an invite code
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rooms.map(room => (
                <Card key={room._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {room.name}
                          {room.owner._id === user?.id && (
                            <Badge variant="secondary">Owner</Badge>
                          )}
                        </CardTitle>
                        <p className="text-muted-foreground mt-1">{room.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {room.members.length} member{room.members.length !== 1 ? 's' : ''}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteCode(room.inviteCode)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Invite
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-2">Members</h4>
                        <div className="flex flex-wrap gap-2">
                          {room.members.map(member => (
                            <div key={member._id} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full">
                              <span className="text-sm font-medium">{member.name}</span>
                              <Badge variant="outline" className="text-xs">
                                L{member.level}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {member.xp} XP
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Study Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Room Name</label>
                <Input
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g., React Study Group"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Input
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="What will you study together?"
                />
              </div>
              <Button onClick={createRoom} disabled={loading || !newRoomName.trim()}>
                {loading ? 'Creating...' : 'Create Room'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="join" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Join Study Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Invite Code</label>
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter 6-character invite code"
                />
              </div>
              <Button onClick={joinRoom} disabled={loading || !inviteCode.trim()}>
                {loading ? 'Joining...' : 'Join Room'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
