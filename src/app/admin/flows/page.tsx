'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GitBranch, 
  Plus, 
  Play, 
  Save, 
  Trash2, 
  Settings, 
  Eye,
  Square,
  Circle,
  Triangle,
  Database,
  Brain,
  Zap,
  Shield,
  FileText,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FlowNode {
  id: string;
  type: 'input' | 'process' | 'decision' | 'output' | 'ai_agent';
  x: number;
  y: number;
  title: string;
  description?: string;
  config: any;
  connections: string[];
}

interface FlowConnection {
  id: string;
  from: string;
  to: string;
  type: 'success' | 'failure' | 'conditional';
}

interface Flow {
  id: string;
  name: string;
  description?: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: string;
  timestamp?: string;
  config?: any;
}

const nodeTypes = [
  { type: 'input', icon: Circle, label: 'Input', color: 'bg-blue-500' },
  { type: 'process', icon: Square, label: 'Process', color: 'bg-green-500' },
  { type: 'decision', icon: Triangle, label: 'Decision', color: 'bg-yellow-500' },
  { type: 'output', icon: Circle, label: 'Output', color: 'bg-purple-500' },
  { type: 'ai_agent', icon: Brain, label: 'AI Agent', color: 'bg-red-500' },
];

const aiAgents = [
  { id: 'grok', name: 'Grok Agent', description: 'Witty DevOps expert with security focus' },
  { id: 'gemini', name: 'Gemini Agent', description: 'Methodical troubleshooter' },
  { id: 'openai', name: 'OpenAI Agent', description: 'Practical developer with code solutions' },
];

