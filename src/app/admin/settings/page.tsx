'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Database,
  Brain,
  Shield,
  Bell,
  Users,
  Zap,
  Globe,
  Key,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  category: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  updatedAt: string;
}

interface SettingsByCategory {
  [category: string]: SystemSetting[];
}

const defaultSettings = {
  general: [
    { key: 'app_name', value: 'LogAllot Provision Error Log Analysis', description: 'Application name', type: 'string' as const },
    { key: 'max_file_size', value: 10485760, description: 'Maximum file upload size in bytes', type: 'number' as const },
  ],
  features: [
    { key: 'enable_ocr', value: true, description: 'Enable OCR functionality', type: 'boolean' as const },
  ],
  ai: [
    { key: 'ai_provider', value: 'z.ai', description: 'Primary AI provider for analysis', type: 'string' as const },
    { key: 'ai_timeout', value: 30000, description: 'AI analysis timeout in milliseconds', type: 'number' as const },
    { key: 'ai_max_tokens', value: 2000, description: 'Maximum tokens for AI responses', type: 'number' as const },
    { key: 'ai_temperature', value: 0.3, description: 'AI temperature (0.0 - 1.0)', type: 'number' as const },
    
    // Z.ai Configuration
    { key: 'zai_api_key', value: '', description: 'Z.ai API Key', type: 'string' as const },
    { key: 'zai_base_url', value: 'https://api.z.ai', description: 'Z.ai Base URL', type: 'string' as const },
    
    // OpenAI Configuration
    { key: 'openai_api_key', value: '', description: 'OpenAI API Key', type: 'string' as const },
    { key: 'openai_model', value: 'gpt-4o-mini', description: 'OpenAI Model', type: 'string' as const },
    
    // Groq Configuration  
    { key: 'groq_api_key', value: '', description: 'Groq API Key (Free tier available)', type: 'string' as const },
    { key: 'groq_model', value: 'llama-3.1-70b-versatile', description: 'Groq Model', type: 'string' as const },
    
    // Hugging Face Configuration
    { key: 'huggingface_api_key', value: '', description: 'Hugging Face API Key (Free tier available)', type: 'string' as const },
    { key: 'huggingface_model', value: 'microsoft/DialoGPT-medium', description: 'Hugging Face Model', type: 'string' as const },
    
    // OpenRouter Configuration
    { key: 'openrouter_api_key', value: '', description: 'OpenRouter API Key', type: 'string' as const },
    { key: 'openrouter_model', value: 'meta-llama/llama-3.1-8b-instruct:free', description: 'OpenRouter Model', type: 'string' as const },
    
    // Together AI Configuration (Free tier)
    { key: 'together_api_key', value: '', description: 'Together AI API Key (Free credits available)', type: 'string' as const },
    { key: 'together_model', value: 'meta-llama/Llama-3-8b-chat-hf', description: 'Together AI Model', type: 'string' as const },
    
    // Mistral AI Configuration (Free tier)
    { key: 'mistral_api_key', value: '', description: 'Mistral AI API Key (Free tier available)', type: 'string' as const },
    { key: 'mistral_model', value: 'mistral-7b-instruct', description: 'Mistral AI Model', type: 'string' as const },
    
    // Cohere Configuration (Free tier)
    { key: 'cohere_api_key', value: '', description: 'Cohere API Key (Free tier available)', type: 'string' as const },
    { key: 'cohere_model', value: 'command-light', description: 'Cohere Model', type: 'string' as const },
  ],
  notifications: [
    { key: 'enable_real_time_alerts', value: true, description: 'Enable real-time alert notifications', type: 'boolean' as const },
  ],
  security: [
    { key: 'session_timeout', value: 3600, description: 'Session timeout in seconds', type: 'number' as const },
  ]
};

