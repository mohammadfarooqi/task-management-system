# Task Management System

A comprehensive task management system built with NX monorepo architecture, featuring role-based access control (RBAC), organizational hierarchy, and audit logging.

## 🏗️ Architecture Overview

This project uses an NX monorepo structure with:
- **Backend API** (`apps/api`): NestJS REST API with TypeORM and SQLite
- **Frontend Dashboard** (`apps/dashboard`): Angular 17 application with Tailwind CSS
- **Shared Libraries**:
  - `libs/auth`: Authentication guards, JWT configuration
  - `libs/data`: Shared DTOs, interfaces, and role helpers

## 🚀 Features

### Frontend Features
- **Angular 17**: Modern Angular application with TypeScript
- **Tailwind CSS v3**: Utility-first CSS framework for rapid UI development
- **Responsive Design**: Mobile-first responsive layouts
- **Component Architecture**: Modular and reusable components
- **NX Monorepo**: Shared libraries and efficient build system

### Backend Features
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control (RBAC)**: Four-tier role system (SystemAdmin > Owner > Admin > Viewer)
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
- pnpm (recommended) or npm
- Git
- Angular CLI (optional, for global commands)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd task-management-system
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
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

### Quick Start
```bash
# Start both API and Dashboard together (recommended)
npm start
# or
npm run dev
```

### Development Mode

#### Backend (API)
```bash
# Run the API server
npm run start:api
# or
npm run dev:api
```

The API will be available at `http://localhost:3000/api`

#### Frontend (Dashboard)
```bash
# Run the Angular dashboard
npm run start:dashboard
# or
npm run dev:dashboard
```

The dashboard will be available at `http://localhost:4200`

### Production Build

#### Build Everything
```bash
# Build all projects
npm run build

# Build with production optimizations
npm run build:prod
```

#### Build Individual Projects
```bash
# Build the API
npm run build:api

# Build the dashboard
npm run build:dashboard

# Build libraries
npm run build:libs
```

#### Running Production Build
```bash
# After building, run the API
node dist/apps/api/main.js

# Serve the dashboard (dist/apps/dashboard)
# Use any static file server like nginx, serve, or http-server
npx serve dist/apps/dashboard
```

## 🧪 Testing

### Run Unit Tests
```bash
# Run all tests across the monorepo
npm test

# Run specific project tests
npm run test:api          # API tests
npm run test:dashboard    # Dashboard tests
npm run test:auth         # Auth library tests
npm run test:data         # Data library tests

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Test only affected projects (based on git changes)
npm run test:affected
```

## 🛠️ Development Commands

### Component Generation

#### Angular Components (Dashboard)
```bash
# Generate a new component (shortcut for dashboard)
npm run g:dash-component -- [name] --path=apps/dashboard/src/app/components

# Generate a service (shortcut for dashboard)
npm run g:dash-service -- [name] --path=apps/dashboard/src/app/services

# Generate a guard (shortcut for dashboard)
npm run g:dash-guard -- [name] --path=apps/dashboard/src/app/guards

# Examples:
# Generate auth service
npm run g:dash-service -- auth --path=apps/dashboard/src/app/services

# Generate login component in auth folder
npm run g:dash-component -- login --path=apps/dashboard/src/app/components/auth --standalone=false --style=scss

# Full syntax for any project:
npm run g:component -- [name] --project=dashboard --path=apps/dashboard/src/app/components
npm run g:service -- [name] --project=dashboard --path=apps/dashboard/src/app/services
npm run g:directive -- [name] --project=dashboard --path=apps/dashboard/src/app/directives
npm run g:pipe -- [name] --project=dashboard --path=apps/dashboard/src/app/pipes
npm run g:guard -- [name] --project=dashboard --path=apps/dashboard/src/app/guards
npm run g:module -- [name] --project=dashboard --path=apps/dashboard/src/app/modules
```

#### NestJS Components (API)
```bash
# Generate a new module
npm run g:api-module -- --name=users --project=api

# Generate a controller
npm run g:api-controller -- --name=users --project=api

# Generate a service
npm run g:api-service -- --name=users --project=api

# Generate a complete resource (module, controller, service, DTOs)
npm run g:api-resource -- --name=projects --project=api
```

### Code Quality

#### Linting
```bash
# Lint all projects
npm run lint

# Lint specific project
npm run lint:api
npm run lint:dashboard

# Auto-fix linting issues
npm run lint:fix

# Lint only affected projects
npm run affected:lint
```

#### Formatting
```bash
# Format code
npm run format

# Check formatting without changes
npm run format:check
```

#### Type Checking
```bash
# Run TypeScript type checking
npm run typecheck
```

### Build & Clean

```bash
# View project dependency graph
npm run graph

# Reset NX cache
npm run reset

# Build only affected projects
npm run affected:build

# Clean build artifacts and cache
npm run clean

# Full clean (including node_modules)
npm run clean:full

# Clean install dependencies
npm run install:clean

# Reset database (removes SQLite file)
npm run db:reset
```

