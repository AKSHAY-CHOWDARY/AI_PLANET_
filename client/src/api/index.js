const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ai-planet-qbtv.onrender.com';

export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return {
      status: data.status || 'unhealthy',
      error: data.error,
      service: data.service,
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      status: 'unhealthy',
      error: error.message,
      service: 'RAG PDF Chat API',
    };
  }
};

export const getStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/status`);
    const data = await response.json();
    return {
      status: data.status || 'offline',
      rag_agent_ready: Boolean(data.rag_agent_ready),
      documents_loaded: Number(data.documents_loaded) || 0,
      pdfs_directory: data.pdfs_directory || '',
    };
  } catch (error) {
    console.error('Status check failed:', error);
    return {
      status: 'offline',
      rag_agent_ready: false,
      documents_loaded: 0,
      pdfs_directory: '',
    };
  }
};

export const uploadPDF = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload-pdf`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload PDF');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

export const sendChatMessage = async (message) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send message');
    }

    return await response.json();
  } catch (error) {
    console.error('Chat failed:', error);
    throw error;
  }
};

export const resetSystem = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/reset`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to reset system');
    }

    return await response.json();
  } catch (error) {
    console.error('Reset failed:', error);
    throw error;
  }
};
