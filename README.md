# Chat with PDF

**Chat with your PDFs using AI!**  
[Live Demo → https://ai-planet-chat.onrender.com/](https://ai-planet-chat.onrender.com/)

---

## Overview

**Chat with PDF** is a modern web app that lets you upload multiple PDF files and instantly ask questions about their content. It uses advanced Retrieval-Augmented Generation (RAG) with an in-memory vector store and OpenAI’s GPT-4o-mini model for fast, accurate, and context-aware answers.

---

## Features

- **Upload Multiple PDFs:**  
  Drag and drop or select several PDF files at once. The system processes all of them together, so you can query across multiple documents seamlessly.

- **AI-Powered Chat:**  
  Ask any question about your uploaded PDFs. The app uses RAG to efficiently retrieve relevant information and generate helpful, context-aware answers.

- **Lightning-Fast Retrieval:**  
  RAG with an in-memory vector store ensures your queries are answered quickly, even with large or multiple documents.

- **Modern UI:**  
  Clean, responsive interface with light/dark mode, real-time status, and easy controls.

- **No Google API Key Required:**  
  All features work out of the box—just provide your OpenAI API key for local use.

- **Reset & Manage:**  
  Instantly clear all uploaded documents and chat history with a single click.

---

## How It Works

1. **PDF Upload & Loading:**  
   Upload one or more PDFs. Each is loaded and its content extracted.

2. **Document Chunking:**  
   Text is split into overlapping chunks using a **Recursive Character Text Splitter** (chunk size: 1000, overlap: 200, with smart separators). This preserves context and ensures efficient retrieval.

3. **Embedding & In-Memory Vector Store:**  
   Each chunk is embedded using OpenAI’s `text-embedding-3-large` model. All vectors are stored in memory for ultra-fast similarity search—no external database needed.

4. **Query & Retrieval:**  
   When you ask a question, it’s embedded and compared to all document chunks. The top 4 most relevant chunks are retrieved as context.

5. **Answer Generation:**  
   The retrieved context, recent chat history, and your question are combined into a prompt. This is sent to the **OpenAI GPT-4o-mini** model, which generates a helpful, context-aware answer.

---

## Quick Start

### Backend

1. **Setup**
   ```sh
   cd server
   python -m venv venv
   venv\Scripts\activate  # On Windows
   pip install -r requirements.txt
   ```

2. **Configure**
   - Create a `.env` file in `server/`:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     PORT=8000
     HOST=0.0.0.0
     PDFS_DIRECTORY=pdfs
     ```

3. **Run**
   ```sh
   uvicorn main:app --reload
   ```

### Frontend

1. **Setup**
   ```sh
   cd client
   npm install
   ```

2. **Configure**
   - Create a `.env` file in `client/`:
     ```
     VITE_API_BASE_URL=http://localhost:8000
     ```

3. **Run**
   ```sh
   npm run dev
   ```

---

## Usage

- Open [http://localhost:3000](http://localhost:3000) (or use the [live demo](https://ai-planet-chat.onrender.com/)).
- Upload one or more PDF files.
- Ask questions about the content—get instant, AI-generated answers.
- Reset to clear all PDFs and chat history.

---

## Deployment

- **Live Demo:**  
  [https://ai-planet-chat.onrender.com/](https://ai-planet-chat.onrender.com/)

- **Self-Hosting:**  
  Deploy the backend (FastAPI) and frontend (React) on any cloud or server.  
  The backend supports serverless deployment (e.g., Vercel) and Docker.

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your branch
5. Create a Pull Request

---
