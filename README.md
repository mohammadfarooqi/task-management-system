# Task Management System

A comprehensive task management system built with NX monorepo architecture, featuring role-based access control (RBAC), organizational hierarchy, and audit logging.

## 🏗️ Architecture Overview

This project uses an NX monorepo structure with:
- **Backend API** (`apps/api`): NestJS REST API with TypeORM and SQLite
- **Shared Libraries**:
  - `libs/auth`: Authentication guards, JWT configuration
  - `libs/data`: Shared DTOs, interfaces, and role helpers

## 🚀 Features

### Backend Features
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control (RBAC)**: Three-tier role system (Owner > Admin > Viewer)
- **Organization Hierarchy**: 2-level parent-child organization structure
- **Task Management**: Full CRUD operations with role-based permissions
- **Audit Logging**: Comprehensive tracking of all system actions
- **TypeORM with SQLite**: Lightweight database with automatic migrations

### Role Permissions

| Role | Permissions |
|------|------------|
| **Owner** | Full access to everything, can manage all tasks and users |
| **Admin** | Can create, edit, delete tasks; manage child organization tasks |
| **Viewer** | Read-only access to assigned tasks |

### Organization Hierarchy
- Parent organizations can view and manage child organization tasks
- Child organizations operate independently but can be overseen by parent
- 2-level hierarchy support (Parent → Child)

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- Git

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd task-management-system
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Create `.env` file in the root directory:
```bash
cp .env.example .env
```

4. The database will be automatically created and seeded on first run.

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Run the API with auto-reload
npx ts-node-dev -r tsconfig-paths/register --respawn --transpile-only apps/api/src/main.ts

# Or using NX
npx nx serve api
```

The API will be available at `http://localhost:3000/api`

### Production Build
```bash
# Build the API
npx nx build api

# Run the built application
node dist/apps/api/main.js
```

## 🧪 Testing

### Run Unit Tests
```bash
# Run all tests
npx nx test api

# Run tests with coverage
npx nx test api --coverage

# Run tests in watch mode
npx nx test api --watch
```

### Run E2E Tests
```bash
npx nx e2e api-e2e
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "organizationId": 1
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "jwt-token-here",
    "roles": ["Admin"]
  }
}
```

### Task Management Endpoints

All task endpoints require JWT authentication:
```http
Authorization: Bearer <jwt-token>
```

#### Create Task (Admin/Owner only)
```http
POST /api/tasks
Content-Type: application/json

{
  "title": "Task title",
  "description": "Task description",
  "priority": "high",
  "category": "development",
  "assignedTo": 2
}
```

#### Get All Tasks
```http
GET /api/tasks
```

#### Get Single Task
```http
GET /api/tasks/:id
```

#### Update Task (PUT - full replacement)
```http
PUT /api/tasks/:id
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in-progress",
  "priority": "medium",
  "category": "development"
}
```

#### Delete Task (Owner/Admin only)
```http
DELETE /api/tasks/:id
```

### Audit Log Endpoints (Admin/Owner only)

#### Get Audit Logs
```http
GET /api/audit-log
GET /api/audit-log?action=task:created&limit=10
GET /api/audit-log?userId=2&page=1&limit=5
```

## 🗄️ Data Model

### Core Entities

1. **User**: System users with authentication credentials
2. **Organization**: Hierarchical organization structure
3. **Role**: RBAC roles (Owner, Admin, Viewer)
4. **UserRole**: Many-to-many relationship between users and roles
5. **Task**: Core task entity with status, priority, and assignments
6. **AuditLog**: Comprehensive action logging

### Database Schema

```
Organizations (2-level hierarchy)
├── id
├── name
├── parent_id (nullable)
└── timestamps

Users
├── id
├── email (unique)
├── passwordHash
├── firstName
├── lastName
├── organizationId
└── timestamps

Tasks
├── id
├── title
├── description
├── status (pending|in-progress|completed)
├── priority (low|medium|high)
├── category
├── dueDate
├── createdBy (userId)
├── assignedTo (userId)
├── organizationId
└── timestamps
```

## 🔐 Security Features

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Tokens**: 24-hour expiration
- **Global Auth Guard**: All routes protected by default
- **Role-Based Guards**: Fine-grained access control
- **Audit Logging**: Track all sensitive operations

## 📁 Project Structure

```
task-management-system/
├── apps/
│   ├── api/                 # NestJS backend API
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── controllers/
│   │   │   │   ├── entities/
│   │   │   │   ├── services/
│   │   │   │   └── app.module.ts
│   │   │   └── main.ts
│   │   └── project.json
│   └── api-e2e/             # E2E tests
├── libs/
│   ├── auth/                # Authentication library
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── guards/
│   │       │   ├── decorators/
│   │       │   └── config/
│   │       └── index.ts
│   └── data/                # Shared data library
│       └── src/
│           ├── lib/
│           │   ├── dto/
│           │   ├── interfaces/
│           │   └── role-helpers.ts
│           └── index.ts
├── docs/
│   ├── api/                 # API test files
│   └── requirements.pdf     # Original requirements
└── data/
    └── database.sqlite      # SQLite database (auto-created)
```

## 🧑‍💻 Development Workflow

1. **Initial Setup**: Database is automatically seeded with test users
   - Owner: `owner@techcorp.com` / `password123`
   - Admin: `admin@techcorp.com` / `password123`

2. **Testing API**: Use the HTTP test files in `docs/api/`
   - `auth-test.http`: Authentication testing
   - `task-test.http`: Task management testing
   - `org-hierarchy-test.http`: Organization hierarchy testing

3. **Making Changes**: 
   - Services are in `apps/api/src/app/services/`
   - DTOs are in `libs/data/src/lib/dto/`
   - Guards are in `libs/auth/src/lib/guards/`

## 🔄 Future Enhancements

### Frontend Development (Priority)
- [ ] Angular Dashboard Application
- [ ] User Authentication UI (Login/Register)
- [ ] Task Management Interface
- [ ] Organization Management
- [ ] Role-based UI Components
- [ ] Responsive Design

### API Improvements
- [ ] Pagination for all list endpoints
- [ ] Advanced filtering and search
- [ ] Input validation pipes
- [ ] Enhanced error handling
- [ ] Request/Response interceptors
- [ ] API versioning

### Production Readiness
- [ ] Rate limiting
- [ ] Logging with Winston
- [ ] Health check endpoints
- [ ] Docker configuration
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Environment-specific configurations
- [ ] Database migrations system
- [ ] API documentation (Swagger/OpenAPI)

### Advanced Features
- [ ] Real-time updates with WebSockets
- [ ] Task attachments and comments
- [ ] Email notifications
- [ ] Task templates
- [ ] Recurring tasks
- [ ] Team collaboration features
- [ ] Export functionality (CSV, PDF)
- [ ] Activity dashboard and analytics
- [ ] Multi-language support
- [ ] Mobile application

## 📝 License

This project is part of a technical assessment.

## 🤝 Contributing

Please follow the existing code style and ensure all tests pass before submitting changes.

## 📞 Support

For questions or issues, please refer to the original requirements document in `docs/requirements.pdf`.