export default function SystemSettings() {
  const [settings, setSettings] = useState<SettingsByCategory>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      
      // Transform API data to match our interface
      const transformedSettings: SettingsByCategory = {};
      
      // Initialize with default settings
      Object.keys(defaultSettings).forEach(category => {
        transformedSettings[category] = defaultSettings[category as keyof typeof defaultSettings].map(defaultSetting => {
          const apiSetting = data[category]?.find((s: any) => s.key === defaultSetting.key);
          return {
            id: apiSetting ? 'api-setting' : `default-${defaultSetting.key}`,
            key: defaultSetting.key,
            value: apiSetting ? apiSetting.value : defaultSetting.value,
            category,
            description: defaultSetting.description,
            type: defaultSetting.type,
            updatedAt: apiSetting ? new Date(apiSetting.updatedAt).toISOString() : new Date().toISOString()
          };
        });
      });

      setSettings(transformedSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Failed to load settings",
        description: "Unable to fetch settings from the server. Please try again later.",
        variant: "destructive",
      });
      
      // Load default settings as fallback
      const fallbackSettings: SettingsByCategory = {};
      Object.keys(defaultSettings).forEach(category => {
        fallbackSettings[category] = defaultSettings[category as keyof typeof defaultSettings].map(setting => ({
          id: `default-${setting.key}`,
          key: setting.key,
          value: setting.value,
          category,
          description: setting.description,
          type: setting.type,
          updatedAt: new Date().toISOString()
        }));
      });
      setSettings(fallbackSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const getSettingsByCategory = (category: string) => {
    return settings[category] || [];
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) {
        throw new Error('Failed to update setting');
      }

      // Update local state
      const updatedSettings = { ...settings };
      Object.keys(updatedSettings).forEach(category => {
        const settingIndex = updatedSettings[category].findIndex(s => s.key === key);
        if (settingIndex !== -1) {
          updatedSettings[category][settingIndex] = {
            ...updatedSettings[category][settingIndex],
            value,
            updatedAt: new Date().toISOString()
          };
        }
      });
      setSettings(updatedSettings);

      toast({
        title: "Setting updated",
        description: "The setting has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Failed to update setting",
        description: "Unable to update the setting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save all settings
      const savePromises = Object.values(settings).flat().map(setting => 
        fetch('/api/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key: setting.key, value: setting.value }),
        })
      );

      await Promise.all(savePromises);
      
      toast({
        title: "Settings saved",
        description: "All settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Failed to save settings",
        description: "Unable to save all settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = async () => {
    if (!confirm('Are you sure you want to reset all settings to default values?')) {
      return;
    }

    try {
      // Reset to default values
      const resetPromises = Object.values(defaultSettings).flat().map(defaultSetting =>
        fetch('/api/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key: defaultSetting.key, value: defaultSetting.value }),
        })
      );

      await Promise.all(resetPromises);
      
      // Refetch settings to get the updated values
      await fetchSettings();
      
      toast({
        title: "Settings reset",
        description: "All settings have been reset to default values.",
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast({
        title: "Failed to reset settings",
        description: "Unable to reset settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const value = setting.value;
    
    // Special handling for AI provider selection
    if (setting.key === 'ai_provider') {
      return (
        <Select value={value} onValueChange={(newValue) => updateSetting(setting.key, newValue)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select AI provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="z.ai">Z.ai</SelectItem>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="groq">Groq (Free)</SelectItem>
            <SelectItem value="huggingface">Hugging Face (Free)</SelectItem>
            <SelectItem value="openrouter">OpenRouter</SelectItem>
            <SelectItem value="together">Together AI (Free)</SelectItem>
            <SelectItem value="mistral">Mistral AI (Free)</SelectItem>
            <SelectItem value="cohere">Cohere (Free)</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    
    // Special handling for model selection
    if (setting.key.includes('_model')) {
      const provider = setting.key.split('_')[0];
      let options: Array<{ value: string; label: string }> = [];
      
      switch (provider) {
        case 'openai':
          options = [
            { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recommended)' },
            { value: 'gpt-4o', label: 'GPT-4o' },
            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
          ];
          break;
        case 'groq':
          options = [
            { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B (Recommended)' },
            { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Fast)' },
            { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
            { value: 'gemma2-9b-it', label: 'Gemma 2 9B' },
          ];
          break;
        case 'openrouter':
          options = [
            { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (Free)' },
            { value: 'microsoft/phi-3-mini-128k-instruct:free', label: 'Phi-3 Mini (Free)' },
            { value: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B (Free)' },
          ];
          break;
        case 'huggingface':
          options = [
            { value: 'microsoft/DialoGPT-medium', label: 'DialoGPT Medium' },
            { value: 'microsoft/DialoGPT-large', label: 'DialoGPT Large' },
            { value: 'facebook/blenderbot-400M-distill', label: 'BlenderBot 400M' },
          ];
          break;
        case 'together':
          options = [
            { value: 'meta-llama/Llama-3-8b-chat-hf', label: 'Llama 3 8B Chat' },
            { value: 'meta-llama/Llama-3-70b-chat-hf', label: 'Llama 3 70B Chat' },
            { value: 'mistralai/Mixtral-8x7B-Instruct-v0.1', label: 'Mixtral 8x7B' },
          ];
          break;
        case 'mistral':
          options = [
            { value: 'mistral-7b-instruct', label: 'Mistral 7B Instruct' },
            { value: 'mixtral-8x7b-instruct', label: 'Mixtral 8x7B Instruct' },
            { value: 'mistral-small-latest', label: 'Mistral Small' },
          ];
          break;
        case 'cohere':
          options = [
            { value: 'command-light', label: 'Command Light (Free)' },
            { value: 'command', label: 'Command' },
            { value: 'command-nightly', label: 'Command Nightly' },
          ];
          break;
      }
      
      if (options.length > 0) {
        return (
          <Select value={value} onValueChange={(newValue) => updateSetting(setting.key, newValue)}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
    }
    
    // Special handling for API keys (password input)
    if (setting.key.includes('api_key')) {
      return (
        <div className="flex gap-2 items-center">
          <Input
            type="password"
            value={value}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
            placeholder="Enter API key..."
            className="w-64"
          />
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Test API key functionality
                toast({
                  title: "API Key Testing",
                  description: "API key validation feature coming soon.",
                });
              }}
            >
              Test
            </Button>
          )}
        </div>
      );
    }
    
    switch (setting.type) {
      case 'boolean':
        return (
          <Switch
            checked={value === true || value === 'true'}
            onCheckedChange={(checked) => updateSetting(setting.key, checked)}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateSetting(setting.key, Number(e.target.value))}
            className="w-32"
            step={setting.key === 'ai_temperature' ? '0.1' : '1'}
            min={setting.key === 'ai_temperature' ? '0' : undefined}
            max={setting.key === 'ai_temperature' ? '1' : undefined}
          />
        );
      case 'json':
        return (
          <Textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateSetting(setting.key, parsed);
              } catch {
                // Invalid JSON, don't update
              }
            }}
            className="min-h-[100px] font-mono text-sm"
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
            className="w-64"
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="ai">AI Config</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Basic application configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory('general').map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">{setting.key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Feature Flags
              </CardTitle>
              <CardDescription>
                Enable or disable application features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory('features').map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">{setting.key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          {/* General AI Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Configuration
              </CardTitle>
              <CardDescription>
                Configure AI analysis settings and choose your preferred provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Provider Selection */}
              {getSettingsByCategory('ai').filter(s => ['ai_provider', 'ai_timeout', 'ai_max_tokens', 'ai_temperature'].includes(s.key)).map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">{setting.key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Free AI Providers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-green-600">🆓</span>
                Free AI Providers
              </CardTitle>
              <CardDescription>
                Configure free AI services - no payment required
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Groq Settings */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Groq</Badge>
                  <span className="text-sm text-green-600">✓ Free Tier Available</span>
                </div>
                {getSettingsByCategory('ai').filter(s => s.key.startsWith('groq_')).map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{setting.key.replace('groq_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </div>

              {/* Hugging Face Settings */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Hugging Face</Badge>
                  <span className="text-sm text-green-600">✓ Free Tier Available</span>
                </div>
                {getSettingsByCategory('ai').filter(s => s.key.startsWith('huggingface_')).map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{setting.key.replace('huggingface_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </div>

              {/* Together AI Settings */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Together AI</Badge>
                  <span className="text-sm text-green-600">✓ Free Credits Available</span>
                </div>
                {getSettingsByCategory('ai').filter(s => s.key.startsWith('together_')).map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{setting.key.replace('together_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </div>

              {/* Mistral AI Settings */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Mistral AI</Badge>
                  <span className="text-sm text-green-600">✓ Free Tier Available</span>
                </div>
                {getSettingsByCategory('ai').filter(s => s.key.startsWith('mistral_')).map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{setting.key.replace('mistral_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </div>

              {/* Cohere Settings */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Cohere</Badge>
                  <span className="text-sm text-green-600">✓ Free Tier Available</span>
                </div>
                {getSettingsByCategory('ai').filter(s => s.key.startsWith('cohere_')).map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{setting.key.replace('cohere_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Premium AI Providers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-blue-600">💎</span>
                Premium AI Providers
              </CardTitle>
              <CardDescription>
                Configure premium AI services - API key required
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Z.ai Settings */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Z.ai</Badge>
                  <span className="text-sm text-blue-600">Premium Service</span>
                </div>
                {getSettingsByCategory('ai').filter(s => s.key.startsWith('zai_')).map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{setting.key.replace('zai_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </div>

              {/* OpenAI Settings */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default">OpenAI</Badge>
                  <span className="text-sm text-blue-600">Premium Service</span>
                </div>
                {getSettingsByCategory('ai').filter(s => s.key.startsWith('openai_')).map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{setting.key.replace('openai_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </div>

              {/* OpenRouter Settings */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default">OpenRouter</Badge>
                  <span className="text-sm text-orange-600">Free Models Available</span>
                </div>
                {getSettingsByCategory('ai').filter(s => s.key.startsWith('openrouter_')).map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{setting.key.replace('openrouter_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure notification and alert preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory('notifications').map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">{setting.key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory('security').map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">{setting.key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Advanced system configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">System Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Version</span>
                      <span className="text-sm">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Environment</span>
                      <span className="text-sm">Production</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Database</span>
                      <span className="text-sm">SQLite</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Node.js</span>
                      <span className="text-sm">v18.x</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cache Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Memory Cache</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Redis Cache</span>
                      <Badge variant="secondary">Inactive</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">File Cache</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}