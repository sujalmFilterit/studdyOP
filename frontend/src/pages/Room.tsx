import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, Trophy, CheckCircle, ChevronLeft, Brain, 
  Target, Award, Star, Zap, Clock
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { api } from '../lib/api';

interface Participant {
  id: string;
  room_id: string;
  nickname: string;
  email: string;
  score: number;
  joined_at: string;
}

interface Quiz {
  quiz_id: string;
  room_id: string;
  quiz_data: any[];
}

interface LeaderboardEntry {
  participant_name: string;
  score: number;
  rank: number;
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'answering' | 'submitted' | 'finished'>('idle');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reappearError, setReappearError] = useState<string | null>(null);
  const [answerLog, setAnswerLog] = useState<{ q: any; selected: number; correct: boolean }[]>([]);
  const [feedback, setFeedback] = useState<{
    comparison: string;
    points: string[];
    score: { correct: number; wrong: number; percentage: number; total: number };
  } | null>(null);

  const currentQ = useMemo(() => (quiz?.quiz_data ?? [])[currentIndex], [quiz, currentIndex]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const client = api(token || undefined);
        const res = await client.get(`/quiz/${roomId}`);
        setQuiz(res.data);
        setError(null);
      } catch (e: any) {
        console.error('Quiz fetch error:', e);
        setError(e.response?.data?.error || 'Failed to fetch quiz');
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    if (status === 'finished') {
      const interval = setInterval(async () => {
        try {
          const token = localStorage.getItem('token');
          const client = api(token || undefined);
          const res = await client.get(`/leaderboard/${roomId}`);
          setLeaderboard(res.data);
        } catch (e: any) {
          console.error('Leaderboard fetch error:', e);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [roomId, status]);

  async function joinRoom() {
    try {
      const token = localStorage.getItem('token');
      const client = api(token || undefined);
      
      const res = await client.post('/participants', {
        room_id: roomId, 
        nickname, 
        email 
      });
      
      setParticipant(res.data);
      setStatus('answering');
    } catch (error: any) {
      console.error('Join room error:', error);
      if (error.response?.status === 409) {
        setReappearError(error.response?.data?.error || 'Already attempted. Contact host.');
      } else {
        setError(error.response?.data?.error || 'Network error occurred');
      }
    }
  }

  async function submitAnswer() {
    if (participant && quiz && currentQ && selected !== null) {
      try {
        const token = localStorage.getItem('token');
        const client = api(token || undefined);
        
        const res = await client.post('/answers', {
          participant_id: participant.id,
          quiz_id: quiz.quiz_id,
          question_id: currentQ.id,
          selected_option: selected,
        });
        
        const isCorrect = selected === currentQ.correctIndex;
        setAnswerLog(prev => [...prev, { q: currentQ, selected, correct: isCorrect }]);
        setSelected(null);
          
          if (currentIndex + 1 >= (quiz?.quiz_data?.length || 0)) {
            setStatus('finished');
            // Generate feedback
            try {
              const total = quiz?.quiz_data?.length || 0;
              const withCurrent = [...answerLog, { q: currentQ, selected, correct: isCorrect }];
              const correctCount = withCurrent.filter(a => a.correct).length;
              const wrongCount = total - correctCount;
              
              const token = localStorage.getItem('token');
              const client = api(token || undefined);
              
              // Get leaderboard data for comparison
              let participantCount = 0;
              let averageScore = 0;
              try {
                const leaderboardRes = await client.get(`/leaderboard/${roomId}`);
                if (leaderboardRes.data && Array.isArray(leaderboardRes.data)) {
                  participantCount = leaderboardRes.data.length;
                  const totalScore = leaderboardRes.data.reduce((sum: number, p: any) => sum + (p.score || 0), 0);
                  averageScore = participantCount > 0 ? Math.round(totalScore / participantCount) : 0;
                }
              } catch (e) {
                console.log('Could not fetch leaderboard for feedback:', e);
              }
              
              const feedbackRes = await client.post('/feedback', {
                topic: 'Quiz Topic',
                correct: correctCount,
                wrong: wrongCount,
                totalQuestions: total,
                participantCount,
                averageScore,
                strengths: withCurrent.filter(a => a.correct).slice(0, 3).map(a => a.q?.question?.slice(0, 80) || 'a question'),
                weaknesses: withCurrent.filter(a => !a.correct).slice(0, 3).map(a => a.q?.question?.slice(0, 80) || 'a question'),
              });
              
              if (feedbackRes.data) {
                setFeedback({
                  comparison: feedbackRes.data.comparison || 'Your performance shows good understanding of the topic.',
                  points: feedbackRes.data.feedback || [],
                  score: feedbackRes.data.score
                });
              }
            } catch (error) {
              console.error('Feedback generation error:', error);
            }
          } else {
            setCurrentIndex(i => i + 1);
          }
      } catch (error) {
        setError('Network error occurred');
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Quiz Room</h1>
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
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Join Form */}
        {!participant && (
          <Card className="mb-8">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Join the Quiz</h2>
                <p className="text-white/90">Enter your full name and email to start</p>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="max-w-md mx-auto">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="nickname">Full name</Label>
                      <Input
                        id="nickname"
                        placeholder="Enter your full name"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    {reappearError && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
                        {reappearError}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={joinRoom}
                    disabled={!nickname.trim() || !email.trim()}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    Join Quiz Room
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quiz Interface */}
        {participant && quiz && status !== 'finished' && (
          <Card className="mb-8">
            {/* Quiz Header */}
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Playing as {participant.nickname}</h3>
                    <p className="text-white/90 text-sm">Answer the questions to score points</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{currentIndex + 1}</div>
                  <div className="text-white/90 text-sm">of {quiz?.quiz_data?.length || 0}</div>
                </div>
              </div>
            </CardHeader>

            {/* Question */}
            <CardContent className="p-8">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
                  <span className="text-sm font-medium text-gray-600">Question {currentIndex + 1}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
                  {currentQ?.question}
                </h3>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {currentQ?.options?.map((o: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    className={`text-left border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-md ${
                      selected === i 
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition ${
                        selected === i 
                          ? 'border-indigo-600 bg-indigo-600 text-white' 
                          : 'border-gray-300 text-gray-600'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="text-gray-800 font-medium">{o}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button
                  disabled={selected === null}
                  onClick={submitAnswer}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  Submit Answer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        {status === 'finished' && (
          <Card className="mb-8">
            <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Final Results</h2>
                  <p className="text-white/90 text-sm">Your final ranking</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {leaderboard.length > 0 ? (
                <div className="space-y-4">
                  {leaderboard.map((l, idx) => (
                    <div
                      key={l.rank}
                      className={`flex items-center justify-between p-6 rounded-xl border-2 transition-all ${
                        idx === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 shadow-lg' : 
                        idx === 1 ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300 shadow-md' : 
                        idx === 2 ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300 shadow-md' : 
                        'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg ${
                          idx === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                          idx === 1 ? 'bg-gradient-to-r from-gray-400 to-slate-500 text-white' :
                          idx === 2 ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : l.rank}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 text-lg">{l.participant_name}</span>
                          {idx === 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Trophy className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm text-yellow-600 font-medium">Winner!</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-600">{l.score}</div>
                        <div className="text-sm text-gray-500">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                    <Trophy className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Leaderboard loading...</h3>
                  <p className="text-gray-600">Your results will be shown here</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quiz Complete */}
        {status === 'finished' && (
          <Card className="mb-8">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white text-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur mb-4">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Quiz Complete!</h3>
              <p className="text-white/90">Great job! Check your final score on the leaderboard above.</p>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <Badge className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700">
                  <CheckCircle className="h-4 w-4" />
                  All questions answered
                </Badge>
                <p className="text-gray-600">
                  Your score has been recorded and you can see how you ranked against other participants.
                </p>
              </div>
              
              {feedback && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">AI Feedback</h4>
                  
                  {/* Performance Comparison */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-900 mb-2">Performance Analysis</h5>
                    <p className="text-blue-800 text-sm">{feedback.comparison}</p>
                    <div className="mt-2 text-xs text-blue-600">
                      Score: {feedback.score.correct}/{feedback.score.total} ({feedback.score.percentage}%)
                    </div>
                  </div>
                  
                  {/* 5 Feedback Points */}
                  <div className="space-y-3">
                    <h5 className="font-semibold text-gray-900 mb-3">Improvement Recommendations</h5>
                    {feedback.points.map((item, idx) => (
                      <div key={idx} className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-green-700">{idx + 1}</span>
                          </div>
                          <p className="text-sm text-green-800 flex-1">{item}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
