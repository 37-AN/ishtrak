# AI Issue Tracker - Local AI-Powered IT Operations Management

A comprehensive, production-ready AI Issue Tracker for IT operations that runs completely locally with Ollama integration, no cloud dependencies, and enterprise-grade architecture.

## 🚀 Features

### Core Functionality
- **Issue Management**: Create, track, and resolve IT operations issues
- **AI-Powered Resolutions**: Automatic AI-generated resolution suggestions using Ollama
- **SOP Generation**: Automatically generate Standard Operating Procedures from resolved issues
- **User Rating System**: Rate AI outputs for continuous improvement
- **RAG Implementation**: Retrieval-Augmented Generation with local vector storage
- **Analytics Dashboard**: Comprehensive performance metrics and insights

### AI & Learning System
- **Local AI Integration**: Uses Ollama with llama3.1:8b model (CPU optimized)
- **Knowledge Base**: Local SQLite-based vector storage for similar issue retrieval
- **Learning Loop**: High-rated solutions prioritized for future retrieval
- **Fallback System**: Template-based generation when AI is unavailable

### User Interface
- **Modern Dashboard**: Built with Next.js 15, TypeScript, and shadcn/ui
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: Live status updates and notifications
- **Multi-tab Interface**: Organized views for issues, resolutions, SOPs, and analytics

## 🏗️ Architecture

### Database Schema
- **Issues**: Core issue tracking with categories, severity, and status
- **AI Resolutions**: Generated solutions with user ratings and feedback
- **AI SOPs**: Standard Operating Procedures with quality metrics
- **Knowledge Base**: Vector storage for RAG implementation
- **User Ratings**: Feedback system for AI performance improvement

### AI Pipeline
1. **Issue Creation** → **RAG Retrieval** → **Ollama Generation** → **User Rating** → **Knowledge Base Update**
2. **Resolution** → **SOP Generation** → **Quality Assessment** → **Library Storage**

### Services
- **Main Application**: Next.js 15 with App Router (Port 3000)
- **Ollama Service**: Dedicated AI service (Port 3031)
- **Database**: SQLite with Prisma ORM
- **API Gateway**: Caddy-based proxy for service communication

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and Bun runtime
- Ollama installed locally
- llama3.1:8b model pulled in Ollama

### Quick Start
```bash
# Install dependencies
bun install

# Setup database
bun run db:push
bun run db:generate

# Start Ollama service (in separate terminal)
cd mini-services/ollama-service
bun install
bun run dev

# Start main application
bun run dev
```

### Ollama Setup
```bash
# Install Ollama (if not already installed)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull the required model
ollama pull llama3.1:8b

# Start Ollama service
ollama serve
```

## 📊 Usage Guide

### Creating Issues
1. Navigate to the **Issues** tab
2. Click **"New Issue"** button
3. Fill in issue details:
   - Title and description
   - Category (Infrastructure, Application, Database, etc.)
   - Severity (Low, Medium, High, Critical)
   - Environment (Development, Staging, Production)
4. AI automatically generates resolution suggestions

### Managing AI Resolutions
1. Go to **"AI Resolutions"** tab
2. Review generated solutions
3. **Rate each resolution** (1-5 stars)
4. Provide optional feedback for improvement
5. High-rated resolutions are added to knowledge base

### SOP Generation
1. Resolve an issue with a highly-rated AI resolution (4+ stars)
2. SOP is automatically generated in the background
3. Find it in the **"SOP Library"** tab
4. Export in multiple formats (Markdown, PDF, Text)

### Analytics & Insights
1. Visit **"Analytics"** tab for comprehensive metrics
2. Track:
   - Issue resolution rates
   - AI performance metrics
   - User satisfaction scores
   - Category-based trends
3. Filter by time ranges (7 days, 30 days, 90 days, 1 year)

## 🔧 Configuration

### Environment Variables
```env
DATABASE_URL="file:./dev.db"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"
```

### Ollama Service Configuration
The Ollama service runs on port 3031 and provides:
- `/health` - Service health check
- `/generate` - Text completion
- `/chat` - Chat completion
- `/generate-resolution` - Specialized issue resolution
- `/generate-sop` - SOP generation

## 🧠 AI Model Details

### Default Configuration
- **Model**: llama3.1:8b
- **Parameters**: 8 billion (CPU optimized)
- **Temperature**: 0.7 (creative but consistent)
- **Max Tokens**: 2048-4000 (context dependent)

### Fallback Behavior
When Ollama is unavailable:
- Uses template-based generation
- Maintains full functionality
- Automatic retry when service restored

## 📈 Performance Metrics

### Learning System
- **Rating-Based Prioritization**: 4+ star content prioritized
- **Usage Tracking**: Popular solutions surfaced more frequently
- **Similarity Matching**: Keyword-based vector similarity
- **Continuous Improvement**: User feedback drives quality

### Analytics Tracked
- Resolution success rates
- Average resolution time
- User satisfaction scores
- Category performance trends
- AI model effectiveness

## 🔒 Security & Privacy

### Local-First Architecture
- **No External APIs**: All processing happens locally
- **Data Privacy**: No data leaves your system
- **Offline Operation**: Full functionality without internet
- **User Control**: Complete control over AI models and data

### Best Practices
- Regular database backups
- Secure Ollama configuration
- Monitor system resources
- Update AI models as needed

## 🚀 Deployment

### Development
```bash
bun run dev  # Development with hot reload
```

### Production
```bash
bun run build  # Optimized production build
bun run start  # Production server
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN bun install
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "start"]
```

## 📝 API Documentation

### Core Endpoints
- `GET /api/issues` - List all issues
- `POST /api/issues` - Create new issue
- `POST /api/ai/generate-resolution` - Generate AI resolution
- `POST /api/ai/generate-sop` - Generate SOP
- `GET /api/analytics` - Get analytics data

### AI Service Endpoints
- `POST /api/ollama/generate-resolution` - AI resolution generation
- `POST /api/ollama/generate-sop` - SOP generation
- `GET /api/ollama/health` - Service health check

## 🔄 Integration Options

### External Monitoring
- Prometheus metrics endpoint
- Custom webhook support
- REST API for external integrations

### Database Extensions
- PostgreSQL support (change Prisma schema)
- MySQL compatibility
- External database connections

## 🐛 Troubleshooting

### Common Issues
1. **Ollama Connection Failed**
   - Check if Ollama is running: `ollama list`
   - Verify model is pulled: `ollama pull llama3.1:8b`
   - Check service port: `curl http://localhost:11434/api/tags`

2. **Database Errors**
   - Run `bun run db:push` to update schema
   - Check file permissions on database file
   - Verify Prisma client generation

3. **AI Generation Issues**
   - Monitor Ollama service logs
   - Check system resources (CPU, RAM)
   - Fallback to templates automatically

### Debug Mode
```bash
# Enable verbose logging
DEBUG=true bun run dev

# Check Ollama service status
curl http://localhost:3031/health
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

### Documentation
- Comprehensive API docs
- User guides and tutorials
- Troubleshooting guides

### Community
- GitHub Issues for bug reports
- Discussions for feature requests
- Wiki for extended documentation

---

**Built with ❤️ using Next.js 15, TypeScript, Ollama, and modern web technologies.**