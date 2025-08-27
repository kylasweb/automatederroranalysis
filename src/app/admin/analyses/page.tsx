'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Search, 
  Eye, 
  Trash2, 
  Download, 
  Filter,
  Calendar,
  User,
  Brain,
  Zap,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Analysis {
  id: string;
  userId: string;
  title?: string;
  logContent: string;
  techStack: string;
  environment: string;
  analysis: string;
  confidence: number;
  source: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  ocrExtracted?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string;
    name?: string;
  };
  alerts?: any[];
}

export default function AnalysesManagement() {
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<Analysis[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  useEffect(() => {
    let filtered = analyses;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(analysis =>
        analysis.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.techStack.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.environment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(analysis => analysis.status === statusFilter);
    }

    setFilteredAnalyses(filtered);
  }, [searchTerm, statusFilter, analyses]);

  const fetchAnalyses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/analyses');
      if (!response.ok) {
        throw new Error('Failed to fetch analyses');
      }
      const data = await response.json();
      setAnalyses(data.analyses || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast({
        title: "Failed to load analyses",
        description: "Unable to fetch analyses. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAnalysis = (analysis: Analysis) => {
    setSelectedAnalysis(analysis);
    setIsViewDialogOpen(true);
  };

  const handleDeleteAnalysis = async () => {
    if (!selectedAnalysis) return;

    try {
      const response = await fetch(`/api/analyses/${selectedAnalysis.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete analysis');
      }

      const updatedAnalyses = analyses.filter(a => a.id !== selectedAnalysis.id);
      setAnalyses(updatedAnalyses);
      setIsDeleteDialogOpen(false);
      setSelectedAnalysis(null);
      
      toast({
        title: "Analysis deleted",
        description: "Analysis has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: "Failed to delete analysis",
        description: error instanceof Error ? error.message : "An error occurred while deleting the analysis.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'PROCESSING':
        return <Badge variant="secondary">Processing</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PROCESSING':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'grok':
        return <Brain className="h-4 w-4 text-purple-500" />;
      case 'gemini':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'openai':
        return <Shield className="h-4 w-4 text-green-500" />;
      default:
        return <Brain className="h-4 w-4 text-gray-500" />;
    }
  };

  const exportAnalyses = () => {
    const csvContent = [
      ['ID', 'Title', 'User', 'Tech Stack', 'Environment', 'Status', 'Confidence', 'Source', 'Created'],
      ...filteredAnalyses.map(a => [
        a.id,
        a.title || '',
        a.user?.name || a.user?.email || '',
        a.techStack,
        a.environment,
        a.status,
        a.confidence.toString(),
        a.source,
        new Date(a.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analyses_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analyses</h1>
          <p className="text-muted-foreground">
            Manage error log analyses and results
          </p>
        </div>
        <Button variant="outline" onClick={exportAnalyses}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyses.filter(a => a.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyses.filter(a => a.status === 'PROCESSING').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyses.filter(a => a.status === 'FAILED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Management</CardTitle>
          <CardDescription>
            View and manage all error log analyses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search analyses by title, tech stack, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Analysis</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Tech Stack</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                      Loading analyses...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAnalyses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No analyses found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAnalyses.map((analysis) => (
                  <TableRow key={analysis.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{analysis.title || 'Untitled Analysis'}</div>
                      {analysis.ocrExtracted && (
                        <Badge variant="outline" className="text-xs mt-1">
                          OCR Extracted
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{analysis.user?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">{analysis.user?.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{analysis.techStack}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{analysis.environment}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(analysis.status)}
                      {getStatusBadge(analysis.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {analysis.confidence > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{Math.round(analysis.confidence * 100)}%</div>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${analysis.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getSourceIcon(analysis.source)}
                      <span className="text-sm">{analysis.source || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(analysis.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewAnalysis(analysis)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAnalysis(analysis);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Analysis Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analysis Details</DialogTitle>
            <DialogDescription>
              View detailed analysis information
            </DialogDescription>
          </DialogHeader>
          {selectedAnalysis && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Title</Label>
                  <div className="p-3 bg-muted rounded-md">
                    {selectedAnalysis.title || 'Untitled Analysis'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="p-3 bg-muted rounded-md">
                    {getStatusBadge(selectedAnalysis.status)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tech Stack</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <Badge variant="outline">{selectedAnalysis.techStack}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Environment</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <Badge variant="secondary">{selectedAnalysis.environment}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Confidence</Label>
                  <div className="p-3 bg-muted rounded-md">
                    {selectedAnalysis.confidence > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{Math.round(selectedAnalysis.confidence * 100)}%</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${selectedAnalysis.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not available</span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Source</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      {getSourceIcon(selectedAnalysis.source)}
                      <span>{selectedAnalysis.source || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="log" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="log">Log Content</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                </TabsList>
                <TabsContent value="log" className="space-y-2">
                  <Label className="text-sm font-medium">Original Log Content</Label>
                  <Textarea
                    value={selectedAnalysis.logContent}
                    readOnly
                    className="min-h-[200px] font-mono text-sm"
                  />
                </TabsContent>
                <TabsContent value="analysis" className="space-y-2">
                  <Label className="text-sm font-medium">AI Analysis Result</Label>
                  <Textarea
                    value={selectedAnalysis.analysis}
                    readOnly
                    className="min-h-[200px]"
                  />
                </TabsContent>
                <TabsContent value="metadata" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Created</Label>
                      <div className="p-3 bg-muted rounded-md">
                        {new Date(selectedAnalysis.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Updated</Label>
                      <div className="p-3 bg-muted rounded-md">
                        {new Date(selectedAnalysis.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">User</Label>
                      <div className="p-3 bg-muted rounded-md">
                        <div>
                          <div className="font-medium">{selectedAnalysis.user?.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{selectedAnalysis.user?.email}</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Analysis ID</Label>
                      <div className="p-3 bg-muted rounded-md font-mono text-sm">
                        {selectedAnalysis.id}
                      </div>
                    </div>
                  </div>
                  {selectedAnalysis.ocrExtracted && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">OCR Extracted Text</Label>
                      <div className="p-3 bg-muted rounded-md">
                        <Textarea
                          value={selectedAnalysis.ocrExtracted}
                          readOnly
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Analysis</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this analysis? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedAnalysis && (
            <div className="space-y-2">
              <div className="p-3 bg-muted rounded-md">
                <div className="font-medium">{selectedAnalysis.title || 'Untitled Analysis'}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedAnalysis.techStack} • {selectedAnalysis.environment}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAnalysis}>
              Delete Analysis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}