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
- **Task Filtering**: Client-side filtering by category (Work/Personal/Other), status, and priority
- **Task Sorting**: Client-side sorting by creation date, due date, priority, status, or title
  - Note: Filtering and sorting currently implemented client-side for better UX responsiveness
- **Role-based UI**: Different permissions for Owner/Admin vs Viewer roles
- **NX Monorepo**: Shared libraries and efficient build system

### Backend Features
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control (RBAC)**: Four-tier role system (SystemAdmin > Owner > Admin > Viewer)
  - Note: PDF specifies 3 roles (Owner, Admin, Viewer). SystemAdmin added for platform management
- **Organization Hierarchy**: 2-level parent-child organization structure
- **Task Management**: Full CRUD operations with role-based permissions
- **Audit Logging**: Comprehensive tracking of all system actions with UI dashboard
- **TypeORM with SQLite**: Lightweight database with automatic migrations

### Task Data Model

#### Task Fields and Validation

| Field | Type | Required | Allowed Values | Description |
|-------|------|----------|----------------|-------------|
| title | string | Yes | 1-200 chars | Task title |
| description | string | No | max 2000 chars | Task description |
| status | enum | No | `pending`, `in-progress`, `completed` | Current task status (default: `pending`) |
| priority | enum | No | `low`, `medium`, `high` | Task priority level (default: `medium`) |
| category | enum | No | `work`, `personal`, `other` | Task category (default: `work`) |
| dueDate | date | No | Valid date | Task due date |

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

| Role | Create Task | Edit Task | Delete Task | View Tasks | Manage Users | View Audit Logs | Manage Orgs |
|------|------------|-----------|-------------|------------|--------------|------------|-------------|
| **SystemAdmin** | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All roles | ✅ | ✅ |
| **Owner** | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All roles | ✅ | ❌ |
| **Admin** | ✅ | ✅ All | ✅ All | ✅ All | ✅ Admin/Viewer | ✅ | ❌ |
| **Viewer** | ❌ | ❌ | ❌ | ✅ Own only | ❌ | ❌ | ❌ |

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
- **Audit Access**: Full access to audit logs through dedicated UI dashboard
- **Example**: The CEO who needs complete oversight and control

##### Admin Role
- **Task Management**: Can create new tasks and manage ALL tasks within their organization
- **Edit/Delete**: Can edit or delete ANY task in their organization (not just their own)
- **View All**: Can see all tasks in their organization and child organizations
- **User Management**: Can create Admin and Viewer users in their organization and child organizations
- **Example**: Department managers who need to coordinate all team tasks and onboard new team members

##### Viewer Role
- **Read-Only**: Cannot create, edit, or delete any tasks
- **Limited Visibility**: Can only see tasks they created
- **No Management**: Cannot perform any administrative functions
- **Example**: External consultants or junior team members who only need to track their own work

#### Key Permission Rules
- **Task Visibility**: Based on organization membership and hierarchy
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

##### Example 3: Cross-Organization Task Visibility
```
Scenario: Parent org Admin creates task

User: admin@techcorp-holdings.com (Parent Admin)
Action: Creates task in TechCorp Holdings

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
npm run test:api          # API tests (backend)
npm run test:dashboard    # Dashboard tests (frontend - includes component and service tests)
npm run test:auth         # Auth library tests
npm run test:data         # Data library tests

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Test only affected projects (based on git changes)
npm run test:affected
```

#### Frontend Test Coverage
The dashboard includes comprehensive test suites for:
- **Services**: AuthService (login/logout), TaskService (CRUD operations)
- **Components**: LoginComponent (form validation, error handling), TaskDashboardComponent, TaskFormComponent
- **Coverage**: Authentication flows, API interactions, error handling, UI state management

## 🛠️ Development Commands

### Component Generation

#### Angular Components (Dashboard)

> **Note**: For Angular generators in Nx, you must specify the full path where you want the component/service/etc. to be created.

```bash
# Generate component (specify full path)
npx nx g @nx/angular:component apps/dashboard/src/app/components/[name] --standalone=false

# Generate service (requires name and project)
npx nx g @nx/angular:service [name] --project=dashboard --path=apps/dashboard/src/app/services

# Generate guard (specify full path)
npx nx g @nx/angular:guard apps/dashboard/src/app/guards/[name]

# Generate directive (specify full path)
npx nx g @nx/angular:directive apps/dashboard/src/app/directives/[name]

# Generate pipe (specify full path)
npx nx g @nx/angular:pipe apps/dashboard/src/app/pipes/[name]

# Generate module (specify full path)
npx nx g @nx/angular:module apps/dashboard/src/app/modules/[name]

# Examples:
# Component in subdirectory
npx nx g @nx/angular:component apps/dashboard/src/app/components/tasks/task-list --standalone=false

# Service
npx nx g @nx/angular:service task --project=dashboard --path=apps/dashboard/src/app/services

# Guard
npx nx g @nx/angular:guard apps/dashboard/src/app/guards/auth
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
npx nx g @nx/angular:component apps/dashboard/src/app/components/auth/login --standalone=false --style=scss

# 2. Generate a service for authentication
npx nx g @nx/angular:service auth --project=dashboard --path=apps/dashboard/src/app/services

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
  "category": "work"
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
    "category": "work",
    "createdBy": 1,
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
      "priority": "high"
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
    "category": "work",
    "createdBy": 1,
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
  "category": "work"
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

### Audit Log Endpoints (SystemAdmin/Owner/Admin only)

#### Get Audit Logs
```http
GET /api/audit-log
GET /api/audit-log?action=task:created&limit=10
GET /api/audit-log?userId=2&page=1&limit=5
GET /api/audit-log?startDate=2025-08-18T00:00:00Z&endDate=2025-08-25T23:59:59Z
```

Query Parameters:
- `userId`: Filter by specific user ID
- `action`: Filter by action type (e.g., "task:created", "user:login")
- `resourceType`: Filter by resource type (e.g., "task", "user")
- `startDate`: Filter logs from this date (ISO 8601 format)
- `endDate`: Filter logs until this date (ISO 8601 format)
- `page`: Page number for pagination (default: 1)
- `limit`: Number of records per page (default: 50)

Response:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "userId": 1,
        "action": "task:created",
        "resourceType": "task",
        "resourceId": 1,
        "organizationId": 1,
        "details": {},
        "ipAddress": "::1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 50,
    "totalPages": 2
  }
}
```

