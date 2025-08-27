'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  FileText, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Brain,
  Zap,
  Shield,
  Database,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalUsers: number;
  totalAnalyses: number;
  activeUsers: number;
  systemHealth: number;
  recentAnalyses: any[];
  alerts: any[];
  systemMetrics: {
    cpu: number;
    memory: number;
    disk: number;
    uptime: string;
  };
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAnalyses: 0,
    activeUsers: 0,
    systemHealth: 0,
    recentAnalyses: [],
    alerts: [],
    systemMetrics: {
      cpu: 0,
      memory: 0,
      disk: 0,
      uptime: '0d 0h 0m'
    }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        
        setStats({
          totalUsers: data.totalUsers,
          totalAnalyses: data.totalAnalyses,
          activeUsers: data.activeUsers,
          systemHealth: data.systemHealth,
          recentAnalyses: data.recentAnalyses,
          alerts: data.alerts,
          systemMetrics: data.systemMetrics
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast({
          title: "Failed to load dashboard",
          description: "Unable to fetch dashboard data. Please try again later.",
          variant: "destructive",
        });
      }
    };

    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of system performance and user activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnalyses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Currently online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemHealth}%</div>
            <Progress value={stats.systemHealth} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analyses">Recent Analyses</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>AI Agent Performance</CardTitle>
                <CardDescription>
                  Analysis performance by AI agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    <span className="text-sm">Grok Agent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={92} className="w-20" />
                    <span className="text-sm font-medium">92%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm">Gemini Agent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={87} className="w-20" />
                    <span className="text-sm font-medium">87%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">OpenAI Agent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={85} className="w-20" />
                    <span className="text-sm font-medium">85%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest system activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">System backup completed</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New user registration</p>
                    <p className="text-xs text-muted-foreground">15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Database optimization started</p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analyses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Analyses</CardTitle>
              <CardDescription>
                Latest error log analyses performed by users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentAnalyses.map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-medium">{analysis.title}</h4>
                        <p className="text-sm text-muted-foreground">by {analysis.user}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(analysis.status)}
                      {analysis.confidence > 0 && (
                        <Badge variant="outline">
                          {Math.round(analysis.confidence * 100)}% confidence
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">{analysis.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>
                Recent alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <div>
                        <h4 className="font-medium">{alert.message}</h4>
                        <p className="text-sm text-muted-foreground">{alert.type} alert</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getSeverityBadge(alert.severity)}
                      <span className="text-sm text-muted-foreground">{alert.timestamp}</span>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
                <CardDescription>
                  Current system resource usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span>{stats.systemMetrics.cpu}%</span>
                  </div>
                  <Progress value={stats.systemMetrics.cpu} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span>{stats.systemMetrics.memory}%</span>
                  </div>
                  <Progress value={stats.systemMetrics.memory} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Disk Usage</span>
                    <span>{stats.systemMetrics.disk}%</span>
                  </div>
                  <Progress value={stats.systemMetrics.disk} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>
                  General system information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-sm">{stats.systemMetrics.uptime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Version</span>
                  <span className="text-sm">1.0.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Environment</span>
                  <span className="text-sm">Production</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database</span>
                  <span className="text-sm">SQLite</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">AI SDK</span>
                  <span className="text-sm">Z.ai Web Dev SDK</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}