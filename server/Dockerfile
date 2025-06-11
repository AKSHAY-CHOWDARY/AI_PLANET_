# ---------- Build Stage ----------
    FROM python:3.11-slim AS builder

    # Set working directory
    WORKDIR /app
    
    # Install required system packages for building Python dependencies
    RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libffi-dev \
        libpq-dev \
        libssl-dev \
        python3-dev \
        cargo \
        && rm -rf /var/lib/apt/lists/*
    
    # Copy only the requirements file to leverage Docker cache
    COPY requirements.txt .
    
    # Create virtual environment
    RUN python -m venv /opt/venv
    
    # Ensure venv Python and pip are used
    ENV PATH="/opt/venv/bin:$PATH"
    
    # Install Python dependencies with preferred binary packages and default PyPI
    RUN pip install --no-cache-dir -qU -r requirements.txt
    
    # ---------- Final Stage ----------
    FROM python:3.11-slim
    
    # Set working directory
    WORKDIR /app
    
    # Install runtime dependencies (optional: cleanest slim image)
    RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        && rm -rf /var/lib/apt/lists/*
    
    # Copy virtual environment from builder stage
    COPY --from=builder /opt/venv /opt/venv
    
    # Use virtualenv path for all commands
    ENV PATH="/opt/venv/bin:$PATH"
    
    # Copy application code
    COPY . .
    
    # Create directory for PDFs (if used in your app)
    RUN mkdir -p pdfs
    
    # Expose the port your FastAPI app will run on
    EXPOSE 8000
    
    # Start the FastAPI application
    CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
    