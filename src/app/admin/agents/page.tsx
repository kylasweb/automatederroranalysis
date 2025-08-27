'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Bot, 
  Settings, 
  Play, 
  Pause, 
  Copy,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIAgent {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: string; // analyzer, classifier, predictor, summarizer, custom
  provider: string;
  model: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  isActive: boolean;
  lastUsed?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const AI_PROVIDERS = [
  { value: 'groq', label: 'Groq' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'huggingface', label: 'Hugging Face' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'together', label: 'Together AI' },
  { value: 'mistral', label: 'Mistral AI' },
  { value: 'cohere', label: 'Cohere' },
  { value: 'zai', label: 'Z.ai' },
];

const AGENT_TYPES = [
  { value: 'analyzer', label: 'Analyzer' },
  { value: 'classifier', label: 'Classifier' },
  { value: 'predictor', label: 'Predictor' },
  { value: 'summarizer', label: 'Summarizer' },
  { value: 'custom', label: 'Custom' },
];

const MODELS_BY_PROVIDER = {
  groq: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
  huggingface: ['microsoft/DialoGPT-medium', 'microsoft/DialoGPT-large'],
  openrouter: ['meta-llama/llama-3.1-8b-instruct:free', 'microsoft/wizardlm-2-8x22b'],
  together: ['meta-llama/Llama-3-8b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
  mistral: ['mistral-7b-instruct', 'mixtral-8x7b-instruct'],
  cohere: ['command-light', 'command'],
  zai: ['gpt-4o-mini', 'claude-3-haiku'],
};

export default function AIAgentsPage() {
  const { toast } = useToast();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('groq');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'analyzer',
    provider: 'groq',
    model: 'llama-3.1-70b-versatile',
    prompt: '',
    temperature: 0.3,
    maxTokens: 2000,
    isActive: true,
  });

  // Load agents from API
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const response = await fetch('/api/agents?userId=default-user');
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      } else {
        console.error('Failed to load agents');
        toast({
          title: "Error",
          description: "Failed to load agents",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      toast({
        title: "Error",
        description: "Failed to load agents",
        variant: "destructive",
      });
    }
  };

  const handleCreateAgent = async () => {
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: 'default-user',
          prompt: formData.systemPrompt,
        }),
      });

      if (response.ok) {
        await loadAgents(); // Reload agents list
        setIsCreateDialogOpen(false);
        resetForm();
        
        toast({
          title: "Agent Created",
          description: `${formData.name} has been created successfully.`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to create agent",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: "Error",
        description: "Failed to create agent",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAgent = async () => {
    if (!editingAgent) return;

    try {
      const response = await fetch(`/api/agents/${editingAgent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          prompt: formData.systemPrompt,
        }),
      });

      if (response.ok) {
        await loadAgents(); // Reload agents list
        setEditingAgent(null);
        setIsCreateDialogOpen(false);
        resetForm();
        
        toast({
          title: "Agent Updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to update agent",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating agent:', error);
      toast({
        title: "Error",
        description: "Failed to update agent",
        variant: "destructive",
      });
    }

    const updatedAgents = agents.map(agent =>
      agent.id === editingAgent.id
        ? { ...agent, ...formData }
        : agent
    );

    setAgents(updatedAgents);
    setEditingAgent(null);
    resetForm();
    
    toast({
      title: "Agent Updated",
      description: `${formData.name} has been updated successfully.`,
    });
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const agent = agents.find(a => a.id === agentId);
        await loadAgents(); // Reload agents list
        
        toast({
          title: "Agent Deleted",
          description: `${agent?.name} has been deleted.`,
          variant: "destructive",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete agent",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast({
        title: "Error",
        description: "Failed to delete agent",
        variant: "destructive",
      });
    }
  };

  const handleToggleAgent = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle',
        }),
      });

      if (response.ok) {
        await loadAgents(); // Reload agents list
        const agent = agents.find(a => a.id === agentId);
        
        toast({
          title: agent?.isActive ? "Agent Deactivated" : "Agent Activated",
          description: `${agent?.name} is now ${agent?.isActive ? 'inactive' : 'active'}.`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to toggle agent",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error toggling agent:', error);
      toast({
        title: "Error",
        description: "Failed to toggle agent",
        variant: "destructive",
      });
    }
  };

  const handleCloneAgent = async (agent: AIAgent) => {
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${agent.name} (Copy)`,
          description: agent.description,
          type: agent.type || 'custom',
          provider: agent.provider,
          model: agent.model,
          prompt: agent.systemPrompt,
          temperature: agent.temperature,
          maxTokens: agent.maxTokens,
          isActive: agent.isActive,
          userId: 'default-user',
        }),
      });

      if (response.ok) {
        await loadAgents(); // Reload agents list
        
        toast({
          title: "Agent Cloned",
          description: `${agent.name} (Copy) has been created.`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to clone agent",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error cloning agent:', error);
      toast({
        title: "Error",
        description: "Failed to clone agent",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (agent: AIAgent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description,
      provider: agent.provider,
      model: agent.model,
      systemPrompt: agent.systemPrompt,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      isActive: agent.isActive,
    });
    setSelectedProvider(agent.provider);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      provider: 'groq',
      model: 'llama-3.1-70b-versatile',
      systemPrompt: '',
      temperature: 0.3,
      maxTokens: 2000,
      isActive: true,
    });
    setSelectedProvider('groq');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground">
            Create and manage AI agents for log analysis and error detection
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create AI Agent</DialogTitle>
              <DialogDescription>
                Configure a new AI agent for log analysis tasks
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Error Analyzer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">AI Provider</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value) => {
                      setFormData({ 
                        ...formData, 
                        provider: value,
                        model: MODELS_BY_PROVIDER[value as keyof typeof MODELS_BY_PROVIDER][0]
                      });
                      setSelectedProvider(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_PROVIDERS.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this agent specializes in..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select
                    value={formData.model}
                    onValueChange={(value) => setFormData({ ...formData, model: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODELS_BY_PROVIDER[selectedProvider as keyof typeof MODELS_BY_PROVIDER].map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature ({formData.temperature})</Label>
                  <Input
                    id="temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={formData.maxTokens}
                    onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  placeholder="You are an expert system administrator..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAgent}>
                  Create Agent
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Agents</p>
                <p className="text-2xl font-bold">{agents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Active Agents</p>
                <p className="text-2xl font-bold">{agents.filter(a => a.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Usage</p>
                <p className="text-2xl font-bold">{agents.reduce((sum, a) => sum + a.usageCount, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Providers</p>
                <p className="text-2xl font-bold">{new Set(agents.map(a => a.provider)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>AI Agents</CardTitle>
          <CardDescription>
            Manage your AI agents and their configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm text-muted-foreground">{agent.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{agent.provider}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{agent.model}</TableCell>
                  <TableCell>
                    <Badge variant={agent.isActive ? "default" : "secondary"}>
                      {agent.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{agent.usageCount}</TableCell>
                  <TableCell>
                    {agent.lastUsed ? new Date(agent.lastUsed).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAgent(agent.id)}
                      >
                        {agent.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(agent)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCloneAgent(agent)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAgent(agent.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingAgent} onOpenChange={() => setEditingAgent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit AI Agent</DialogTitle>
            <DialogDescription>
              Update the configuration for {editingAgent?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Agent Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-provider">AI Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      provider: value,
                      model: MODELS_BY_PROVIDER[value as keyof typeof MODELS_BY_PROVIDER][0]
                    });
                    setSelectedProvider(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-model">Model</Label>
                <Select
                  value={formData.model}
                  onValueChange={(value) => setFormData({ ...formData, model: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS_BY_PROVIDER[selectedProvider as keyof typeof MODELS_BY_PROVIDER].map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-temperature">Temperature ({formData.temperature})</Label>
                <Input
                  id="edit-temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-maxTokens">Max Tokens</Label>
                <Input
                  id="edit-maxTokens"
                  type="number"
                  value={formData.maxTokens}
                  onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-systemPrompt">System Prompt</Label>
              <Textarea
                id="edit-systemPrompt"
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingAgent(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAgent}>
                Update Agent
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
