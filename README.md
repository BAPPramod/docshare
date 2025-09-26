# DocShare Mini - Full-Stack Document Sharing Application

A minimal full-stack web application for uploading and sharing documents with secure access control and audit logging.

---

## Table of Contents
1. [Project Overview](#project-overview)  
2. [Setup Instructions](#setup-instructions)  
3. [Test Accounts](#test-accounts)  
4. [Features](#features)  
5. [API Endpoints](#api-endpoints)  
6. [Database Schema](#database-schema)  
7. [Security Features](#security-features)  
8. [Potential Improvements](#potential-improvements)  
9. [Architecture Decisions](#architecture-decisions)  

---

## Project Overview
- **Frontend:** Vue 3 + TypeScript + Tailwind CSS + TanStack Query (Vue Query)  
- **Backend:** Express.js + TypeScript + Prisma ORM + SQLite  
- **Authentication:** Email/password with JWT tokens  
- **File Management:** Upload, download, share, delete, and audit logging

---

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup environment variables:**
```bash
cp .env.example .env
# Edit .env with your preferences
```

4. **Setup database:**
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

5. **Start development server:**
```bash
npm run dev
```

Backend will run on http://localhost:3000

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup environment variables:**
```bash
cp .env.example .env
# Edit VITE_API_BASE_URL if necessary
```

4. **Start development server:**
```bash
npm run dev
```

Frontend will run on http://localhost:5173

### Test Accounts

These accounts are pre-seeded for demo purposes:
- **alice@example.com** / password123
- **bob@example.com** / password123  
- **carol@example.com** / password123

---

## Features

### Core Features
- **Authentication**: Email/password signup and signin with JWT tokens
- **Document Upload**: Supports PDF, JPG, PNG with file validation and size limits
- **Document Listing**: Shows owned documents and documents shared with user
- **Document Sharing**: Share documents with other registered users via email
- **Download**: Both owners and shared users can download files
- **Audit Logging**: Tracks download actions in database

### Additional Features
- Responsive Design with Tailwind CSS
- Real-time Updates with TanStack Query
- File Management: Delete owned documents
- Share Management: View/remove shared documents
- Error Handling & Loading States
- File Type Icons & Human-readable Sizes

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login

### Documents
- `GET /api/documents` - List documents (owned + shared)
- `POST /api/documents` - Upload new document
- `GET /api/documents/:id/download` - Download document
- `DELETE /api/documents/:id` - Delete owned document

### Sharing
- `POST /api/shares/:id/share` - Share document with a user
- `DELETE /api/shares/:id/unshare` - Remove a share
- `GET /api/shares/users` - Search users for sharing

---

## Database Schema

- **Users**: User accounts with authentication
- **Documents**: File metadata and ownership
- **DocumentShares**: Many-to-many relationship for sharing
- **AuditLogs**: Tracks file access

---

## Security Features

- JWT-based authentication with secure token handling
- File type validation and size limits
- Path traversal protection
- CORS configuration
- Input sanitization and validation
- Authorization checks for all document operations

---

## Potential Improvements

### Performance & Scalability
- Cloud storage (S3/R2), CDN, caching, file compression
- Database optimization and pagination

### Security  
- Multi-factor authentication, virus scanning, rate limiting
- End-to-end encryption for sensitive files

### User Experience
- Drag & drop uploads, bulk operations, in-browser preview, notifications
- Mobile app support

### Collaboration & Administration
- Versioning, comments, shared folders, activity feed
- Admin dashboard, backups, analytics

### Technical Enhancements
- TypeScript strict mode, automated tests, CI/CD, Docker, monitoring
- API documentation (Swagger/OpenAPI)

---

## Architecture Decisions

### Backend Choices
- **Express.js + TypeScript**: Mature, well-documented web framework
- **SQLite + Prisma**: Simple setup for demo, easy migration to PostgreSQL
- **JWT Authentication**: Stateless, scalable authentication approach
- **Multer**: Robust file upload handling with validation

### Frontend Choices  
- **Vue 3 + Composition API**: Modern reactive framework with excellent TypeScript support
- **TanStack Query**: Sophisticated data fetching with caching and optimistic updates  
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Pinia**: Lightweight state management with great DevTools

### Trade-offs Made
- **Local File Storage**: Chosen for simplicity, would use cloud storage in production
- **SQLite Database**: Great for development/demo, PostgreSQL recommended for production
- **Simple Authentication**: Basic email/password, would add OAuth and MFA in production
- **Client-side Routing**: SPA approach chosen over SSR for development speed