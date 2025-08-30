# Automated Provision Error Log Analysis

A comprehensive AI-powered log analysis system designed to identify, analyze, and provide intelligent insights for provisioning errors across multiple platforms and services.

## 🚀 Features

- **Multi-AI Provider Support**: Integrated with 8+ AI providers (Groq, OpenAI, Hugging Face, OpenRouter, Together AI, Mistral AI, Cohere, Z.ai)
- **Intelligent Log Analysis**: Advanced AI-powered error detection and pattern recognition
- **Real-time Processing**: Live log streaming and analysis with WebSocket support
- **Comprehensive Admin Panel**: Complete management interface for settings, users, and analytics
- **Teams Integration**: Direct notifications to Microsoft Teams channels
- **Audit Trail**: Complete tracking of all system activities
- **Responsive Design**: Modern UI with Tailwind CSS and shadcn/ui components
- **Production Ready**: Optimized for Vercel deployment with Edge Config support

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (production)
- **Authentication**: Custom JWT-based authentication
- **AI Integration**: Multi-provider AI service with intelligent fallbacks
- **Real-time**: Socket.IO for live updates
- **Deployment**: Vercel with Edge Config integration

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/logallot-web.git
   cd logallot-web
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**

   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

6. **Access the application**
   - Main app: http://localhost:3000
   - Admin panel: http://localhost:3000/admin
   - Default admin: admin@example.com / admin123

## 🚀 Production Deployment

### Deploy to Vercel (Recommended)

1. **One-Click Deploy**
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/logallot-web)

2. **Manual Deployment**
   See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment guide.

### Environment Variables

Required for production:

```bash
DATABASE_URL="postgresql://username:password@host:port/database"
EDGE_CONFIG="your-edge-config-connection-string"
NEXTAUTH_SECRET="your-secure-32-character-secret"
NEXTAUTH_URL="https://your-domain.vercel.app"
```

## 🔧 Configuration

### AI Providers

Configure AI providers via:

1. **Admin Panel**: Settings > AI Configuration
2. **Environment Variables**: Individual API keys
3. **Edge Config**: Production configuration management

Supported providers:

- Groq (Default)
- OpenAI
- Hugging Face
- OpenRouter
- Together AI
- Mistral AI
- Cohere
- Z.ai

### Database

#### Development (SQLite)

```bash
DATABASE_URL="file:./db/custom.db"
```

#### Production (PostgreSQL)

```bash
DATABASE_URL="postgresql://username:password@host:port/database"
```

## 📁 Project Structure

```
src/
├── app/                   # Next.js App Router
│   ├── admin/            # Admin panel pages
│   ├── api/              # API routes
│   └── page.tsx          # Main application
├── components/           # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utilities and services
│   ├── ai-providers.ts   # Multi-AI provider service
│   ├── edge-config.ts    # Vercel Edge Config integration
│   └── db.ts             # Database connection
└── hooks/                # Custom React hooks
```

## 🎯 Key Features

### AI-Powered Analysis

- **Multi-Provider Support**: Automatic failover between AI providers
- **Intelligent Parsing**: Advanced log parsing and error extraction
- **Pattern Recognition**: Identify recurring issues and trends
- **Contextual Analysis**: Understand error context and impact

### Admin Management

- **User Management**: Complete user administration
- **Settings Configuration**: System-wide configuration management
- **Analytics Dashboard**: Comprehensive insights and metrics
- **Audit Logging**: Complete activity tracking

### Real-time Updates

- **Live Log Streaming**: Real-time log processing
- **WebSocket Integration**: Instant updates across clients
- **Notification System**: Immediate alerts for critical issues

### Teams Integration

- **Microsoft Teams**: Direct channel notifications
- **Webhook Support**: Flexible integration options
- **Custom Alerts**: Configurable notification rules

## 🔒 Security

## RBAC and Key Rotation

This project includes basic role-based access control for administrative endpoints. System settings (including stored API keys) are restricted to users with role `ADMIN` or `SUPER_ADMIN`.

Authentication header accepted by the API:

- Authorization: Bearer <sessionToken>
- x-session-token: <sessionToken>

Session tokens are issued by the demo login endpoint and are of the form base64("<userId>:<timestamp>"). In production, replace this with a proper JWT/NextAuth session.

## Key Rotation

To rotate the encryption key used to protect stored API keys, set `NEW_SECRET` and run the rotate script in dry-run mode first:

1. Dry run (no writes):

   - NEW_SECRET="<new-secret>" node ./scripts/rotate-keys.js --dry-run

2. Apply (writes):
   - NEW_SECRET="<new-secret>" node ./scripts/rotate-keys.js --apply

Always backup the database before running key rotation. Ensure `NEW_SECRET` is set in your deployment environment and that you keep the old key available until rotation completes successfully.

- **Data Protection**: Encrypted sensitive data storage
- **Audit Trail**: Complete security event logging
- **Environment Security**: Secure configuration management

## 📊 Monitoring

Built-in monitoring features:

- Performance metrics
- Error tracking
- User activity logs
- AI provider status
- System health checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

## 🚀 Roadmap

- [ ] Advanced ML models for error prediction
- [ ] Multi-language support
- [ ] Enhanced visualization dashboard
- [ ] API rate limiting and quotas
- [ ] Advanced user permissions
- [ ] Plugin system for custom integrations

---

**Automated Provision Error Log Analysis** - Intelligent error analysis for modern applications.

## 🔑 Adding Groq API Key (for analysis, fix generation, and reporting)

You can configure Groq as the primary AI provider. Do NOT commit your secret into the repository.

1. Preferred (Edge Config / hosting provider): Add the key under `ai.groq.apiKey` or `GROQ_API_KEY` as an environment variable.

2. Local development: copy `.env.example` to `.env.local` and add:

```bash
GROQ_API_KEY=your_groq_api_key_here
```

3. Test the Groq provider locally with the helper script:

```bash
npx tsx scripts/test-groq.ts
```

If the key is valid you should see a success message like "Connection successful" with provider and model details.

## ✅ Recommended next steps after adding the Groq key

- Run the Groq connection test and verify successful responses.
- Run a few representative error logs through the app and confirm that the analysis output follows the new structured template (Analysis / Proposed Solution / Verification).
- Add automated unit tests for the traceback parser and structured formatter (`src/lib/ai-analysis.ts`).
- Configure Edge Config (or your deployment platform) to store the Groq API key securely for production.
- Monitor AI provider usage and set alerts for quota/latency issues.
