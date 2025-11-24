import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, BookOpen, Target, CheckCircle, Circle } from 'lucide-react';

interface ScheduleItem {
  _id?: string;
  week: number;
  day: string;
  subject: string;
  focus: string;
  duration: number;
  completed?: boolean;
}
//  abc
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

interface ScheduleDisplayProps {
  plan: StudyPlan;
  onUpdateCompletion?: (itemId: string, completed: boolean) => void;
}

export function ScheduleDisplay({ plan, onUpdateCompletion }: ScheduleDisplayProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const completedCount = plan.schedule.filter(item => item.completed).length;
  const progressPercentage = Math.round((completedCount / plan.schedule.length) * 100);
  
  const subjectsProgress = plan.subjects.map(subject => {
    const subjectItems = plan.schedule.filter(item => item.subject === subject);
    const completed = subjectItems.filter(item => item.completed).length;
    return {
      subject,
      total: subjectItems.length,
      completed,
      percentage: Math.round((completed / subjectItems.length) * 100)
    };
  });

  const weeklyProgress = Array.from({ length: plan.totalWeeks }, (_, i) => {
    const weekNumber = i + 1;
    const weekItems = plan.schedule.filter(item => item.week === weekNumber);
    const completed = weekItems.filter(item => item.completed).length;
    return {
      week: weekNumber,
      total: weekItems.length,
      completed,
      percentage: Math.round((completed / weekItems.length) * 100)
    };
  });

  const handleToggleCompletion = async (itemId: string, completed: boolean) => {
    if (onUpdateCompletion) {
      await onUpdateCompletion(itemId, completed);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Goal</p>
                <p className="text-xs text-muted-foreground">{plan.goal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Subjects</p>
                <p className="text-xs text-muted-foreground">{plan.subjects.join(', ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-xs text-muted-foreground">{plan.totalWeeks} weeks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Progress</p>
                <p className="text-xs text-muted-foreground">{completedCount}/{plan.totalDays} completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>
            {completedCount} of {plan.totalDays} study sessions completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-sm">
              <span>{progressPercentage}% Complete</span>
              <span>{plan.totalDays - completedCount} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subject Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {subjectsProgress.map(({ subject, total, completed, percentage }) => (
                    <div key={subject} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{subject}</span>
                        <span>{completed}/{total}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weeklyProgress.map(({ week, total, completed, percentage }) => (
                    <div key={week} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Week {week}</span>
                        <span>{completed}/{total}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <div className="space-y-4">
            {Array.from({ length: plan.totalWeeks }, (_, i) => {
              const weekNumber = i + 1;
              const weekItems = plan.schedule.filter(item => item.week === weekNumber);
              
              return (
                <Card key={weekNumber}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span>Week {weekNumber}</span>
                      <Badge variant="secondary">
                        {weekItems.filter(item => item.completed).length}/{weekItems.length} completed
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {weekItems.map((item, index) => (
                        <Card key={index} className={`${item.completed ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                checked={item.completed || false}
                                onCheckedChange={(checked) => 
                                  handleToggleCompletion(item._id || '', checked as boolean)
                                }
                                className="mt-1"
                              />
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm font-medium">{item.day}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <BookOpen className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">{item.subject}</span>
                                </div>
                                <p className="text-sm font-medium">{item.focus}</p>
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{item.duration} minutes</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Completion Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Rate</CardTitle>
                <CardDescription>Daily completion over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Chart component will be added here
                </div>
              </CardContent>
            </Card>

            {/* Subject Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Distribution</CardTitle>
                <CardDescription>Time allocation by subject</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {subjectsProgress.map(({ subject, total, percentage }) => (
                    <div key={subject} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{subject}</span>
                        <span>{total} sessions</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