#### Audit Log UI Dashboard
The frontend includes a comprehensive audit log dashboard accessible to SystemAdmin, Owner, and Admin roles:
- **Access**: Click "Audit Logs" button in the task dashboard header
- **Filtering**: Filter by date range, action, resource type, and user ID
- **Visual Indicators**: Color-coded action badges for easy scanning
- **Permission-based**: Only visible to users with appropriate roles

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
│ orgId (FK)   │         └──────────────┘
└──────────────┘
```

#### Key Relationships
- **Organization**: Self-referencing for parent-child hierarchy (max 2 levels)
- **User → Organization**: Many-to-one (users belong to one org)
- **User → Role**: One-to-one through UserRole (each user has exactly one role)
- **Task → User**: Relationship through createdBy
- **Task → Organization**: Tasks belong to organizations
- **AuditLog → User**: Tracks which user performed actions

## 🔐 Security Features

### Backend Security
- **Password Hashing**: bcrypt with configurable rounds (default: 12)
- **JWT Tokens**: Configurable expiration (default: 24 hours) with `iat` and `exp` claims
- **Global Auth Guard**: All API routes protected by default with JWT validation
- **Role-Based Guards**: Fine-grained access control with single role per user
- **Audit Logging**: Track all sensitive operations

### Frontend Security
- **Route Guards**: All dashboard routes protected with authentication checks
- **AuthGuard**: Ensures users are logged in before accessing protected pages
- **RoleGuard**: Restricts access to specific routes based on user roles
- **Automatic Redirects**: Unauthenticated users redirected to login
- **Token Validation**: Backend validates JWT expiration on every request

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
│       │   │   ├── guards/        # Frontend route guards
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
| `viewer@techcorp.com` | `password123` | TechCorp Holdings | Viewer | Read-only access to own tasks |

Note: All users must be created via authenticated endpoints:
- SystemAdmin creates organizations and their owners via `/organizations` endpoints
- Owners/Admins create users in their org via `/users` endpoint

2. **Testing API**: Use the HTTP test files in `docs/api/`:
   - `auth-tests.http`: Authentication testing
   - `task-test.http`: Task management testing
   - `org-hierarchy-test.http`: Organization hierarchy testing
   - `user-test.http`: User creation and permissions testing

3. **Making Changes**:
   - Backend Services: `apps/api/src/app/services/`
   - Frontend Components: `apps/dashboard/src/app/components/`
   - DTOs: `libs/data/src/lib/dto/`
   - Guards: `libs/auth/src/lib/guards/`

### Frontend Routes and Guards

#### Protected Routes
- `/login` - Public route (redirects to dashboard if already authenticated)
- `/dashboard` - Protected by `AuthGuard` (requires authentication)
- `/audit-logs` - Protected by `RoleGuard` (requires SystemAdmin, Owner, or Admin role)
- All other paths redirect to login

#### Guard Implementation
- **AuthGuard**: Checks for valid JWT token in localStorage
- **RoleGuard**: Validates both authentication and role-based permissions
- Guards use Angular's `UrlTree` for automatic redirects
- Unauthorized access results in redirect to login or dashboard

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

### Frontend Development
- [x] Angular Dashboard Application
- [x] Tailwind CSS v3 Integration
- [x] Login Component with JWT Authentication
- [x] Task Management Interface (CRUD)
  - [x] Create new tasks
  - [x] Edit existing tasks
  - [x] Delete tasks
  - [x] Filter by Category (Work/Personal/Other)
  - [x] Filter by Status (Pending/In Progress/Completed)
  - [x] Filter by Priority (High/Medium/Low)
  - [x] Sort by Date, Priority, Status, Title
- [x] Role-based UI Components
- [x] Responsive Mobile Design

## ⚠️ Required Features - Not Yet Implemented

### Per PDF Specification Requirements
- [ ] **Drag-and-drop for task reordering and status changes** (REQUIRED)
  - Specified in PDF: "Drag-and-drop for reordering/status changes"
  - Would enable users to visually manage task workflow
  - Implementation would use Angular CDK drag-drop module

### Future Enhancements (Optional)
- [ ] Organization Management Dashboard
- [ ] Dark Mode Support

### API Improvements
- [ ] Pagination for all list endpoints
- [ ] Server-side filtering and sorting (Optional - not required)
  - Currently all filtering/sorting is done client-side in Angular
  - Client-side approach provides instant feedback and better UX for current dataset sizes
  - Server-side would be beneficial for very large datasets (1000+ tasks)
  - Would add query parameters: `?status=pending&priority=high&category=work&sortBy=createdAt`
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