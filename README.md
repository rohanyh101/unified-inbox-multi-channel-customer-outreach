# Unified Inbox - Multi-Channel Customer Outreach

A Next.js application for managing SMS, WhatsApp, and email communications in a unified inbox interface.

## 🚀 Features

- **Unified Inbox**: View all messages from SMS, WhatsApp, and email in one place
- **Contact Management**: Organize contacts with notes, tags, and interaction history
- **Multi-Channel Messaging**: Send messages via SMS, WhatsApp, and email
- **Real-time Updates**: Live message synchronization and status updates
- **Analytics Dashboard**: Track message performance, response times, and channel effectiveness
- **Message Scheduling**: Schedule messages for optimal delivery times
- **Twilio Integration**: Reliable SMS and WhatsApp delivery
- **Better Auth**: Secure authentication with email/password and Google OAuth

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Better Auth
- **SMS/WhatsApp**: Twilio SDK
- **Email**: Resend (optional)
- **State Management**: TanStack React Query
- **Validation**: Zod
- **UI Components**: Radix UI, Lucide React
- **Charts**: Recharts

## 📦 Project Structure

```
/app
  /api
    /auth/[...all]/           # Better Auth endpoints
    /messages/send/           # Send messages
    /webhooks/twilio/         # Twilio webhook handler
    /contacts/                # Contact management
    /analytics/               # Analytics data
  /(auth)
    /login/                   # Login page
    /register/                # Registration page
  /(dashboard)
    /inbox/                   # Unified inbox interface
    /contacts/                # Contact management UI
    /analytics/               # Analytics dashboard
    /settings/                # Configuration
/lib
  /integrations/
    twilio.ts                 # Twilio service helper
  auth.ts                     # Better Auth configuration
  auth-client.ts              # Client-side auth utilities
  prisma.ts                   # Prisma client
  validations.ts              # Zod schemas
  /utils/
    index.ts                  # Utility functions
/prisma
  schema.prisma               # Database schema
/components
  /ui/                        # Reusable UI components
  /providers/                 # React providers
```

## ⚡ Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Twilio account with SMS/WhatsApp capabilities

### 1. Clone and Install

```bash
git clone <your-repo>
cd unified-inbox
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update the following variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/unified_inbox"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-change-this-in-production"
BETTER_AUTH_URL="http://localhost:3000"

# Twilio Configuration
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

# Resend (for email)
RESEND_API_KEY="your-resend-api-key"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed database with sample data
npx prisma db seed
```

#### Database Reset Commands

If you need to reset your database completely:

```bash
# Reset database (removes all data and re-runs migrations)
npm run db:reset

# Reset database and seed with sample data
npm run db:reset-seed
```

### 4. User Management

After setting up the database, you'll need to create user accounts and assign admin privileges.

#### Creating Users

1. **Register via UI**: Navigate to `/register` and create user accounts
2. **Or use the seeded users** (if you ran `db:seed`):
   - `admin@example.com` / `password123` (pre-configured as admin)
   - `editor@example.com` / `password123` (editor role)
   - `user@example.com` / `password123` (user role)

#### Admin Management

**Promote a user to admin:**
```bash
# Make specific user admin
npx tsx scripts/setup-admin.ts user@example.com
# Or using npm script
npm run setup-admin user@example.com

# Make the first registered user admin (if no email provided)
npx tsx scripts/setup-admin.ts
# Or using npm script
npm run setup-admin
```

**Demote an admin user:**
```bash
# Demote admin back to editor role
npx tsx scripts/demote-admin.ts admin@example.com
# Or using npm script
npm run demote-admin admin@example.com
```

**Important Notes:**
- The system prevents demoting the last admin (with warnings)
- Only one admin is needed, but you can have multiple
- Admin users can access `/dashboard/admin` for user management
- Regular users have access to messages, contacts, and analytics

### 5. Start Development Server

