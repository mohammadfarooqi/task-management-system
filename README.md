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

### Role-Based Access Control (RBAC)

#### Role Hierarchy
```
SystemAdmin (Highest - Platform level)
  ↓
Owner (Organization level)
  ↓
Admin
  ↓
Viewer (Lowest)
```

#### Permission Matrix

| Role | Create Task | Edit Task | Delete Task | View Tasks | Manage Users | Audit Logs | Manage Orgs |
|------|------------|-----------|-------------|------------|--------------|------------|-------------|
| **SystemAdmin** | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All roles | ✅ | ✅ |
| **Owner** | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All roles | ✅ | ❌ |
| **Admin** | ✅ | ✅ All | ✅ All | ✅ All | ✅ Admin/Viewer | ✅ | ❌ |
| **Viewer** | ❌ | ❌ | ❌ | ✅ Own/Assigned | ❌ | ❌ | ❌ |

#### Detailed Role Permissions

##### SystemAdmin Role
- **Platform Control**: Can create new organizations and assign owners
- **Full System Access**: Can perform any action across all organizations
- **Organization Management**: Create new root organizations and their hierarchy
- **Owner Assignment**: Can create Owner users for any organization
- **Example**: Platform administrator who manages the entire system

##### Owner Role
- **Full Control**: Can perform any action on any task within their organization hierarchy
- **Task Management**: Create, edit, delete ANY task in their org or child orgs
- **User Management**: Can manage users and role assignments
- **Audit Access**: Full access to audit logs
- **Example**: The CEO who needs complete oversight and control

##### Admin Role
- **Task Management**: Can create new tasks and manage ALL tasks within their organization
- **Edit/Delete**: Can edit or delete ANY task in their organization (not just their own)
- **View All**: Can see all tasks in their organization and child organizations
- **User Management**: Can create Admin and Viewer users in their organization and child organizations
- **Example**: Department managers who need to coordinate all team tasks and onboard new team members

##### Viewer Role
- **Read-Only**: Cannot create, edit, or delete any tasks
- **Limited Visibility**: Can only see tasks they created or are assigned to
- **No Management**: Cannot perform any administrative functions
- **Example**: External consultants or junior team members who only need to track their assigned work

#### Key Permission Rules
- **Task Visibility**: Based on organization membership and hierarchy
- **Task Assignment**: Can only assign tasks to users in same or child organizations
- **Single Role**: Each user has exactly one role (simplifies permission management)
- **Default Role**: New users get Viewer role by default when registering publicly

#### User Creation Permissions

##### Who Can Create Users?
- **Owner**: Can create users with any role (Owner/Admin/Viewer) in their organization
  - Can create Admin/Viewer users in child organizations
  - Cannot create Owner users in child organizations (ownership stays at parent level)
- **Admin**: Can create Admin/Viewer users in their organization
  - Parent org Admins can create Admin/Viewer users in child organizations
  - Cannot create Owner users anywhere
- **Viewer**: Cannot create any users

##### Permission Examples
```
Scenario 1: Parent Org Owner creates Admin in child org ✅
Scenario 2: Parent Org Admin creates Viewer in child org ✅
Scenario 3: Child Org Admin creates Owner in same org ❌
Scenario 4: Viewer attempts to create any user ❌
```

### Organization Hierarchy

#### Architecture
- **2-Level Hierarchy**: Organizations can have a parent-child relationship (max 2 levels)
- **Parent Organization**: Can oversee and manage tasks from child organizations
- **Child Organization**: Operates independently but visible to parent organization
- **No Grandchildren**: A child organization cannot have its own children (enforced in code)
- **No Sibling Visibility**: Child organizations CANNOT see each other's tasks

#### How It Works
```
TechCorp Holdings (Parent)
├── TechCorp Development (Child)
├── TechCorp Marketing (Child)
└── TechCorp Support (Child)

StartupInc (Independent)
└── StartupInc Dev Team (Child)
```

