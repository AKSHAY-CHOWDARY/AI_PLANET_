from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import shutil
from typing import List
from my_rag import MyRAGAgent
import logging
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import get_db, engine
import models
from auth import get_current_user, verify_google_token, create_access_token, get_or_create_user
from datetime import timedelta

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="RAG PDF Chat API",
    description="A FastAPI backend server with RAG capabilities for PDF document processing and intelligent chat functionality",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize RAG Agent with environment variable
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    logger.error("OPENAI_API_KEY environment variable not set")
    my_rag_agent = None
else:
    try:
        my_rag_agent = MyRAGAgent(openai_api_key=OPENAI_API_KEY)
        logger.info("RAG Agent initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize RAG Agent: {e}")
        my_rag_agent = None

# Create PDFs directory if it doesn't exist
pdfs_dir = os.path.join(os.path.dirname(__file__), "pdfs")
os.makedirs(pdfs_dir, exist_ok=True)
logger.info(f"PDFs directory created at: {pdfs_dir}")


class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    status: str = "success"

class UploadResponse(BaseModel):
    message: str
    filename: str
    status: str = "success"

class StatusResponse(BaseModel):
    status: str
    rag_agent_ready: bool
    pdfs_directory: str
    documents_loaded: int


@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the main HTML page"""
    try:
        with open("static/index.html", "r") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="<h1>RAG PDF Chat API</h1><p>Backend server is running. Use the API endpoints to interact with the service.</p>")


@app.post("/upload-pdf", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and process a PDF file for RAG"""
    try:
        if my_rag_agent is None:
            raise HTTPException(
                status_code=503, 
                detail="RAG Agent is not initialized. Please check server configuration."
            )
        
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file provided"
            )
        
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are allowed"
            )
        
        # Validate file size (max 50MB)
        content = await file.read()
        if len(content) > 50 * 1024 * 1024:  # 50MB
            raise HTTPException(
                status_code=413,
                detail="File too large. Maximum size is 50MB."
            )
        
        # Reset file pointer for reading
        await file.seek(0)
        
        # Save the uploaded file
        file_path = os.path.join(pdfs_dir, file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        logger.info(f"PDF saved to: {file_path}")
        
        # Process only the uploaded file
        my_rag_agent.load_documents([file_path])
        
        logger.info(f"Successfully processed: {file.filename}")
        
        return UploadResponse(
            message=f"Successfully uploaded and processed {file.filename}",
            filename=file.filename,
            status="success"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading PDF: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Chat with the RAG system about uploaded documents"""
    try:
        if my_rag_agent is None:
            raise HTTPException(
                status_code=503, 
                detail="RAG Agent is not initialized. Please check server configuration."
            )
        
        if not message.message.strip():
            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty"
            )
        
        logger.info(f"Processing chat request: {message.message[:100]}...")
        
        response = my_rag_agent.ask(message.message)
        
        logger.info("Chat response generated successfully")
        
        return ChatResponse(
            response=response,
            status="success"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate response: {str(e)}"
        )


@app.get("/status", response_model=StatusResponse)
async def get_status():
    """Get server status and configuration"""
    try:
        # Count PDF files in directory
        pdf_count = len([f for f in os.listdir(pdfs_dir) if f.lower().endswith('.pdf')])
        
        return StatusResponse(
            status="running",
            rag_agent_ready=my_rag_agent is not None,
            pdfs_directory=pdfs_dir,
            documents_loaded=pdf_count
        )
        
    except Exception as e:
        logger.error(f"Error getting status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get status: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Simple health check endpoint"""
    return {"status": "healthy", "service": "RAG PDF Chat API"}


@app.delete("/reset")
async def reset_documents():
    """Reset all documents and chat history"""
    global my_rag_agent
    try:
        if my_rag_agent is None:
            raise HTTPException(
                status_code=503, 
                detail="RAG Agent is not initialized"
            )
        
        # Clear PDF files
        for filename in os.listdir(pdfs_dir):
            if filename.lower().endswith('.pdf'):
                os.remove(os.path.join(pdfs_dir, filename))
        
        # Reinitialize RAG agent to clear vector store and chat history
        if not OPENAI_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="OpenAI API key not available"
            )
        my_rag_agent = MyRAGAgent(openai_api_key=OPENAI_API_KEY)
        
        logger.info("Documents and chat history reset successfully")
        
        return {"message": "All documents and chat history have been reset", "status": "success"}
        
    except Exception as e:
        logger.error(f"Error resetting documents: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reset documents: {str(e)}"
        )


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"message": "Endpoint not found", "path": str(request.url.path)}
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error", "detail": "Please try again later"}
    )


@app.post("/speech-to-text", response_model=SpeechResponse)
async def speech_to_text(request: SpeechRequest):
    """Convert speech to text using Google Cloud Speech-to-Text"""
    try:
        if speech_client is None:
            raise HTTPException(
                status_code=503,
                detail="Speech-to-Text service is not available"
            )

        # Decode base64 audio data
        audio_data = base64.b64decode(request.audio_data)

        # Configure the recognition
        audio = speech.RecognitionAudio(content=audio_data)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
            sample_rate_hertz=48000,
            language_code="en-US",
            enable_automatic_punctuation=True,
        )

        # Perform the transcription
        response = speech_client.recognize(config=config, audio=audio)

        # Get the transcript
        transcript = ""
        for result in response.results:
            transcript += result.alternatives[0].transcript

        return SpeechResponse(
            transcript=transcript,
            status="success"
        )

    except Exception as e:
        logger.error(f"Error in speech-to-text: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process speech: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting RAG PDF Chat API server...")
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info",
        access_log=True
    )
