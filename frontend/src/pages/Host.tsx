import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Brain, CheckCircle, ChevronLeft, Link as LinkIcon, DoorOpen, 
  Mic, MicOff, Users, Trophy, Settings, Play, Pause
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { api } from '../lib/api';

interface Room {
  room_id: string;
  name: string;
  status: 'active' | 'ended';
  created_at: string;
}

interface Quiz {
  quiz_id: string;
  room_id: string;
  difficulty: string;
  total_questions: number;
  quiz_data: any[];
  approved: boolean;
}

export default function HostPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [totalQuestions, setTotalQuestions] = useState<5 | 10 | 15 | 20>(5);
  const [loading, setLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    loadRoom();
    loadQuiz();
  }, [roomId]);

  async function loadRoom() {
    try {
      const token = localStorage.getItem('token');
      const client = api(token || undefined);
      const res = await client.get(`/rooms/${roomId}`);
      setRoom(res.data);
    } catch (error) {
      console.error('Failed to load room:', error);
    }
  }

  async function loadQuiz() {
    try {
      const token = localStorage.getItem('token');
      const client = api(token || undefined);
      const res = await client.get(`/quiz/${roomId}`);
      setQuiz(res.data);
    } catch (error) {
      console.error('Failed to load quiz:', error);
    }
  }

  async function copyJoinLink() {
    try {
      setCopying(true);
      const link = `${window.location.origin}/room/${roomId}`;
      await navigator.clipboard.writeText(link);
      setTimeout(() => setCopying(false), 800);
    } catch (error) {
      setCopying(false);
    }
  }

  async function generateQuiz() {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const client = api(token || undefined);
      
      console.log('Generating quiz with data:', { 
        room_id: roomId, 
        topic, 
        difficulty, 
        total_questions: totalQuestions 
      });
      
      const res = await client.post('/quiz/generate', { 
        room_id: roomId, 
        topic, 
        difficulty, 
        total_questions: totalQuestions 
      });
      
      console.log('Quiz generation successful:', res.data);
      setQuiz(res.data);
    } catch (error) {
      console.error('Quiz generation error:', error);
      const axiosError = error as any;
      setError(axiosError?.response?.data?.error || axiosError?.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  }

  async function approveQuiz() {
    try {
      setApproveLoading(true);
      const token = localStorage.getItem('token');
      const client = api(token || undefined);
      
      await client.post(`/quiz/${roomId}/approve`);
      await loadQuiz();
    } catch (error) {
      console.error('Approve quiz error:', error);
      const axiosError = error as any;
      setError(axiosError?.response?.data?.error || 'Failed to approve quiz');
    } finally {
      setApproveLoading(false);
    }
  }

  function startVoiceInput() {
    try {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => setListening(true);
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) setTopic(transcript);
      };
      recognition.start();
    } catch (error) {
      setListening(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/70 backdrop-blur">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Host Room</h1>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Room Status */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Badge 
              variant={room?.status === 'ended' ? 'secondary' : 'default'}
              className={room?.status === 'ended' ? 'bg-gray-200' : 'bg-emerald-100 text-emerald-700'}
            >
              {room?.status === 'ended' ? 'Room Ended' : 'Room Live'}
            </Badge>
            {room?.name && (
              <span className="text-sm text-gray-600">
                Name: <span className="font-medium text-gray-900">{room.name}</span>
              </span>
            )}
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                onClick={copyJoinLink}
                className="inline-flex items-center gap-2"
              >
                <LinkIcon className="h-4 w-4" />
                {copying ? 'Copied' : 'Copy Join Link'}
              </Button>
            </div>
          </div>
        </div>

        {/* Quiz Generation */}
        <Card className="mb-8">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Generate Quiz</CardTitle>
                <p className="text-white/90 text-sm">Choose topic, difficulty and number of questions</p>
              </div>
              {quiz?.approved && (
                <Badge className="bg-white/10 text-white">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Published
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div>
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., JavaScript"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="questions">Questions</Label>
                <Select value={totalQuestions.toString()} onValueChange={(value) => setTotalQuestions(Number(value) as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
              <Button
                onClick={generateQuiz}
                disabled={loading || !topic.trim()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {loading ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Quiz
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={startVoiceInput}
                className={listening ? 'ring-2 ring-rose-400' : ''}
                title="Speak topic"
              >
                {listening ? (
                  <MicOff className="h-4 w-4 text-rose-600" />
                ) : (
                  <Mic className="h-4 w-4 text-gray-700" />
                )}
              </Button>
              
              {quiz && !quiz.approved && (
                <Button
                  variant="outline"
                  onClick={approveQuiz}
                  disabled={approveLoading}
                >
                  {approveLoading ? (
                    <>
                      <Brain className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Publish
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Quiz Preview */}
        {quiz && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quiz Preview</CardTitle>
                  <p className="text-sm text-gray-600">Review questions and correct answers before publishing</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(quiz.quiz_data || []).map((q: any, idx: number) => (
                      <div key={q.id ?? idx} className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="font-medium mb-3 text-gray-900">
                          {idx + 1}. {q.question}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                          {q.options?.map((o: string, i: number) => (
                            <div
                              key={i}
                              className={`rounded-lg border p-3 ${
                                i === q.correctIndex 
                                  ? 'border-emerald-400 bg-emerald-50' 
                                  : 'border-gray-200 bg-white'
                              }`}
                            >
                              {o}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Quiz Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Topic</span>
                    <span className="font-medium text-gray-900">{topic || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty</span>
                    <span className="font-medium text-gray-900">{difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Questions</span>
                    <span className="font-medium text-gray-900">{totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className="font-medium text-gray-900">
                      {quiz?.approved ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700 space-y-2">
                  <p>• Keep topics focused (e.g., "ES6 Array Methods").</p>
                  <p>• Match difficulty with your audience.</p>
                  <p>• Aim for concise, unambiguous questions and options.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