```bash
# Launch all services with one command
npm run dev:full

# Or start services individually:
# Terminal 1: Next.js development server
npm run dev

# Terminal 2: WebSocket server for real-time updates  
npm run ws:dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## � Integration Comparison

### Communication Channels Analysis

| Channel | Latency | Cost per Message | Reliability | Character Limit | Media Support | Global Reach |
|---------|---------|------------------|-------------|-----------------|---------------|---------------|
| **SMS** | < 1 second | $0.01 - $0.05 | 99.9% | 160 chars (GSM) / 70 chars (Unicode) | Limited (MMS) | Excellent |
| **WhatsApp** | < 1 second | $0.005 - $0.01 | 99.5% | 4,096 characters | Rich media | Good (smartphone users) |
| **Email** | 1-5 seconds | $0.001 - $0.01 | 99.8% | No practical limit | Full attachments | Excellent |

### Integration Providers

| Provider | SMS | WhatsApp | Email | Pricing Model | Global Coverage |
|----------|-----|----------|-------|---------------|-----------------|
| **Twilio** ⭐ | ✅ | ✅ | ❌ | Pay-per-use | 180+ countries |
| **Resend** | ❌ | ❌ | ✅ | Freemium + usage | Global |
| SendGrid | ❌ | ❌ | ✅ | Freemium + usage | Global |
| MessageBird | ✅ | ✅ | ❌ | Pay-per-use | 200+ countries |

⭐ = Currently implemented

## 🎯 Key Architecture Decisions

### 1. **Next.js App Router** 
- **Decision**: Use Next.js 14 with App Router over Pages Router
- **Reasoning**: Better file-based routing, server components, improved performance
- **Trade-off**: Steeper learning curve but future-proof architecture

### 2. **Twilio for SMS/WhatsApp**
- **Decision**: Chose Twilio over MessageBird/SendGrid
- **Reasoning**: Superior reliability (99.9%), excellent documentation, robust webhook system
- **Trade-off**: Slightly higher cost but better developer experience

### 3. **Prisma ORM**
- **Decision**: Prisma over direct SQL or other ORMs
- **Reasoning**: Type safety, excellent migration system, great TypeScript integration
- **Trade-off**: Additional abstraction layer but significantly improved developer productivity

### 4. **Real-time with WebSockets**
- **Decision**: Custom WebSocket server over Socket.io or Pusher
- **Reasoning**: Full control over connection management, lower latency, no external dependencies
- **Trade-off**: More implementation work but better performance and cost control

### 5. **PostgreSQL Database**
- **Decision**: PostgreSQL over MySQL or NoSQL
- **Reasoning**: JSON support for metadata, excellent performance, ACID compliance
- **Trade-off**: Requires more setup than serverless options but provides better data integrity

### 6. **Better Auth**
- **Decision**: Better Auth over NextAuth.js or custom auth
- **Reasoning**: Modern architecture, better TypeScript support, simpler configuration
- **Trade-off**: Newer ecosystem but more maintainable codebase

### 7. **React Query (TanStack Query)**
- **Decision**: React Query over Redux or SWR
- **Reasoning**: Excellent caching, background updates, optimistic UI support
- **Trade-off**: Learning curve but significantly better UX for real-time applications

## �🔧 Configuration

### Twilio Setup

1. Create a [Twilio account](https://www.twilio.com/)
2. Get your Account SID and Auth Token from the console
3. Purchase a phone number for SMS
4. Enable WhatsApp sandbox for testing
5. Configure webhook URL: `https://your-domain.com/api/webhooks/twilio`

### Database Configuration

The app uses PostgreSQL with Prisma ORM. You can use:
- Local PostgreSQL installation
- Supabase (hosted PostgreSQL)
- Any PostgreSQL-compatible service

### Better Auth Configuration

Better Auth is pre-configured for:
- Email/password authentication
- Google OAuth (requires Google Cloud credentials)
- Session management
- Role-based access control

## 📊 Database Schema (ERD)

