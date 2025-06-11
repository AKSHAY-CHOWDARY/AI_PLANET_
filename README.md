# Chat with PDF

A web application that allows users to chat with their PDF documents using AI.

## Project Structure
```
.
├── client/          # Frontend React application
├── server/          # Backend FastAPI application
└── README.md
```

## Setup Instructions

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Create and activate virtual environment:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` file:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

### Backend (.env)
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=8000
HOST=0.0.0.0
PDFS_DIRECTORY=pdfs
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000
```

## Development

- Backend runs on: http://localhost:8000
- Frontend runs on: http://localhost:3000

## Deployment

### Backend
- Can be deployed on Vercel, AWS, or any other cloud platform
- Make sure to set up environment variables in your deployment platform

### Frontend
- Can be deployed on Vercel, Netlify, or any other static hosting service
- Update the API base URL in production environment

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 