'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Activity, 
  Search, 
  Eye, 
  Download, 
  Filter,
  Calendar,
  User,
  Database,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  GitBranch,
  Settings,
  Users,
  XCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    email: string;
    name?: string;
  };
  timestamp?: string;
}

interface AuditLogsResponse {
  auditLogs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage]);

  useEffect(() => {
    let filtered = auditLogs;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    // Apply entity filter
    if (entityFilter !== 'all') {
      filtered = filtered.filter(log => log.entityType === entityFilter);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(log => new Date(log.createdAt) >= filterDate);
    }

    setFilteredLogs(filtered);
  }, [searchTerm, actionFilter, entityFilter, dateFilter, auditLogs]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50'
      });

      if (actionFilter !== 'all') {
        params.append('action', actionFilter);
      }

      const response = await fetch(`/api/audit?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data: AuditLogsResponse = await response.json();
      setAuditLogs(data.auditLogs);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Failed to load audit logs",
        description: "Unable to fetch audit logs from the server. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewLog = (log: AuditLog) => {
    setSelectedLog(log);
    setIsViewDialogOpen(true);
  };

  const exportLogs = () => {
    const csvContent = [
      ['ID', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Timestamp'],
      ...filteredLogs.map(log => [
        log.id,
        log.user?.name || log.user?.email || 'System',
        log.action,
        log.entityType,
        log.entityId,
        log.ipAddress || '',
        new Date(log.createdAt).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit_logs_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return <Badge variant="default" className="bg-green-500">Create</Badge>;
      case 'update':
        return <Badge variant="default" className="bg-blue-500">Update</Badge>;
      case 'delete':
        return <Badge variant="destructive">Delete</Badge>;
      case 'login':
        return <Badge variant="default" className="bg-green-600">Login</Badge>;
      case 'failed_login':
        return <Badge variant="destructive">Failed Login</Badge>;
      case 'system':
        return <Badge variant="secondary">System</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'user':
        return <Users className="h-4 w-4" />;
      case 'analysis':
        return <FileText className="h-4 w-4" />;
      case 'flow':
        return <GitBranch className="h-4 w-4" />;
      case 'connector':
        return <Settings className="h-4 w-4" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />;
      case 'system':
        return <Database className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'update':
        return <Settings className="h-4 w-4 text-blue-500" />;
      case 'delete':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'login':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed_login':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'system':
        return <Database className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading && auditLogs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading audit logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Monitor system activity and user actions
          </p>
        </div>
        <Button variant="outline" onClick={exportLogs}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Actions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs.filter(log => log.userId).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs.filter(log => ['LOGIN', 'FAILED_LOGIN'].includes(log.action)).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs.filter(log => {
                const logDate = new Date(log.createdAt);
                const today = new Date();
                return logDate.toDateString() === today.toDateString();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Management</CardTitle>
          <CardDescription>
            View and filter system activity logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs by action, entity, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="FAILED_LOGIN">Failed Login</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="Analysis">Analysis</SelectItem>
                <SelectItem value="Flow">Flow</SelectItem>
                <SelectItem value="Connector">Connector</SelectItem>
                <SelectItem value="Alert">Alert</SelectItem>
                <SelectItem value="System">System</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm">{new Date(log.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">
                          {log.user?.name || log.user?.email || 'System'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {log.timestamp || ''}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      {getActionBadge(log.action)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getEntityIcon(log.entityType)}
                      <span className="text-sm">{log.entityType}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono">{log.entityId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {log.ipAddress || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewLog(log)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found matching your filters.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Log Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this audit event
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">ID</Label>
                  <div className="text-sm font-mono">{selectedLog.id}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Timestamp</Label>
                  <div className="text-sm">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Action</Label>
                  <div className="text-sm">{selectedLog.action}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Entity Type</Label>
                  <div className="text-sm">{selectedLog.entityType}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Entity ID</Label>
                  <div className="text-sm font-mono">{selectedLog.entityId}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <div className="text-sm">
                    {selectedLog.user?.name || selectedLog.user?.email || 'System'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">IP Address</Label>
                  <div className="text-sm">{selectedLog.ipAddress || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">User Agent</Label>
                  <div className="text-sm truncate">{selectedLog.userAgent || 'N/A'}</div>
                </div>
              </div>

              {selectedLog.oldValues && (
                <div>
                  <Label className="text-sm font-medium">Old Values</Label>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValues && (
                <div>
                  <Label className="text-sm font-medium">New Values</Label>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}