```mermaid
erDiagram
    User {
        string id PK
        string email
        string name
        string hashedPassword
        UserRole role
        datetime createdAt
        datetime updatedAt
    }
    
    Contact {
        string id PK
        string name
        string phone
        string email
        json socialHandles
        string userId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Message {
        string id PK
        string contactId FK
        string authorId FK
        MessageChannel channel
        MessageDirection direction
        string content
        MessageStatus status
        string twilioSid
        string mediaUrl
        json metadata
        datetime timestamp
        datetime createdAt
        datetime updatedAt
    }
    
    ScheduledMessage {
        string id PK
        string contactId FK
        string authorId FK
        MessageChannel channel
        string content
        ScheduledMessageStatus status
        datetime scheduledAt
        string mediaUrl
        json metadata
        datetime createdAt
        datetime updatedAt
    }
    
    Note {
        string id PK
        string contactId FK
        string userId FK
        string parentId FK
        string content
        boolean isPrivate
        datetime createdAt
        datetime updatedAt
    }
    
    NoteMention {
        string id PK
        string noteId FK
        string userId FK
        datetime createdAt
    }
    
    UserPresence {
        string id PK
        string userId FK
        string contactId FK
        string action
        json metadata
        datetime lastSeenAt
        datetime createdAt
    }
    
    MessageTemplate {
        string id PK
        string userId FK
        string name
        string content
        string category
        json variables
        int usageCount
        datetime createdAt
        datetime updatedAt
    }

    User ||--o{ Contact : "manages"
    User ||--o{ Message : "authors"
    User ||--o{ ScheduledMessage : "schedules"
    User ||--o{ Note : "writes"
    User ||--o{ NoteMention : "mentioned_in"
    User ||--o{ UserPresence : "has_presence"
    User ||--o{ MessageTemplate : "creates"
    Contact ||--o{ Message : "receives"
    Contact ||--o{ ScheduledMessage : "target"
    Contact ||--o{ Note : "about"
    Contact ||--o{ UserPresence : "viewed_by"
    Note ||--o{ NoteMention : "contains"
    Note ||--o{ Note : "replies_to"
```

### Key Entity Relationships:
- **Users** manage contacts and author messages/notes
- **Contacts** are the recipients of messages and subjects of notes
- **Messages** track all communication across channels (SMS/WhatsApp/Email)
- **ScheduledMessages** handle delayed message delivery
- **Notes** enable team collaboration with threading and mentions
- **UserPresence** provides real-time collaboration indicators

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-out` - User logout

### Messages
- `POST /api/messages/send` - Send a message
- `GET /api/messages` - Get messages with filtering
- `POST /api/webhooks/twilio` - Twilio webhook handler

### Scheduled Messages
- `GET /api/messages/scheduled` - List scheduled messages
- `POST /api/messages/scheduled` - Schedule a new message
- `DELETE /api/messages/scheduled/[id]` - Cancel scheduled message
- `PATCH /api/messages/scheduled/[id]` - Update scheduled message

### Contacts
- `GET /api/contacts` - List contacts with pagination
- `POST /api/contacts` - Create new contact
- `GET /api/contacts/[id]` - Get contact details
- `PATCH /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Delete contact

### Analytics
- `GET /api/analytics` - Get dashboard analytics data

### Message Templates
- `GET /api/message-templates` - List user's message templates
- `POST /api/message-templates` - Create new message template
- `PUT /api/message-templates` - Update existing template
- `DELETE /api/message-templates?id={id}` - Delete template

### File Uploads
- `POST /api/upload` - Upload media files for attachments
- `GET /api/upload` - List user's uploaded files

### Team Collaboration
- `GET /api/notes/[id]/replies` - Get threaded replies to a note
- `POST /api/notes/[id]/replies` - Add reply to a note
- `GET /api/mentions` - Get @mentions for current user
- `POST /api/mentions` - Create new @mention
- `GET /api/presence` - Get real-time user presence
- `POST /api/presence` - Update user presence status

### Admin Management
- `GET /api/admin/users` - List all users (Admin only)
- `PATCH /api/admin/users/[id]/role` - Update user role (Admin only)

