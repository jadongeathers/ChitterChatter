# ChitterChatter

A real-time conversation system with AI feedback capabilities.

## Overview

ChitterChatter is a platform, integrated within school curricula, that enables users to practice speaking in foreign languages with AI, receive feedback, and track their progress. The system features role-based access (student, instructor, master), conversational analytics, and uses OpenAI's real-time API for natural dialogue interactions.

## System Architecture

The application is built with a Python Flask backend and a React frontend using TypeScript.

### Backend Structure

```
backend/
├── app/                    # Main application directory
│   ├── __init__.py         # Flask app initialization
│   ├── config.py           # Configuration settings
│   ├── models/             # Database models
│   ├── routes/             # API endpoints 
│   ├── services/           # External services (e.g., voice)
│   └── utils/              # Utility functions
├── migrations/             # Database migrations
├── scripts/                # Helper scripts
└── tests/                  # Test suite
```

### Frontend Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── common/         # Shared components 
│   │   ├── instructor/     # Instructor-specific components
│   │   ├── master/         # Admin components
│   │   ├── student/        # Student-specific components
│   │   └── ui/             # UI component library
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   ├── pages/              # Page components
│   ├── services/           # API service integrations
│   └── types/              # TypeScript type definitions
```

## Setup and Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Clone the repository
   ```bash
   git clone https://github.com/jadongeathers/ChitterChatter.git
   ```

2. Set up Python virtual environment
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies
   ```bash
   pip install -r backend/requirements.txt
   ```

4. Configure environment variables:
   - Create a `.env` file in the backend directory (keep a `.env.example` with placeholders in version control and never commit real secrets).
   - Populate the variables using the reference table below. A sample configuration:
   ```
   # Flask settings
   SECRET_KEY=replace_me
   FLASK_APP=app.py
   FLASK_ENV=development

   # Database configuration
   DATABASE_URL=postgresql://postgres:postgres@localhost/vpp
   ENCRYPTION_KEY=replace_with_44_char_key

   # OpenAI API key
   OPENAI_API_KEY=sk-...

   # Frontend origin used in CORS checks
   FRONTEND_URL=http://localhost:3000

   # Master user bootstrap
   MASTER_USER_EMAIL=admin@example.com
   MASTER_USER_PASSWORD=choose_a_strong_password

   # Image storage (required for uploads)
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-2
   AWS_S3_BUCKET_NAME=chitterchatter-dev
   ```

5. Initialize the database
   ```bash
   cd backend
   flask db upgrade
   ```

6. (Optional) Seed the master user
   ```bash
   flask seed-master
   ```
   The CLI command in `backend/app/commands.py` reads `MASTER_USER_EMAIL` and `MASTER_USER_PASSWORD` from your environment. Re-run it any time you change the credentials.

7. Run the backend server
   ```bash
   # Option 1: Using Flask command
   flask run
   
   # Option 2: Using the Python script directly
   python app.py
   ```

   The app.py script will:
   - Start Flask on host 0.0.0.0 and port 5001 by default
   - Run in debug mode
   - Display registered routes on startup

### Frontend Setup

1. Navigate to the frontend directory
   ```bash
   cd frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the frontend directory with:
   ```
   VITE_API_URL=http://localhost:5001/api
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

### Backend Environment Reference

| Variable | Description | Used in |
| --- | --- | --- |
| `SECRET_KEY` | Flask session and CSRF signing key. | `backend/app/config.py` |
| `FLASK_APP` | Entry point for CLI commands. | Flask CLI |
| `FLASK_ENV` | Enables debug mode when `development`. | Flask runtime |
| `DATABASE_URL` | SQLAlchemy connection string. | `backend/app/config.py` |
| `ENCRYPTION_KEY` | 44-character Fernet key for sensitive fields. | `backend/app/models/*` |
| `OPENAI_API_KEY` | Authenticates requests to OpenAI APIs. | `backend/app/services/voice_service.py` and others |
| `FRONTEND_URL` | Allowed origin for CORS. | Backend CORS configuration |
| `MASTER_USER_EMAIL` | Email used when seeding the master account. | `backend/app/commands.py` |
| `MASTER_USER_PASSWORD` | Plaintext password used during seeding (hashed in DB). | `backend/app/commands.py` |
| `AWS_ACCESS_KEY_ID` | IAM key with S3 permissions. | `backend/app/services/image_service.py` |
| `AWS_SECRET_ACCESS_KEY` | Secret counterpart to the access key. | `backend/app/services/image_service.py` |
| `AWS_REGION` | AWS region for S3 operations. | `backend/app/services/image_service.py` |
| `AWS_S3_BUCKET_NAME` | Bucket holding uploaded case assets. | `backend/app/services/image_service.py` |

> ⚠️ Rotate any committed secrets immediately and never push real credentials. Keep only placeholder values in `.env.example`.

### Git Workflow

We use a feature branch workflow:

1. Create a new branch for each feature/fix
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit with descriptive messages
   ```bash
   git commit -m "Add feature: detailed description"
   ```

3. Push your branch and create a pull request
   ```bash
   git push origin feature/your-feature-name
   ```

4. After review, your branch will be merged into the main branch
