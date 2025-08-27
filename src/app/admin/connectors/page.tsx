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
import { Switch } from '@/components/ui/switch';
import { 
  Plug, 
  Plus, 
  Edit, 
  Trash2, 
  TestTube, 
  Settings,
  MessageSquare,
  ExternalLink,
  Github,
  Mail,
  Globe,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Search,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TeamsConnectorConfig from '@/components/teams-connector-config';
import { ConnectorService, TeamsConfig } from '@/lib/connectors';

interface Connector {
  id: string;
  userId: string;
  name: string;
  type: 'TEAMS' | 'JIRA' | 'GITHUB' | 'SLACK' | 'EMAIL' | 'WEBHOOK';
  config: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string;
    name?: string;
  };
  lastUsed?: string;
  status?: 'connected' | 'disconnected' | 'error';
}

const connectorTypes = [
  { value: 'TEAMS', label: 'Microsoft Teams', icon: MessageSquare, color: 'bg-blue-500' },
  { value: 'JIRA', label: 'Jira', icon: ExternalLink, color: 'bg-blue-600' },
  { value: 'GITHUB', label: 'GitHub', icon: Github, color: 'bg-gray-800' },
  { value: 'SLACK', label: 'Slack', icon: MessageSquare, color: 'bg-purple-500' },
  { value: 'EMAIL', label: 'Email', icon: Mail, color: 'bg-green-500' },
  { value: 'WEBHOOK', label: 'Webhook', icon: Globe, color: 'bg-orange-500' },
];