### Cron Jobs
- `POST /api/cron/process-scheduled-messages` - Process pending scheduled messages
- `POST /api/cron/cleanup-presence` - Clean up stale presence records

## 🎨 UI Components

The app uses a custom design system built with:
- Tailwind CSS for styling
- Radix UI for accessible components
- Lucide React for icons
- Custom Button, Card, and Form components

Key UI features:
- Responsive design (mobile-first)
- Channel-specific color coding
- Real-time message updates
- Optimistic UI updates

## 📚 Code Documentation

All core functions and components are documented with JSDoc comments for better developer experience:

```typescript
/**
 * Sends a message via the specified channel (SMS, WhatsApp, or Email)
 * @param params - Message parameters including recipient, content, and channel
 * @param params.to - Recipient phone number or email address
 * @param params.body - Message content
 * @param params.channel - Communication channel ('SMS' | 'WHATSAPP' | 'EMAIL')
 * @param params.mediaUrl - Optional media attachment URL
 * @returns Promise<TwilioMessage> - Message delivery result with SID and status
 * @throws {Error} When channel is unsupported or recipient format is invalid
 * @example
 * ```typescript
 * const result = await sendMessage({
 *   to: '+1234567890',
 *   body: 'Hello, World!',
 *   channel: 'SMS'
 * });
 * console.log('Message SID:', result.sid);
 * ```
 */
async function sendMessage(params: SendMessageParams): Promise<TwilioMessage>

/**
 * Groups messages into conversation threads by contact
 * @param messages - Array of all messages from the database
 * @param contacts - Array of all contacts for reference
 * @returns ContactThread[] - Organized conversation threads with metadata
 * @description Processes messages to create threaded conversations, calculates
 * unread counts, and sorts by most recent activity
 */
function groupMessagesIntoThreads(messages: Message[], contacts: Contact[]): ContactThread[]

/**
 * React hook for real-time WebSocket connection management
 * @returns WebSocketHook - Connection status and message handlers
 * @description Manages WebSocket lifecycle, auto-reconnection, and heartbeat
 * for real-time message synchronization across all connected clients
 */
function useWebSocket(): WebSocketHook
```

## 🚀 Available Scripts

```bash
# Development
npm run dev              # Start Next.js development server only
npm run dev:full         # Start all services (Next.js + WebSocket + Scheduler)
npm run ws:dev           # Start WebSocket server only

# Database Management
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run database migrations
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Prisma Studio (database GUI)
npm run db:seed          # Seed database with sample data

# Message Scheduling
npm run scheduler:test   # Test scheduled message processing
npm run scheduler:run    # Manually trigger scheduled message processing

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues automatically
npm run type-check       # Run TypeScript type checking

# Production
npm run build            # Build for production
npm start                # Start production server
```

## 📱 Features Walkthrough

### Unified Inbox
- View all conversations in one interface
- Filter by channel (SMS, WhatsApp, Email)
- Search contacts and messages
- Real-time message synchronization

### Enhanced Message Composer
The unified inbox features an enhanced message composer with advanced capabilities:

#### Rich Text Editor
- **WYSIWYG Editing**: Visual text formatting with toolbar controls
- **Text Formatting**: Bold, italic, links, lists, and blockquotes
- **HTML Output**: Converts to HTML for rich email/chat messages
- **SMS Mode Toggle**: Switch between rich text and plain text for SMS compatibility
- **Link Detection**: Automatic URL formatting and validation
- **Undo/Redo**: Full editing history support

#### Media Attachments (MMS Support)
- **File Upload**: Drag-and-drop or click to upload files
- **Multiple Formats**: Images, videos, audio, PDFs, and documents
- **Size Limits**: Configurable file size restrictions (default 5MB)
- **Preview Generation**: Automatic thumbnail creation for images
- **Attachment Management**: Remove, preview, and organize attachments
- **Type Validation**: Restrict file types based on channel capabilities