### Example Workflows

#### Creating a New Component (e.g., Login)
```bash
# 1. Generate the component in a specific folder structure
npm run g:component apps/dashboard/src/app/components/auth/login -- --standalone=false --style=scss --module=apps/dashboard/src/app/app.module.ts

# 2. Generate a service for authentication
npm run g:service apps/dashboard/src/app/services/auth

# 3. Start the dev server to see it
npm run dev:dashboard
```

#### Creating a New API Endpoint
```bash
# Generate a complete resource with CRUD operations
npm run g:api-resource -- --name=comments --project=api

# Or generate individually:
npm run g:api-module -- --name=comments --project=api
npm run g:api-controller -- --name=comments --project=api --path=apps/api/src/app/comments
npm run g:api-service -- --name=comments --project=api --path=apps/api/src/app/comments
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
  },
  "message": "Login successful"
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

Response:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "New Company",
    "parentId": null
  },
  "message": "Organization created successfully"
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

Response:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "email": "owner@newcompany.com",
    "firstName": "John",
    "lastName": "Owner",
    "organizationId": 2,
    "role": "Owner",
    "organization": "New Company"
  },
  "message": "Owner created successfully for organization"
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

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Task title",
    "description": "Task description",
    "status": "pending",
    "priority": "high",
    "category": "development",
    "createdBy": 1,
    "assignedTo": 2,
    "organizationId": 1
  },
  "message": "Task created successfully"
}
```

#### Get All Tasks
```http
GET /api/tasks
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Task title",
      "status": "pending",
      "priority": "high",
      "assignedTo": 2
    }
  ]
}
```

#### Get Single Task
```http
GET /api/tasks/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Task title",
    "description": "Task description",
    "status": "pending",
    "priority": "high",
    "category": "development",
    "createdBy": 1,
    "assignedTo": 2,
    "organizationId": 1
  }
}
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

Response:
```json
{
  "success": true,
  "data": null,
  "message": "Task deleted successfully"
}
```

### Audit Log Endpoints (Admin/Owner only)

#### Get Audit Logs
```http
GET /api/audit-log
GET /api/audit-log?action=task:created&limit=10
GET /api/audit-log?userId=2&page=1&limit=5
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 1,
      "action": "task:created",
      "resourceType": "task",
      "resourceId": 1,
      "organizationId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
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
├──────────────┤ ──────► ├──────────────┤
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
│   └── dashboard/           # Angular frontend application
│       ├── src/
│       │   ├── app/
│       │   │   ├── components/
│       │   │   │   └── auth/
│       │   │   │       └── login/  # Login component
│       │   │   ├── services/
│       │   │   ├── app.component.html
│       │   │   ├── app.component.ts
│       │   │   ├── app.module.ts
│       │   │   └── app.routes.ts
│       │   ├── styles.scss  # Global styles with Tailwind directives
│       │   └── main.ts
│       └── project.json
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
├── data/
│   └── database.sqlite      # SQLite database (auto-created)
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
└── package.json             # Project dependencies and scripts
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
   - Backend Services: `apps/api/src/app/services/`
   - Frontend Components: `apps/dashboard/src/app/components/`
   - DTOs: `libs/data/src/lib/dto/`
   - Guards: `libs/auth/src/lib/guards/`

### Frontend Development Notes

#### Tailwind CSS Configuration
- **Config File**: `tailwind.config.js` in project root
- **PostCSS Config**: `postcss.config.js` in project root  
- **Global Styles**: `apps/dashboard/src/styles.scss`
- **Utility Classes**: Automatically generated based on template usage
- **Version**: Tailwind CSS v3 (compatible with Angular 17)

#### Angular 17 Setup
- **TypeScript**: Version 5.4.x (required by Angular 17)
- **NX Version**: 21.1.3 (compatible with Angular 17)
- **Standalone**: Using NgModule architecture (not standalone components)

## 🔄 Future Enhancements

### Frontend Development (In Progress)
- [x] Angular Dashboard Application (Setup Complete)
- [x] Tailwind CSS v3 Integration
- [x] Login Component Structure (components/auth/login)
- [ ] User Authentication UI Implementation
- [ ] Task Management Interface (CRUD)
- [ ] Organization Management Dashboard
- [ ] Role-based UI Components
- [ ] Responsive Mobile Design
- [ ] Dark Mode Support

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
- [ ] Recurring tasks
- [ ] Team collaboration features
- [ ] Export functionality (CSV, PDF)
- [ ] Activity dashboard and analytics
- [ ] Mobile application

## 📝 License

This project is part of a technical assessment.

## 🤝 Contributing

Please follow the existing code style and ensure all tests pass before submitting changes.

## 📞 Support

For questions or issues, please refer to the original requirements document in `docs/requirements.pdf`.