##### Visibility Rules:
- Users in **TechCorp Holdings** (parent) can see:
  - ✅ TechCorp Holdings tasks
  - ✅ TechCorp Development tasks
  - ✅ TechCorp Marketing tasks
  - ✅ TechCorp Support tasks
  
- Users in **TechCorp Development** (child) can see:
  - ✅ TechCorp Development tasks (their own)
  - ✅ TechCorp Holdings tasks (parent)
  - ❌ TechCorp Marketing tasks (sibling - NOT visible)
  - ❌ TechCorp Support tasks (sibling - NOT visible)

- Users in **StartupInc** cannot see any TechCorp tasks (completely isolated)

#### Practical Examples

##### Example 1: Parent Organization Owner
```
User: owner@techcorp-holdings.com
Organization: TechCorp Holdings (Parent)
Role: Owner

Can do:
- Create, edit, delete tasks in TechCorp Holdings
- Create, edit, delete tasks in ALL child organizations
- View all tasks across the entire organization hierarchy
- Manage users and roles across all organizations
```

##### Example 2: Child Organization Admin
```
User: admin@techcorp-development.com
Organization: TechCorp Development (Child)
Role: Admin

Can do:
- Create tasks in TechCorp Development
- Edit/delete ALL tasks in TechCorp Development
- View all tasks in TechCorp Development
- View tasks from TechCorp Holdings (parent)
- CANNOT see tasks from Marketing or Support (siblings)
```

##### Example 3: Cross-Organization Task Assignment
```
Scenario: Parent org Admin assigns task to child org user

User: admin@techcorp-holdings.com (Parent Admin)
Action: Creates task and assigns to developer@techcorp-development.com

Result:
- Task created in TechCorp Holdings
- Visible to Holdings users and Development users
- NOT visible to Marketing or Support users
```

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

4. Configure environment variables in `.env`:
```env
# Application Configuration
NODE_ENV=development
PORT=3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Database Configuration
DATABASE_PATH=./data/database.sqlite

# API Configuration
API_PREFIX=api

# Bcrypt Configuration
BCRYPT_ROUNDS=12
```

5. The database will be automatically created and seeded on first run.

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Run the API with auto-reload
npm run dev

# Or using NX
npm run start:api
```

The API will be available at `http://localhost:3000/api`

### Production Build
```bash
# Build the API
npm run build:api

# Run the built application
node dist/apps/api/main.js
```

## 🧪 Testing

### Run Unit Tests
```bash
# Run API tests
npm run test:api

# Run Auth library tests
npm run test:auth

# Run all tests (using NX)
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Run E2E Tests
```bash
npx nx e2e api-e2e
```

## 📚 API Documentation

### Authentication Endpoints

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
    "role": "Admin"  // Single role string, not array
  }
}
```

### Organization Management Endpoints (SystemAdmin only)

All organization management endpoints require JWT authentication and SystemAdmin role:
```http
Authorization: Bearer <jwt-token>
```

#### Create Organization
```http
POST /api/organizations
Content-Type: application/json

{
  "name": "New Company",
  "parentId": null  // Optional: ID of parent organization for child orgs
}
```

#### Create Owner for Organization
```http
POST /api/organizations/:id/owner
Content-Type: application/json

{
  "email": "owner@newcompany.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Owner"
}
```

### User Management Endpoints

All user management endpoints require JWT authentication:
```http
Authorization: Bearer <jwt-token>
```

#### Create User (Owner/Admin only)
```http
POST /api/users
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "organizationId": 1,
  "roleType": "Admin"  // Owner, Admin, or Viewer
}
```

**Permission Requirements:**
- **Owner**: Can create any role in same org, Admin/Viewer in child orgs
- **Admin**: Can create Admin/Viewer in same org or child orgs
- **Viewer**: Cannot create users (403 Forbidden)