#### Message Templates
- **Template Library**: Pre-built message templates for common scenarios
- **Categories**: Organize templates by purpose (welcome, follow-up, appointment, etc.)
- **Variable Substitution**: Dynamic content with `{{name}}`, `{{date}}`, `{{time}}` placeholders
- **Custom Templates**: Create, edit, and delete your own templates
- **Quick Insert**: Insert template content at cursor position
- **Usage Tracking**: Monitor template usage statistics
- **Search & Filter**: Find templates by name, content, or category

#### Template Examples
```
Welcome Message: "Hi {{name}}, welcome to our service! We're excited to have you on board."
Appointment Reminder: "Hi {{name}}, reminder about your appointment on {{date}} at {{time}}."
Follow-up: "Hi {{name}}, following up on our conversation from {{date}}."
```

#### Enhanced Features
- **Character Counter**: Real-time SMS length calculation
- **Channel Optimization**: Content adapts to selected channel (SMS/WhatsApp/Email)  
- **Auto-Save**: Prevents message loss during composition
- **Channel Selection**: Easy switching between SMS, WhatsApp, and Email
- **Contact Context**: Templates auto-populate contact name when available
- **Delivery Status**: Real-time message status tracking

### Message Scheduling
- **Schedule for Later**: Set specific date and time for message delivery
- **Quick Templates**: Pre-defined time slots ("In 1 hour", "Tomorrow 9 AM", "Next week")
- **Follow-up Templates**: Ready-made message templates with personalization
- **Cron-like Scheduling**: Recurring message patterns
- **Schedule Management**: View, edit, and cancel pending scheduled messages
- **Automatic Processing**: Background job processes and sends scheduled messages
- **Status Tracking**: Monitor scheduled message status (Pending, Sent, Failed, Cancelled)

#### Quick Start with Scheduling
```bash
# Test the scheduler manually
npm run scheduler:test

# Set up cron job (production)
# Add to your cron service or use Vercel Cron:
# POST /api/cron/process-scheduled-messages
# Authorization: Bearer YOUR_CRON_SECRET
```

### Contact Management
- Import/export contacts
- Contact profile with interaction history
- Notes and tags
- Duplicate detection and merging

### Analytics Dashboard
- Message volume trends
- Channel performance comparison
- Response time metrics
- Delivery success rates

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Traditional Hosting

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Traditional Hosting

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔐 Security Considerations

- All API routes are protected with authentication
- Input validation using Zod schemas
- SQL injection protection via Prisma
- Twilio webhook signature verification
- Rate limiting on API endpoints
- CORS configuration
- Environment variable security

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions or issues, please create a GitHub issue.

## 👥 Team Collaboration

### User Roles & Permissions

The system supports three user roles with different permission levels:

#### Viewer
- **View only access** to contacts, messages, and notes
- Can read all content but cannot create or modify
- Access to analytics dashboard
- Cannot send messages or create notes

#### Editor
- **Full operational access** for day-to-day tasks
- Create and edit notes with threading and mentions
- Send messages and schedule communications
- Add and manage contacts
- Export analytics reports
- Cannot manage user roles or access admin features

#### Admin
- **Complete system access** including user management
- All Editor permissions
- Manage user roles and permissions
- Access admin dashboard
- Delete any content across the system
- System configuration and maintenance

### Collaborative Notes

#### Threading & Replies
```typescript
// Notes support hierarchical threading
POST /api/notes/{noteId}/replies
{
  "content": "This is a reply to the note",
  "mentions": ["user-id-1", "user-id-2"],
  "isPrivate": false
}
```

#### @Mentions
- Type `@username` to mention team members
- Mentioned users receive notifications
- Mentions are tracked and searchable
- Auto-complete user suggestions

#### Real-time Presence
- See who's currently viewing a contact
- Live typing indicators for notes
- Presence tracking across different actions
- Automatic cleanup of stale presence data

### API Endpoints

#### User Management (Admin only)
```bash
# Get all users with roles
GET /api/admin/users

# Update user role
PATCH /api/admin/users
{
  "userId": "user-id",
  "role": "EDITOR"
}
```

