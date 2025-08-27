# 🤖 AI Provider Configuration Guide

## Overview

LogAllot Provision Error Log Analysis now supports multiple AI providers, including several **completely free** options! Configure your preferred AI service for error log analysis.

## 🆓 Free AI Providers

### 1. **Groq** (Recommended Free Option)

- **Provider**: Groq
- **Free Tier**: Yes, very generous limits
- **Models**: Llama 3.1 70B, Llama 3.1 8B, Mixtral 8x7B
- **Speed**: Extremely fast inference
- **Setup**:
  1. Sign up at [groq.com](https://groq.com)
  2. Get your API key from the console
  3. Configure in AI Settings

### 2. **Hugging Face**

- **Provider**: Hugging Face
- **Free Tier**: Yes, rate-limited
- **Models**: DialoGPT, BlenderBot, and many others
- **Setup**:
  1. Sign up at [huggingface.co](https://huggingface.co)
  2. Generate API token in settings
  3. Configure in AI Settings

### 3. **Together AI**

- **Provider**: Together AI
- **Free Tier**: $25 free credits
- **Models**: Llama 3, Mixtral, and more
- **Setup**:
  1. Sign up at [together.ai](https://together.ai)
  2. Get API key from dashboard
  3. Configure in AI Settings

### 4. **Mistral AI**

- **Provider**: Mistral AI
- **Free Tier**: Limited free usage
- **Models**: Mistral 7B, Mixtral 8x7B
- **Setup**:
  1. Sign up at [mistral.ai](https://mistral.ai)
  2. Get API key
  3. Configure in AI Settings

### 5. **Cohere**

- **Provider**: Cohere
- **Free Tier**: 1000 calls/month
- **Models**: Command Light, Command
- **Setup**:
  1. Sign up at [cohere.ai](https://cohere.ai)
  2. Get API key
  3. Configure in AI Settings

### 6. **OpenRouter** (Free Models)

- **Provider**: OpenRouter
- **Free Models**: Llama 3.1 8B, Phi-3 Mini, Gemma 2
- **Setup**:
  1. Sign up at [openrouter.ai](https://openrouter.ai)
  2. Get API key
  3. Select free models only

## 💎 Premium AI Providers

### 1. **OpenAI**

- **Models**: GPT-4o, GPT-4o Mini, GPT-3.5 Turbo
- **Cost**: Pay per token
- **Quality**: Excellent
- **Setup**: Get API key from [openai.com](https://openai.com)

### 2. **Z.ai**

- **Models**: Various premium models
- **Cost**: Subscription based
- **Quality**: High
- **Setup**: Get API key from [z.ai](https://z.ai)

## 🔧 Configuration Steps

1. **Go to Admin → Settings → AI Config**
2. **Select Primary Provider** from dropdown
3. **Configure Provider Settings** in the appropriate section
4. **Enter API Key** for your chosen provider
5. **Select Model** from available options
6. **Test Connection** (optional)
7. **Save Settings**

## 📊 Recommended Settings

### For Best Performance (Free):

```
Provider: Groq
Model: llama-3.1-70b-versatile
Temperature: 0.3
Max Tokens: 2000
```

### For Fastest Response (Free):

```
Provider: Groq
Model: llama-3.1-8b-instant
Temperature: 0.3
Max Tokens: 1500
```

### For Best Quality (Premium):

```
Provider: OpenAI
Model: gpt-4o-mini
Temperature: 0.3
Max Tokens: 2000
```

## 🛠️ Advanced Configuration

### Environment Variables

You can also configure providers via environment variables:

```bash
# AI Provider Settings
AI_PROVIDER=groq
AI_TIMEOUT=30000
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.3

# Groq Configuration
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-70b-versatile

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# Add other providers as needed...
```

### API Endpoints

The system uses these default endpoints:

- **Groq**: `https://api.groq.com/openai/v1`
- **OpenAI**: `https://api.openai.com/v1`
- **Hugging Face**: `https://api-inference.huggingface.co/models`
- **OpenRouter**: `https://openrouter.ai/api/v1`
- **Together**: `https://api.together.xyz/v1`
- **Mistral**: `https://api.mistral.ai/v1`
- **Cohere**: `https://api.cohere.ai/v1`

## 🔍 Testing Your Configuration

Use the **Test** button next to each API key to verify:

- API key validity
- Model availability
- Connection speed
- Response quality

## 💡 Tips for Best Results

1. **Start with Groq** - Best free option with fast responses
2. **Use appropriate temperature** - 0.1-0.3 for analysis, 0.7+ for creative tasks
3. **Adjust max tokens** based on your needs - 1500-2000 for detailed analysis
4. **Monitor usage** - Keep track of your API quotas
5. **Fallback providers** - Configure multiple providers for redundancy

## 🚨 Troubleshooting

### Common Issues:

- **"API key not configured"** - Enter valid API key for selected provider
- **"Connection failed"** - Check internet connection and API key validity
- **"Model not available"** - Select a different model from the dropdown
- **"Rate limit exceeded"** - Wait or switch to different provider
- **"Timeout error"** - Increase timeout value in settings

### Getting Help:

1. Check provider documentation
2. Verify API key permissions
3. Test with simple prompts first
4. Check provider status pages for outages

---

## 🎯 Quick Setup for Development

**Fastest Free Setup (< 5 minutes):**

1. Go to [groq.com](https://groq.com)
2. Sign up (free)
3. Generate API key
4. In LogAllot: Admin → Settings → AI Config
5. Select "Groq" as provider
6. Enter API key
7. Select "llama-3.1-70b-versatile" model
8. Save and test!

You're now ready to analyze error logs with AI! 🚀