Response:
```json
{
  "success": true,
  "data": {
    "id": 3,
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "organizationId": 1,
    "isActive": true
  },
  "message": "User created successfully"
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
3. **Role**: RBAC roles (SystemAdmin, Owner, Admin, Viewer)
4. **UserRole**: One-to-one mapping between users and roles (one role per user)
5. **Task**: Core task entity with status, priority, and assignments
6. **AuditLog**: Comprehensive action logging

### Database Architecture

#### Entity Relationship Diagram
```
┌──────────────┐         ┌──────────────┐
│ Organization │ 1     n │     User     │
├──────────────┤ ◄────── ├──────────────┤
│ id (PK)      │         │ id (PK)      │
│ name         │         │ email        │
│ parentId(FK) │         │ passwordHash │
│ createdAt    │         │ firstName    │
│ updatedAt    │         │ lastName     │
└──────────────┘         │ orgId (FK)   │
       ↑                 │ isActive     │
       │                 └──────────────┘
       │ self-reference           │
       └─────────────             │ n
                                  ↓
┌──────────────┐         ┌──────────────┐
│     Role     │ 1     1 │   UserRole   │
├──────────────┤ ◄────── ├──────────────┤
│ id (PK)      │         │ id (PK)      │
│ name         │         │ userId (FK)  │
│ description  │         │ roleId (FK)  │
│ level        │         │              │
│ createdAt    │         └──────────────┘
└──────────────┘         (unique: userId)
                                  
┌──────────────┐         ┌──────────────┐
│     Task     │ n     1 │   AuditLog   │
├──────────────┤ ────────► ├──────────────┤
│ id (PK)      │         │ id (PK)      │
│ title        │         │ userId (FK)  │
│ description  │         │ action       │
│ status       │         │ entityType   │
│ priority     │         │ entityId     │
│ category     │         │ changes      │
│ dueDate      │         │ ipAddress    │
│ createdBy(FK)│         │ userAgent    │
│ assignedTo(FK)│        │ createdAt    │
│ orgId (FK)   │         └──────────────┘
└──────────────┘
```

#### Key Relationships
- **Organization**: Self-referencing for parent-child hierarchy (max 2 levels)
- **User → Organization**: Many-to-one (users belong to one org)
- **User → Role**: One-to-one through UserRole (each user has exactly one role)
- **Task → User**: Two relationships (createdBy and assignedTo)
- **Task → Organization**: Tasks belong to organizations
- **AuditLog → User**: Tracks which user performed actions

## 🔐 Security Features

- **Password Hashing**: bcrypt with configurable rounds (default: 12)
- **JWT Tokens**: Configurable expiration (default: 24 hours)
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

### Initial Database Seed Data

The database is automatically seeded with minimal test data:

#### Organizations
```
TechCorp Holdings (Parent)
└── TechCorp Development (Child)
```

#### Test Users
| Email | Password | Organization | Role | Description |
|-------|----------|-------------|------|-------------|
| `admin@system.com` | `password123` | System | SystemAdmin | Platform administrator |
| `owner@techcorp.com` | `password123` | TechCorp Holdings | Owner | Full org access |
| `admin@techcorp.com` | `password123` | TechCorp Holdings | Admin | Can manage all org tasks |
| `viewer@techcorp.com` | `password123` | TechCorp Holdings | Viewer | Read-only access to assigned tasks |

Note: All users must be created via authenticated endpoints:
- SystemAdmin creates organizations and their owners via `/organizations` endpoints
- Owners/Admins create users in their org via `/users` endpoint

2. **Testing API**: Use the HTTP test files in `docs/api/`:
   - `auth-test.http`: Authentication testing
   - `task-test.http`: Task management testing
   - `org-hierarchy-test.http`: Organization hierarchy testing
   - `user-test.http`: User creation and permissions testing

3. **Making Changes**: 
   - Services are in `apps/api/src/app/services/`
   - DTOs are in `libs/data/src/lib/dto/`
   - Guards are in `libs/auth/src/lib/guards/`

## 🔄 Future Enhancements

### Frontend Development (Priority)
- [ ] Angular Dashboard Application
- [ ] User Authentication UI (Login)
- [ ] Task Management Interface
- [ ] Organization Management
- [ ] Role-based UI Components
- [ ] Responsive Design with TailwindCSS

### API Improvements
- [ ] Pagination for all list endpoints
- [ ] Advanced filtering and search
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