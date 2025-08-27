'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Info,
  Plus,
  Trash2,
  TestTube
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamsConfig {
  webhookUrl: string;
  channel?: string;
  title?: string;
  color?: string;
  mentionUsers?: string[];
  mentionGroups?: string[];
}

interface TeamsConnectorConfigProps {
  config?: TeamsConfig;
  onChange: (config: TeamsConfig) => void;
  onTest?: (config: TeamsConfig) => Promise<void>;
  isTesting?: boolean;
}

export default function TeamsConnectorConfig({ 
  config, 
  onChange, 
  onTest, 
  isTesting = false 
}: TeamsConnectorConfigProps) {
  const { toast } = useToast();
  const [localConfig, setLocalConfig] = useState<TeamsConfig>({
    webhookUrl: '',
    channel: 'General',
    title: 'System Notification',
    color: '0076D7',
    mentionUsers: [],
    mentionGroups: [],
    ...config
  });

  const [newMentionUser, setNewMentionUser] = useState('');
  const [newMentionGroup, setNewMentionGroup] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    setLocalConfig(prev => ({
      ...prev,
      ...config
    }));
  }, [config]);

  const handleConfigChange = (field: keyof TeamsConfig, value: any) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  const addMentionUser = () => {
    if (newMentionUser.trim() && !localConfig.mentionUsers?.includes(newMentionUser.trim())) {
      const updatedUsers = [...(localConfig.mentionUsers || []), newMentionUser.trim()];
      handleConfigChange('mentionUsers', updatedUsers);
      setNewMentionUser('');
    }
  };

  const removeMentionUser = (user: string) => {
    const updatedUsers = localConfig.mentionUsers?.filter(u => u !== user) || [];
    handleConfigChange('mentionUsers', updatedUsers);
  };

  const addMentionGroup = () => {
    if (newMentionGroup.trim() && !localConfig.mentionGroups?.includes(newMentionGroup.trim())) {
      const updatedGroups = [...(localConfig.mentionGroups || []), newMentionGroup.trim()];
      handleConfigChange('mentionGroups', updatedGroups);
      setNewMentionGroup('');
    }
  };

  const removeMentionGroup = (group: string) => {
    const updatedGroups = localConfig.mentionGroups?.filter(g => g !== group) || [];
    handleConfigChange('mentionGroups', updatedGroups);
  };

  const validateWebhookUrl = async (url: string) => {
    if (!url) return false;
    
    try {
      setIsValidating(true);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Validation Test',
          text: 'Testing webhook URL validation',
          themeColor: '28A745'
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('Webhook validation failed:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleTestConnection = async () => {
    if (!localConfig.webhookUrl) {
      toast({
        title: "Validation Error",
        description: "Webhook URL is required",
        variant: "destructive",
      });
      return;
    }

    if (onTest) {
      await onTest(localConfig);
    }
  };

  const isValidWebhook = localConfig.webhookUrl && localConfig.webhookUrl.startsWith('https://');

  return (
    <div className="space-y-6">
      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Microsoft Teams Configuration
          </CardTitle>
          <CardDescription>
            Configure your Microsoft Teams integration to send notifications and alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url" className="flex items-center gap-2">
              Webhook URL
              {isValidWebhook ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </Label>
            <Input
              id="webhook-url"
              value={localConfig.webhookUrl}
              onChange={(e) => handleConfigChange('webhookUrl', e.target.value)}
              placeholder="https://your-tenant.webhook.office.com/webhookb2/..."
              className={isValidWebhook ? "border-green-500" : "border-red-500"}
            />
            <p className="text-sm text-muted-foreground">
              Create an incoming webhook in your Teams channel to get this URL.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="channel">Default Channel</Label>
              <Input
                id="channel"
                value={localConfig.channel || ''}
                onChange={(e) => handleConfigChange('channel', e.target.value)}
                placeholder="General"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Default Title</Label>
              <Input
                id="title"
                value={localConfig.title || ''}
                onChange={(e) => handleConfigChange('title', e.target.value)}
                placeholder="System Notification"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Theme Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                value={localConfig.color || ''}
                onChange={(e) => handleConfigChange('color', e.target.value)}
                placeholder="0076D7"
                className="w-32"
              />
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: `#${localConfig.color || '0076D7'}` }}
              />
              <span className="text-sm text-muted-foreground">
                Hex color code (without #)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mentions Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Mentions Configuration
          </CardTitle>
          <CardDescription>
            Configure users and groups to mention in notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Mentions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Mention Users</Label>
            <div className="flex gap-2">
              <Input
                value={newMentionUser}
                onChange={(e) => setNewMentionUser(e.target.value)}
                placeholder="Enter user email or name"
                onKeyPress={(e) => e.key === 'Enter' && addMentionUser()}
              />
              <Button 
                type="button" 
                size="sm" 
                onClick={addMentionUser}
                disabled={!newMentionUser.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {localConfig.mentionUsers?.map((user) => (
                <Badge key={user} variant="secondary" className="flex items-center gap-1">
                  {user}
                  <button
                    onClick={() => removeMentionUser(user)}
                    className="ml-1 hover:text-red-500"
                  >
                    <XCircle className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Group Mentions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Mention Groups</Label>
            <div className="flex gap-2">
              <Input
                value={newMentionGroup}
                onChange={(e) => setNewMentionGroup(e.target.value)}
                placeholder="Enter group name"
                onKeyPress={(e) => e.key === 'Enter' && addMentionGroup()}
              />
              <Button 
                type="button" 
                size="sm" 
                onClick={addMentionGroup}
                disabled={!newMentionGroup.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {localConfig.mentionGroups?.map((group) => (
                <Badge key={group} variant="secondary" className="flex items-center gap-1">
                  {group}
                  <button
                    onClick={() => removeMentionGroup(group)}
                    className="ml-1 hover:text-red-500"
                  >
                    <XCircle className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Configuration
          </CardTitle>
          <CardDescription>
            Test your Teams integration to ensure it's working correctly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Connection Status</p>
              <p className="text-sm text-muted-foreground">
                {isValidWebhook 
                  ? "Webhook URL is valid and ready to test" 
                  : "Please enter a valid webhook URL"
                }
              </p>
            </div>
            <Button
              onClick={handleTestConnection}
              disabled={!isValidWebhook || isTesting}
              className="flex items-center gap-2"
            >
              {isTesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4" />
                  Test Connection
                </>
              )}
            </Button>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">How to set up Teams webhook:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-muted-foreground">
                  <li>Go to your Teams channel</li>
                  <li>Click on the three dots (•••) and select "Connectors"</li>
                  <li>Find "Incoming Webhook" and click "Add"</li>
                  <li>Provide a name and upload an image (optional)</li>
                  <li>Click "Create" and copy the webhook URL</li>
                  <li>Paste the URL above and test the connection</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Preview</CardTitle>
          <CardDescription>
            This is how your configuration will be saved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={JSON.stringify(localConfig, null, 2)}
            readOnly
            className="min-h-[150px] font-mono text-sm"
          />
        </CardContent>
      </Card>
    </div>
  );
}