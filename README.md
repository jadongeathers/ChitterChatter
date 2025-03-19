# Chitterchatter

A real-time conversation system with AI feedback capabilities.

## Overview

Chitterchatter is a platform that enables users to practice conversations with AI, receive feedback, and track their progress. The system features role-based access (student, instructor, master), conversational analytics, and uses OpenAI's real-time API for natural dialogue interactions.

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

4. Configure environment variables
   Create a `.env` file in the backend directory with:
   ```
   FLASK_APP=app
   FLASK_ENV=development
   SECRET_KEY=your_secret_key
   OPENAI_API_KEY=your_openai_api_key
   ```

5. Initialize the database
   ```bash
   cd backend
   flask db upgrade
   ```

6. Run the backend server
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

3. Configure environment variables
   Create a `.env` file in the frontend directory with:
   ```
   VITE_API_URL=http://localhost:5000
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

## OpenAI Real-time API Integration

Chitterchatter uses OpenAI's real-time API for handling voice conversations. The integration is managed primarily in:

- `backend/app/routes/chatbot.py`: Handles API requests and responses
- `backend/app/services/voice_service.py`: Manages voice processing 

For the undergraduate student, you'll need to provide a separate API key with appropriate usage limits to prevent accidental overruns.

## User Roles and Permissions

The system has three main user roles:

1. **Student** - Can participate in practice conversations, view feedback, and track their progress
2. **Instructor** - Can review student conversations, provide feedback, and manage practice cases
3. **Master** - Has administrative access to manage users and system settings

## Development Guidelines

### Code Style

- Backend: Follow PEP 8 guidelines
- Frontend: Follow the project's ESLint configuration

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

### Testing

- Run backend tests:
  ```bash
  cd backend
  pytest
  ```

- Run frontend tests:
  ```bash
  cd frontend
  npm test
  ```

## Troubleshooting

Common issues and solutions:

- **API Key Issues**: Ensure your OpenAI API key has access to the required models
- **Database Errors**: Check database connection and run migrations
- **WebSocket Errors**: Verify WebSocket service is running and accessible