#### Mentions & Notifications
```bash
# Get mentionable users
GET /api/mentions?query=search

# Get mentions for current user
POST /api/mentions
{
  "action": "get_mentions"
}
```

#### Presence Tracking
```bash
# Update user presence
POST /api/presence
{
  "contactId": "contact-id",
  "action": "viewing_contact",
  "metadata": {}
}

# Get active presence
GET /api/presence?contactId=contact-id
```

#### Note Threading
```bash
# Get note replies
GET /api/notes/{noteId}/replies

# Create reply
POST /api/notes/{noteId}/replies
{
  "content": "Reply content",
  "mentions": ["user-id"],
  "isPrivate": false
}
```

## 🎯 Roadmap

- [ ] Advanced message templates
- [ ] Automated response workflows
- [ ] CRM integrations
- [ ] Advanced analytics and reporting
- [ ] Mobile app (React Native)
- [ ] WhatsApp Business API integration
- [ ] Multi-tenant support
- [ ] Real-time notifications (WebSockets)

## 📝 Implementation Status

### ✅ Completed
- [x] Project scaffolding with Next.js 14 + TypeScript
- [x] Database schema with Prisma + PostgreSQL
- [x] Better Auth integration for authentication
- [x] Twilio SDK integration for SMS/WhatsApp
- [x] API routes for messages, contacts, analytics
- [x] Basic UI components and pages
- [x] Unified inbox interface
- [x] Message scheduling with templates
- [x] Analytics dashboard with CSV export
- [x] Enhanced message features:
  - [x] Rich text editor for message composition
  - [x] Media attachments with MMS support
  - [x] Message templates with variable substitution
  - [x] File upload system with type validation
  - [x] Enhanced message composer component
- [x] Team collaboration features:
  - [x] Threaded notes with replies
  - [x] @mentions in notes
  - [x] Real-time presence indicators
  - [x] Role-based access control (Viewer/Editor/Admin)
  - [x] Admin dashboard for user management
- [x] Login/Register pages
- [x] Environment configuration
- [x] Comprehensive documentation

## 🎨 New UI Components

### CollaborativeNotes
Advanced notes component with threading, mentions, and presence:
```tsx
<CollaborativeNotes 
  contactId="contact-id"
  currentUser={{
    id: "user-id",
    name: "User Name", 
    email: "user@email.com",
    role: "EDITOR"
  }}
/>
```

### AdminDashboard
Complete admin interface for user management:
- Role-based permissions overview
- User activity statistics
- Real-time role updates
- User activity tracking

### Enhanced ContactProfileModal
Now includes collaborative team notes with:
- Threaded discussions
- @mention functionality
- Real-time presence indicators
- Role-based permissions

## � Database Schema Updates

New tables for team collaboration:

### NoteMention
```sql
CREATE TABLE note_mentions (
  id TEXT PRIMARY KEY,
  noteId TEXT REFERENCES notes(id),
  userId TEXT REFERENCES user(id)
);
```

### UserPresence
```sql
CREATE TABLE user_presence (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES user(id),
  contactId TEXT REFERENCES contacts(id),
  action TEXT,
  lastSeenAt TIMESTAMP,
  metadata JSON
);
```

### Enhanced Notes
```sql
ALTER TABLE notes ADD COLUMN parentId TEXT REFERENCES notes(id);
ALTER TABLE notes ADD COLUMN updatedAt TIMESTAMP;
```

### �🚧 Next Steps
1. ✅ Set up database (PostgreSQL) 
2. ✅ Run database migrations
3. Configure Twilio credentials
4. Test message sending/receiving
5. ✅ Implement contact management UI
6. ✅ Add analytics dashboard
7. ✅ Add message scheduling
8. ✅ Implement team collaboration features
9. Add real-time WebSocket updates
10. Add comprehensive error handling
11. Deploy to production

This scaffold provides a solid foundation for your unified inbox application with all the core features implemented as per your requirements!