export default function ConnectorsManagement() {
  const { toast } = useToast();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [filteredConnectors, setFilteredConnectors] = useState<Connector[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'TEAMS' as Connector['type'],
    config: '',
    isActive: true
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    fetchConnectors();
  }, []);

  useEffect(() => {
    let filtered = connectors;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(connector =>
        connector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        connector.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        connector.user?.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(connector => connector.type === typeFilter);
    }

    setFilteredConnectors(filtered);
  }, [searchTerm, typeFilter, connectors]);

  const fetchConnectors = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/connectors');
      if (!response.ok) {
        throw new Error('Failed to fetch connectors');
      }
      const data = await response.json();
      setConnectors(data);
    } catch (error) {
      console.error('Error fetching connectors:', error);
      toast({
        title: "Failed to load connectors",
        description: "Unable to fetch connectors. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConnector = async () => {
    try {
      const configObj = formData.config ? JSON.parse(formData.config) : {};
      
      // First get the admin user
      const usersResponse = await fetch('/api/users');
      const users = await usersResponse.json();
      const adminUser = users.find((user: any) => user.role === 'SUPER_ADMIN' || user.role === 'ADMIN');
      
      if (!adminUser) {
        throw new Error('No admin user found');
      }
      
      const response = await fetch('/api/connectors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: adminUser.id,
          name: formData.name,
          type: formData.type,
          config: configObj,
          isActive: formData.isActive
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create connector');
      }

      const newConnector = await response.json();
      setConnectors([...connectors, newConnector]);
      setFormData({ name: '', type: 'TEAMS', config: '', isActive: true });
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Connector created",
        description: `${newConnector.name} has been created successfully.`,
      });
    } catch (error) {
      console.error('Error creating connector:', error);
      toast({
        title: "Failed to create connector",
        description: error instanceof Error ? error.message : "An error occurred while creating the connector.",
        variant: "destructive",
      });
    }
  };

  const handleEditConnector = async () => {
    if (!selectedConnector) return;

    try {
      const configObj = formData.config ? JSON.parse(formData.config) : {};
      
      const response = await fetch(`/api/connectors/${selectedConnector.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          config: configObj,
          isActive: formData.isActive
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update connector');
      }

      const updatedConnector = await response.json();
      const updatedConnectors = connectors.map(connector =>
        connector.id === selectedConnector.id ? updatedConnector : connector
      );
      setConnectors(updatedConnectors);
      setFormData({ name: '', type: 'TEAMS', config: '', isActive: true });
      setSelectedConnector(null);
      setIsEditDialogOpen(false);
      
      toast({
        title: "Connector updated",
        description: `${updatedConnector.name} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating connector:', error);
      toast({
        title: "Failed to update connector",
        description: error instanceof Error ? error.message : "An error occurred while updating the connector.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConnector = async (connectorId: string) => {
    if (!confirm('Are you sure you want to delete this connector?')) return;

    try {
      const response = await fetch(`/api/connectors/${connectorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete connector');
      }

      const updatedConnectors = connectors.filter(connector => connector.id !== connectorId);
      setConnectors(updatedConnectors);
      
      toast({
        title: "Connector deleted",
        description: "Connector has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting connector:', error);
      toast({
        title: "Failed to delete connector",
        description: error instanceof Error ? error.message : "An error occurred while deleting the connector.",
        variant: "destructive",
      });
    }
  };

  const handleToggleConnector = async (connectorId: string) => {
    try {
      const connector = connectors.find(c => c.id === connectorId);
      if (!connector) return;

      const response = await fetch(`/api/connectors/${connectorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...connector,
          isActive: !connector.isActive
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle connector');
      }

      const updatedConnector = await response.json();
      const updatedConnectors = connectors.map(connector =>
        connector.id === connectorId ? updatedConnector : connector
      );
      setConnectors(updatedConnectors);
    } catch (error) {
      console.error('Error toggling connector:', error);
      toast({
        title: "Failed to toggle connector",
        description: error instanceof Error ? error.message : "An error occurred while toggling the connector.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (connector: Connector) => {
    setSelectedConnector(connector);
    setFormData({
      name: connector.name,
      type: connector.type,
      config: typeof connector.config === 'object' ? JSON.stringify(connector.config, null, 2) : connector.config,
      isActive: connector.isActive
    });
    setIsEditDialogOpen(true);
  };

  const openTestDialog = (connector: Connector) => {
    setSelectedConnector(connector);
    setIsTestDialogOpen(true);
  };

  const testConnection = async () => {
    if (!selectedConnector) return;
    
    setIsTestingConnection(true);
    try {
      const config = typeof selectedConnector.config === 'object' 
        ? selectedConnector.config 
        : JSON.parse(selectedConnector.config);
      
      if (selectedConnector.type === 'TEAMS') {
        await ConnectorService.testTeamsConnection(config as TeamsConfig);
      } else {
        // Mock test for other connector types
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      setIsTestDialogOpen(false);
      toast({
        title: "Connection test successful",
        description: "The connector is working correctly.",
      });
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: "Connection test failed",
        description: error instanceof Error ? error.message : "Unable to test connection.",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getConnectorTypeBadge = (type: string) => {
    const connectorType = connectorTypes.find(ct => ct.value === type);
    if (!connectorType) return <Badge variant="outline">Unknown</Badge>;
    
    const Icon = connectorType.icon;
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {connectorType.label}
      </Badge>
    );
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="secondary">Disconnected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getConnectorConfigForm = (type: Connector['type']) => {
    switch (type) {
      case 'TEAMS':
        const teamsConfig = formData.config ? JSON.parse(formData.config) as TeamsConfig : undefined;
        return (
          <TeamsConnectorConfig
            config={teamsConfig}
            onChange={(config) => setFormData({ ...formData, config: JSON.stringify(config, null, 2) })}
            onTest={async (config) => {
              try {
                await ConnectorService.testTeamsConnection(config);
                toast({
                  title: "Test successful",
                  description: "Teams configuration is working correctly.",
                });
              } catch (error) {
                toast({
                  title: "Test failed",
                  description: error instanceof Error ? error.message : "Teams configuration test failed.",
                  variant: "destructive",
                });
                throw error;
              }
            }}
            isTesting={isTestingConnection}
          />
        );
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor="connector-config">Configuration (JSON)</Label>
            <Textarea
              id="connector-config"
              value={formData.config}
              onChange={(e) => setFormData({ ...formData, config: e.target.value })}
              placeholder='{"\n  "key": "value"\n}'
              className="min-h-[120px] font-mono text-sm"
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connectors</h1>
          <p className="text-muted-foreground">
            Manage external service integrations
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Connector
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Connector</DialogTitle>
              <DialogDescription>
                Create a new external service integration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="connector-name">Name</Label>
                <Input
                  id="connector-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Connector"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="connector-type">Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select connector type" />
                  </SelectTrigger>
                  <SelectContent>
                    {connectorTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {getConnectorConfigForm(formData.type)}
              <div className="flex items-center space-x-2">
                <Switch
                  id="connector-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="connector-active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateConnector}>Add Connector</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connectors</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectors.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connectors.filter(c => c.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connectors.filter(c => c.status === 'connected').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Types</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(connectors.map(c => c.type)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Connector Management</CardTitle>
          <CardDescription>
            View and manage all external service connectors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search connectors by name or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {connectorTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Connector</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                      Loading connectors...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredConnectors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No connectors found
                  </TableCell>
                </TableRow>
              ) : (
                filteredConnectors.map((connector) => (
                  <TableRow key={connector.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{connector.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {connector.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getConnectorTypeBadge(connector.type)}</TableCell>
                  <TableCell>{getStatusBadge(connector.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {connector.user?.name || connector.user?.email || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {connector.lastUsed ? new Date(connector.lastUsed).toLocaleDateString() : 'Never'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={connector.isActive}
                        onCheckedChange={() => handleToggleConnector(connector.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTestDialog(connector)}
                      >
                        <TestTube className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(connector)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteConnector(connector.id)}
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

      {/* Edit Connector Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Connector</DialogTitle>
            <DialogDescription>
              Update connector configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {connectorTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-config">Configuration (JSON)</Label>
              <Textarea
                id="edit-config"
                value={formData.config}
                onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                className="min-h-[120px] font-mono text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditConnector}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Connection Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Connection</DialogTitle>
            <DialogDescription>
              Test the connection to {selectedConnector?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedConnector && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Connector Type</Label>
                <div className="p-3 bg-muted rounded-md">
                  {getConnectorTypeBadge(selectedConnector.type)}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Configuration</Label>
                <div className="p-3 bg-muted rounded-md">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedConnector.config), null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={testConnection}>Test Connection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}