export default function FlowBuilder() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowDescription, setNewFlowDescription] = useState('');
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiAgents, setAiAgents] = useState<any[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch flows and AI agents from API
  useEffect(() => {
    fetchFlows();
    fetchAIAgents();
  }, []);

  const fetchAIAgents = async () => {
    try {
      const response = await fetch('/api/agents?userId=default-user');
      if (response.ok) {
        const data = await response.json();
        setAiAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Failed to load AI agents:', error);
    }
  };

  const fetchFlows = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/flows');
      if (!response.ok) {
        throw new Error('Failed to fetch flows');
      }
      const data = await response.json();
      setFlows(data);
      if (data.length > 0) {
        setSelectedFlow(data[0]);
      }
    } catch (error) {
      console.error('Error fetching flows:', error);
      toast({
        title: "Failed to load flows",
        description: "Unable to fetch flows from the server. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };  const handleCreateFlow = async () => {
    if (!newFlowName.trim()) {
      toast({
        title: "Flow name required",
        description: "Please enter a name for your flow.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'admin-user', // In a real app, get from auth context
          name: newFlowName,
          description: newFlowDescription,
          config: { nodes: [], connections: [] }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create flow');
      }

      const newFlow = await response.json();
      setFlows([newFlow, ...flows]);
      setSelectedFlow(newFlow);
      setNewFlowName('');
      setNewFlowDescription('');
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Flow created",
        description: "Your new flow has been created successfully.",
      });
    } catch (error) {
      console.error('Error creating flow:', error);
      toast({
        title: "Failed to create flow",
        description: "Unable to create the flow. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveFlow = async () => {
    if (!selectedFlow) return;

    setIsSaving(true);
    try {
      const flowConfig = {
        nodes: selectedFlow.nodes,
        connections: selectedFlow.connections
      };

      const response = await fetch(`/api/flows/${selectedFlow.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedFlow.name,
          description: selectedFlow.description,
          config: flowConfig,
          isActive: selectedFlow.isActive
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save flow');
      }

      const updatedFlow = await response.json();
      setFlows(flows.map(f => f.id === selectedFlow.id ? updatedFlow : f));
      setSelectedFlow(updatedFlow);
      
      toast({
        title: "Flow saved",
        description: "Your flow has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving flow:', error);
      toast({
        title: "Failed to save flow",
        description: "Unable to save the flow. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    if (!confirm('Are you sure you want to delete this flow? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/flows/${flowId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete flow');
      }

      setFlows(flows.filter(f => f.id !== flowId));
      if (selectedFlow?.id === flowId) {
        setSelectedFlow(flows.length > 1 ? flows.find(f => f.id !== flowId) || null : null);
      }
      
      toast({
        title: "Flow deleted",
        description: "The flow has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting flow:', error);
      toast({
        title: "Failed to delete flow",
        description: "Unable to delete the flow. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleFlow = async (flowId: string) => {
    const flow = flows.find(f => f.id === flowId);
    if (!flow) return;

    try {
      const response = await fetch(`/api/flows/${flowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: flow.name,
          description: flow.description,
          config: flow.config || { nodes: flow.nodes, connections: flow.connections },
          isActive: !flow.isActive
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle flow');
      }

      const updatedFlow = await response.json();
      setFlows(flows.map(f => f.id === flowId ? updatedFlow : f));
      if (selectedFlow?.id === flowId) {
        setSelectedFlow(updatedFlow);
      }
    } catch (error) {
      console.error('Error toggling flow:', error);
      toast({
        title: "Failed to toggle flow",
        description: "Unable to toggle the flow. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddNode = (type: FlowNode['type']) => {
    if (!selectedFlow) return;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      type,
      x: canvasRect ? canvasRect.width / 2 - 50 : 400,
      y: canvasRect ? canvasRect.height / 2 - 25 : 300,
      title: `New ${type}`,
      config: type === 'ai_agent' ? { agentId: 'grok' } : {},
      connections: []
    };

    const updatedFlow = {
      ...selectedFlow,
      nodes: [...selectedFlow.nodes, newNode],
      updatedAt: new Date().toISOString()
    };

    setSelectedFlow(updatedFlow);
    setFlows(flows.map(f => f.id === selectedFlow.id ? updatedFlow : f));
  };

  const handleNodeClick = (node: FlowNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(node);
    setIsNodeDialogOpen(true);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (connectingFrom) {
      setConnectingFrom(null);
    }
    setSelectedNode(null);
  };

  const handleNodeDrag = (nodeId: string, e: React.MouseEvent) => {
    if (!selectedFlow) return;
    
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;

    const updatedFlow = {
      ...selectedFlow,
      nodes: selectedFlow.nodes.map(node =>
        node.id === nodeId ? { ...node, x, y } : node
      ),
      updatedAt: new Date().toISOString()
    };

    setSelectedFlow(updatedFlow);
    setFlows(flows.map(f => f.id === selectedFlow.id ? updatedFlow : f));
  };

  const handleConnectNodes = (fromNodeId: string, toNodeId: string) => {
    if (!selectedFlow || fromNodeId === toNodeId) return;

    const newConnection: FlowConnection = {
      id: `conn-${Date.now()}`,
      from: fromNodeId,
      to: toNodeId,
      type: 'success'
    };

    const updatedFlow = {
      ...selectedFlow,
      connections: [...selectedFlow.connections, newConnection],
      nodes: selectedFlow.nodes.map(node =>
        node.id === fromNodeId 
          ? { ...node, connections: [...node.connections, toNodeId] }
          : node
      ),
      updatedAt: new Date().toISOString()
    };

    setSelectedFlow(updatedFlow);
    setFlows(flows.map(f => f.id === selectedFlow.id ? updatedFlow : f));
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!selectedFlow) return;

    const updatedFlow = {
      ...selectedFlow,
      nodes: selectedFlow.nodes.filter(node => node.id !== nodeId),
      connections: selectedFlow.connections.filter(
        conn => conn.from !== nodeId && conn.to !== nodeId
      ),
      updatedAt: new Date().toISOString()
    };

    setSelectedFlow(updatedFlow);
    setFlows(flows.map(f => f.id === selectedFlow.id ? updatedFlow : f));
    setIsNodeDialogOpen(false);
  };

  const renderNode = (node: FlowNode) => {
    const nodeType = nodeTypes.find(nt => nt.type === node.type);
    const Icon = nodeType?.icon || Circle;
    const isSelected = selectedNode?.id === node.id;

    return (
      <div
        key={node.id}
        className={`absolute cursor-move select-none ${isSelected ? 'ring-2 ring-primary' : ''}`}
        style={{ left: node.x, top: node.y }}
        onClick={(e) => handleNodeClick(node, e)}
        onMouseDown={() => setDraggingNode(node.id)}
      >
        <div className={`w-20 h-20 ${nodeType?.color || 'bg-gray-500'} rounded-lg flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-shadow`}>
          <Icon className="h-8 w-8" />
        </div>
        <div className="mt-2 text-center">
          <div className="text-sm font-medium">{node.title}</div>
          <div className="text-xs text-muted-foreground">{nodeType?.label}</div>
        </div>
      </div>
    );
  };

  const renderConnection = (connection: FlowConnection) => {
    if (!selectedFlow) return null;

    const fromNode = selectedFlow.nodes.find(n => n.id === connection.from);
    const toNode = selectedFlow.nodes.find(n => n.id === connection.to);

    if (!fromNode || !toNode) return null;

    const x1 = fromNode.x + 40;
    const y1 = fromNode.y + 40;
    const x2 = toNode.x + 40;
    const y2 = toNode.y + 40;

    return (
      <svg
        key={connection.id}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      >
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={connection.type === 'success' ? '#10b981' : connection.type === 'failure' ? '#ef4444' : '#f59e0b'}
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading flows...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flow Builder</h1>
          <p className="text-muted-foreground">
            Create and manage analysis logic flows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Flow
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Flow</DialogTitle>
                <DialogDescription>
                  Create a new analysis flow
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="flow-name">Flow Name</Label>
                  <Input
                    id="flow-name"
                    value={newFlowName}
                    onChange={(e) => setNewFlowName(e.target.value)}
                    placeholder="My Analysis Flow"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flow-description">Description</Label>
                  <Textarea
                    id="flow-description"
                    value={newFlowDescription}
                    onChange={(e) => setNewFlowDescription(e.target.value)}
                    placeholder="Describe your flow..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFlow}>Create Flow</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleSaveFlow} disabled={!selectedFlow || isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Flow List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Flows</CardTitle>
            <CardDescription>
              Available analysis flows
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {flows.map((flow) => (
              <div
                key={flow.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedFlow?.id === flow.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`}
                onClick={() => setSelectedFlow(flow)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{flow.name}</div>
                    <div className="text-xs opacity-70">
                      {flow.user && `by ${flow.user}`}
                    </div>
                    <div className="text-xs opacity-70">
                      {flow.timestamp || new Date(flow.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={flow.isActive ? 'default' : 'secondary'}>
                      {flow.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFlow(flow.id);
                      }}
                    >
                      {flow.isActive ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFlow(flow.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {flows.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No flows found. Create your first flow to get started.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Flow Canvas */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Flow Canvas</CardTitle>
                <CardDescription>
                  {selectedFlow ? selectedFlow.name : 'Select a flow to edit'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {nodeTypes.map((nodeType) => (
                  <Button
                    key={nodeType.type}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddNode(nodeType.type as FlowNode['type'])}
                    disabled={!selectedFlow}
                  >
                    <nodeType.icon className="h-4 w-4 mr-1" />
                    {nodeType.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedFlow ? (
              <div
                ref={canvasRef}
                className="relative w-full h-96 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden"
                onClick={handleCanvasClick}
                onMouseMove={(e) => {
                  if (draggingNode) {
                    handleNodeDrag(draggingNode, e);
                  }
                }}
                onMouseUp={() => setDraggingNode(null)}
                onMouseLeave={() => setDraggingNode(null)}
              >
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="currentColor"
                      />
                    </marker>
                  </defs>
                </svg>
                
                {selectedFlow.connections.map(renderConnection)}
                {selectedFlow.nodes.map(renderNode)}
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 text-muted-foreground">
                Select a flow from the list to start editing
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Node Edit Dialog */}
      <Dialog open={isNodeDialogOpen} onOpenChange={setIsNodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Node</DialogTitle>
            <DialogDescription>
              Configure node properties
            </DialogDescription>
          </DialogHeader>
          {selectedNode && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="node-title">Title</Label>
                <Input
                  id="node-title"
                  value={selectedNode.title}
                  onChange={(e) => {
                    if (!selectedFlow) return;
                    const updatedNodes = selectedFlow.nodes.map(node =>
                      node.id === selectedNode.id ? { ...node, title: e.target.value } : node
                    );
                    const updatedFlow = { ...selectedFlow, nodes: updatedNodes };
                    setSelectedFlow(updatedFlow);
                    setFlows(flows.map(f => f.id === selectedFlow.id ? updatedFlow : f));
                  }}
                />
              </div>
              
              {selectedNode.type === 'ai_agent' && (
                <div className="space-y-2">
                  <Label htmlFor="ai-agent">AI Agent</Label>
                  <Select
                    value={selectedNode.config.agentId}
                    onValueChange={(value) => {
                      if (!selectedFlow) return;
                      const updatedNodes = selectedFlow.nodes.map(node =>
                        node.id === selectedNode.id 
                          ? { ...node, config: { ...node.config, agentId: value } }
                          : node
                      );
                      const updatedFlow = { ...selectedFlow, nodes: updatedNodes };
                      setSelectedFlow(updatedFlow);
                      setFlows(flows.map(f => f.id === selectedFlow.id ? updatedFlow : f));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiAgents.map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="node-description">Description</Label>
                <Textarea
                  id="node-description"
                  value={selectedNode.description || ''}
                  onChange={(e) => {
                    if (!selectedFlow) return;
                    const updatedNodes = selectedFlow.nodes.map(node =>
                      node.id === selectedNode.id ? { ...node, description: e.target.value } : node
                    );
                    const updatedFlow = { ...selectedFlow, nodes: updatedNodes };
                    setSelectedFlow(updatedFlow);
                    setFlows(flows.map(f => f.id === selectedFlow.id ? updatedFlow : f));
                  }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNodeDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedNode && handleDeleteNode(selectedNode.id)}
            >
              Delete Node
            </Button>
            <Button onClick={() => setIsNodeDialogOpen(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}