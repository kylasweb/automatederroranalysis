'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Brain, Github, ExternalLink, MessageSquare, Loader2, Key, Settings, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalysisResult {
  id: string;
  timestamp: string;
  techStack: string;
  environment: string;
  analysis: string;
  confidence: number;
  source: string;
  isIntermittent?: boolean;
  needsFix?: boolean;
}

interface LLMApiKeys {
  openai?: string;
  google?: string;
  anthropic?: string;
  grok?: string;
}

export default function Home() {
  const [logContent, setLogContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<LLMApiKeys>({});
  const [useCustomKeys, setUseCustomKeys] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load API keys from localStorage on component mount (client-side only)
  useEffect(() => {
    const savedKeys = localStorage.getItem('llmApiKeys');
    const savedUseCustom = localStorage.getItem('useCustomKeys');
    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys));
    }
    if (savedUseCustom) {
      setUseCustomKeys(savedUseCustom === 'true');
    }
  }, []);

  // Save API keys to localStorage whenever they change
  const saveApiKeys = (keys: LLMApiKeys) => {
    setApiKeys(keys);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('llmApiKeys', JSON.stringify(keys));
    }
  };

  const saveUseCustomKeys = (useCustom: boolean) => {
    setUseCustomKeys(useCustom);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('useCustomKeys', useCustom.toString());
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      // Clear previous analysis results when new file is uploaded
      setAnalysisResult(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setLogContent(content);
      };
      reader.readAsText(file);
      
      toast({
        title: "File uploaded",
        description: `${file.name} has been loaded successfully.`,
      });
    }
  };

  const handleAnalyze = async () => {
    if (!logContent.trim()) {
      toast({
        title: "No content to analyze",
        description: "Please upload a file or paste log content.",
        variant: "destructive",
      });
      return;
    }

    // Check if custom API keys are enabled but none are provided
    if (useCustomKeys && !Object.values(apiKeys).some(key => key)) {
      toast({
        title: "API keys required",
        description: "Please configure at least one API key or disable custom API keys.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/analyze-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          logContent, 
          userId: null,
          apiKeys: useCustomKeys ? apiKeys : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result);
      
      toast({
        title: "Analysis complete",
        description: "Your log has been analyzed successfully.",
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An error occurred while analyzing your log.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const TeamsNotificationDialog = ({ analysisResult, notificationType }: { analysisResult: AnalysisResult; notificationType: 'intermittent' | 'bug' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [connectors, setConnectors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();

    const fetchConnectors = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/connectors');
        if (response.ok) {
          const data = await response.json();
          const teamsConnectors = data.filter((conn: any) => conn.type === 'TEAMS' && conn.isActive);
          setConnectors(teamsConnectors);
        }
      } catch (error) {
        console.error('Error fetching connectors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleSendNotification = async () => {
      if (!selectedConnector || !analysisResult) return;

      setIsSending(true);
      try {
        const response = await fetch('/api/teams/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            analysisId: analysisResult.id,
            notificationType,
            connectorId: selectedConnector,
          }),
        });

        if (response.ok) {
          toast({
            title: "Notification sent",
            description: `${notificationType === 'intermittent' ? 'Intermittent issue' : 'Bug'} notification has been sent to Teams successfully.`,
          });
          setIsOpen(false);
        } else {
          throw new Error('Failed to send notification');
        }
      } catch (error) {
        toast({
          title: "Failed to send",
          description: "Unable to send notification to Teams.",
          variant: "destructive",
        });
      } finally {
        setIsSending(false);
      }
    };

    useEffect(() => {
      if (isOpen) {
        fetchConnectors();
      }
    }, [isOpen]);

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            {notificationType === 'intermittent' ? 'Notify Testers' : 'Report Bug'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {notificationType === 'intermittent' ? 'Notify Testers' : 'Report Bug to Team'}
            </DialogTitle>
            <DialogDescription>
              {notificationType === 'intermittent' 
                ? 'Send notification to testers about intermittent issue and cluster re-provisioning'
                : 'Report bug to developers and testers for code fix'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                Loading connectors...
              </div>
            ) : connectors.length === 0 ? (
              <div className="text-center py-4">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-4">
                  No Teams connectors configured
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsOpen(false);
                    window.open('/admin/connectors', '_blank');
                  }}
                >
                  Configure Teams Connector
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Label>Select Teams Connector</Label>
                <div className="space-y-2">
                  {connectors.map((connector) => (
                    <div
                      key={connector.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedConnector === connector.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedConnector(connector.id)}
                    >
                      <div className="font-medium">{connector.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {JSON.parse(connector.config)?.channel || 'General'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            {connectors.length > 0 && (
              <Button 
                onClick={handleSendNotification}
                disabled={!selectedConnector || !analysisResult || isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  `Send ${notificationType === 'intermittent' ? 'Notification' : 'Bug Report'}`
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const TeamsConnectorDialog = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [connectors, setConnectors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedConnector, setSelectedConnector] = useState<string | null>(null);

    const fetchConnectors = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/connectors');
        if (response.ok) {
          const data = await response.json();
          const teamsConnectors = data.filter((conn: any) => conn.type === 'TEAMS' && conn.isActive);
          setConnectors(teamsConnectors);
        }
      } catch (error) {
        console.error('Error fetching connectors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleSendToTeams = async () => {
      if (!selectedConnector || !analysisResult) return;

      try {
        const response = await fetch('/api/connectors/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            connectorId: selectedConnector,
            message: `Analysis Results:\n\n${analysisResult.analysis}`,
            title: `Log Analysis - ${analysisResult.techStack}`,
          }),
        });

        if (response.ok) {
          toast({
            title: "Sent to Teams",
            description: "Analysis results have been shared to Teams successfully.",
          });
          setIsOpen(false);
        } else {
          throw new Error('Failed to send to Teams');
        }
      } catch (error) {
        toast({
          title: "Failed to send",
          description: "Unable to send analysis results to Teams.",
          variant: "destructive",
        });
      }
    };

    useEffect(() => {
      if (isOpen) {
        fetchConnectors();
      }
    }, [isOpen]);

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2">
            <MessageSquare className="h-4 w-4" />
            Connect to Teams
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send to Teams</DialogTitle>
            <DialogDescription>
              Share your analysis results with Microsoft Teams
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                Loading connectors...
              </div>
            ) : connectors.length === 0 ? (
              <div className="text-center py-4">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-4">
                  No Teams connectors configured
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsOpen(false);
                    window.open('/admin/connectors', '_blank');
                  }}
                >
                  Configure Teams Connector
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Label>Select Teams Connector</Label>
                <div className="space-y-2">
                  {connectors.map((connector) => (
                    <div
                      key={connector.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedConnector === connector.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedConnector(connector.id)}
                    >
                      <div className="font-medium">{connector.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {connector.config?.channel || 'General'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            {connectors.length > 0 && (
              <Button 
                onClick={handleSendToTeams}
                disabled={!selectedConnector || !analysisResult}
              >
                Send to Teams
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const ConnectorDialog = ({ toolName, icon: Icon }: { toolName: string; icon: React.ElementType }) => {
    if (toolName === 'Teams') {
      return <TeamsConnectorDialog />;
    }
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Icon className="h-4 w-4" />
            Connect to {toolName}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to {toolName}</DialogTitle>
            <DialogDescription>
              Feature coming soon: This will connect to {toolName} to share analysis results and create new issues.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  };

  const ApiKeyConfig = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="custom-keys"
          checked={useCustomKeys}
          onCheckedChange={saveUseCustomKeys}
        />
        <Label htmlFor="custom-keys">Use custom LLM API keys</Label>
      </div>
      
      {useCustomKeys && (
        <Tabs defaultValue="openai" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
            <TabsTrigger value="grok">Grok</TabsTrigger>
          </TabsList>
          
          <TabsContent value="openai" className="space-y-2">
            <Label htmlFor="openai-key">OpenAI API Key</Label>
            <Input
              id="openai-key"
              type="password"
              placeholder="sk-..."
              value={apiKeys.openai || ''}
              onChange={(e) => saveApiKeys({ ...apiKeys, openai: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from OpenAI dashboard
            </p>
          </TabsContent>
          
          <TabsContent value="google" className="space-y-2">
            <Label htmlFor="google-key">Google AI API Key</Label>
            <Input
              id="google-key"
              type="password"
              placeholder="AIza..."
              value={apiKeys.google || ''}
              onChange={(e) => saveApiKeys({ ...apiKeys, google: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from Google AI Studio
            </p>
          </TabsContent>
          
          <TabsContent value="anthropic" className="space-y-2">
            <Label htmlFor="anthropic-key">Anthropic API Key</Label>
            <Input
              id="anthropic-key"
              type="password"
              placeholder="sk-ant-..."
              value={apiKeys.anthropic || ''}
              onChange={(e) => saveApiKeys({ ...apiKeys, anthropic: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from Anthropic Console
            </p>
          </TabsContent>
          
          <TabsContent value="grok" className="space-y-2">
            <Label htmlFor="grok-key">Grok API Key</Label>
            <Input
              id="grok-key"
              type="password"
              placeholder="xai-..."
              value={apiKeys.grok || ''}
              onChange={(e) => saveApiKeys({ ...apiKeys, grok: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from xAI platform
            </p>
          </TabsContent>
        </Tabs>
      )}
      
      <div className="text-xs text-muted-foreground">
        <p>Your API keys are stored locally in your browser and are never sent to our servers.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">LogAllot Provision Error Log Analysis</h1>
          <p className="text-xl text-muted-foreground">
            AI-powered DevOps error analysis and debugging platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Input */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Log Input
                </CardTitle>
                <CardDescription>
                  Upload an error log file or paste log content directly (max 10MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".log,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload File
                  </Button>
                  {selectedFile && (
                    <Badge variant="secondary">
                      {selectedFile.name}
                    </Badge>
                  )}
                </div>

                <Separator />

                {/* Text Area */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Or paste log content:</label>
                  <Textarea
                    placeholder="Paste your error logs here..."
                    value={logContent}
                    onChange={(e) => {
                      setLogContent(e.target.value);
                      // Clear previous analysis results when new content is pasted
                      if (e.target.value !== logContent) {
                        setAnalysisResult(null);
                      }
                    }}
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>

                {/* API Configuration */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">AI Configuration</Label>
                    <Dialog open={isApiDialogOpen} onOpenChange={setIsApiDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          Configure
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>LLM API Configuration</DialogTitle>
                          <DialogDescription>
                            Configure your own LLM API keys for analysis
                          </DialogDescription>
                        </DialogHeader>
                        <ApiKeyConfig />
                        <DialogFooter>
                          <Button onClick={() => setIsApiDialogOpen(false)}>
                            Save Configuration
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={useCustomKeys ? "default" : "secondary"}>
                      {useCustomKeys ? "Custom API Keys" : "Default AI Services"}
                    </Badge>
                    {useCustomKeys && (
                      <Badge variant="outline">
                        {Object.values(apiKeys).filter(Boolean).length} keys configured
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Analyze Button */}
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !logContent.trim()}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      Analyze Log
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysisResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Analysis Results
                  </CardTitle>
                  <CardDescription>
                    AI-powered analysis of your error logs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      Tech Stack: {analysisResult.techStack}
                    </Badge>
                    <Badge variant="outline">
                      Environment: {analysisResult.environment}
                    </Badge>
                    <Badge variant="outline">
                      Source: {analysisResult.source}
                    </Badge>
                    <Badge variant={analysisResult.confidence > 0.7 ? "default" : "secondary"}>
                      Confidence: {Math.round(analysisResult.confidence * 100)}%
                    </Badge>
                    {analysisResult.isIntermittent && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        🔄 Intermittent Issue
                      </Badge>
                    )}
                    {analysisResult.needsFix && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        🐛 Needs Fix
                      </Badge>
                    )}
                  </div>

                  {/* Issue Type Recommendation */}
                  {(analysisResult.isIntermittent || analysisResult.needsFix) && (
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-semibold mb-2">Issue Analysis & Recommendation</h4>
                      {analysisResult.isIntermittent ? (
                        <div className="space-y-2">
                          <p className="text-sm text-green-700 font-medium">
                            🔄 This appears to be an intermittent issue that can be resolved by re-provisioning the cluster.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Recommendation: Re-provision the cluster to resolve this issue. No code changes are required.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-red-700 font-medium">
                            🐛 This issue requires a code fix to resolve permanently.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Recommendation: Implement the necessary code changes to fix this issue.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="prose prose-sm max-w-none">
                    <div 
                      dangerouslySetInnerHTML={{ __html: analysisResult.analysis.replace(/\n/g, '<br>') }}
                      className="whitespace-pre-wrap text-sm"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <TeamsNotificationDialog 
                      analysisResult={analysisResult}
                      notificationType={analysisResult.isIntermittent ? 'intermittent' : 'bug'}
                    />
                    <Button variant="outline" size="sm" onClick={() => {
                      navigator.clipboard.writeText(analysisResult.analysis);
                      toast({
                        title: "Copied to clipboard",
                        description: "Analysis has been copied to your clipboard.",
                      });
                    }}>
                      Copy Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Connectors */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connectors</CardTitle>
                <CardDescription>
                  Integrate with your favorite tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ConnectorDialog toolName="Teams" icon={MessageSquare} />
                <ConnectorDialog toolName="Jira" icon={ExternalLink} />
                <ConnectorDialog toolName="GitHub" icon={Github} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Admin Access Button */}
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="fixed bottom-6 right-6 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-muted/80 hover:border-border transition-all duration-200 opacity-30 hover:opacity-100"
        title="Admin Access"
      >
        <a href="/admin">
          <Shield className="h-4 w-4 text-muted-foreground" />
        </a>
      </Button>
    </div>
  );
}