import { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatArea from './components/ChatArea';
import UploadModal from './components/UploadModal';
import { checkHealth, getStatus, uploadPDF, sendChatMessage, resetSystem } from './api';
import './index.css';

function App() {
  
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  });

  const [systemStatus, setSystemStatus] = useState({
    serverStatus: 'Checking...',
    ragAgentStatus: false,
    documentsLoaded: 0,
    pdfsDirectory: '',
  });

  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    isChecking: true,
    error: null,
    lastChecked: null,
  });

  const [isServerWakingUp, setIsServerWakingUp] = useState(false);

  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        return parsedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch (error) {
        console.error('Error parsing saved messages:', error);
        return [{
          role: 'assistant',
          content: "Welcome! I'm checking the connection to the backend server...",
          timestamp: new Date(),
        }];
      }
    }
    return [{
      role: 'assistant',
      content: "Welcome! I'm checking the connection to the backend server...",
      timestamp: new Date(),
    }];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const checkSystemStatus = async () => {
    setConnectionStatus((prev) => ({ ...prev, isChecking: true }));

    const wakeUpTimer = setTimeout(() => {
      setConnectionStatus(prev => {
        if(prev.isChecking) {
          setIsServerWakingUp(true);
        }
        return prev;
      });
    }, 3000);

    try {
      const health = await checkHealth();
      const isHealthy = health.status === 'healthy';

      const status = await getStatus();
      const isOnline = status.status === 'running';

      if (isHealthy && isOnline) {
        setIsServerWakingUp(false);
      }

      setConnectionStatus({
        isConnected: isHealthy && isOnline,
        isChecking: false,
        error: isHealthy ? null : health.error,
        lastChecked: new Date(),
      });

      setSystemStatus({
        serverStatus: isHealthy && isOnline ? 'Online' : 'Offline',
        ragAgentStatus: isHealthy && isOnline && status.rag_agent_ready,
        documentsLoaded: status.documents_loaded || 0,
        pdfsDirectory: status.pdfs_directory || '',
      });

      if (messages.length === 1 && messages[0].content.includes("checking the connection")) {
        if (isHealthy && isOnline) {
          setMessages([
            {
              role: 'assistant',
              content: '✨ Welcome to RAG PDF Chat! Upload your PDF documents and start asking questions about their content.',
              timestamp: new Date(),
            },
          ]);
        } else {
          setMessages([
            {
              role: 'assistant',
              content: `🔌 Unable to connect to the backend server. Please make sure the server is running at http://localhost:8000\n\n**Error:** ${health.error || 'Server is not responding'}`,
              timestamp: new Date(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Error checking system status:', error);
      setConnectionStatus({
        isConnected: false,
        isChecking: false,
        error: error.message,
        lastChecked: new Date(),
      });

      setSystemStatus({
        serverStatus: 'Offline',
        ragAgentStatus: false,
        documentsLoaded: 0,
        pdfsDirectory: '',
      });

      if (messages.length === 1 && messages[0].content.includes("checking the connection")) {
        setMessages([
          {
            role: 'assistant',
            content: `🔌 Unable to connect to the backend server. Please make sure the server is running at http://localhost:8000\n\n**Error:** ${error.message}`,
            timestamp: new Date(),
          },
        ]);
      }
    } finally {
      clearTimeout(wakeUpTimer);
    }
  };

  useEffect(() => {
    checkSystemStatus();
    const intervalId = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleFileUpload = async (file) => {
    if (!connectionStatus.isConnected) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Cannot upload: Backend server is not connected',
          timestamp: new Date(),
        },
      ]);
      return;
    }

    setIsUploading(true);
    setShowUploadModal(false);

    try {
      const result = await uploadPDF(file);
      if (result.status === 'success') {
        const status = await getStatus();
        setSystemStatus((prev) => ({
          ...prev,
          documentsLoaded: status.documents_loaded,
        }));

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `🎉 Successfully processed "${result.filename}"! You can now ask questions about its content.`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ Upload failed: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    if (!connectionStatus.isConnected) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: message, timestamp: new Date() },
        {
          role: 'assistant',
          content:
            '🔌 Cannot send message: Backend server is not connected. Please check the connection and try again.',
          timestamp: new Date(),
        },
      ]);
      return;
    }

    setMessages((prev) => [...prev, { role: 'user', content: message, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const health = await checkHealth();
      const status = await getStatus();
      
      if (health.status !== 'healthy' || status.status !== 'running') {
        throw new Error('Server is not responding properly');
      }

      const response = await sendChatMessage(message);
      if (response.status === 'success') {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: response.response, timestamp: new Date() },
        ]);
      } else {
        throw new Error(response.error || 'Failed to get response from server');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ **Error:** ${error.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSystem = async () => {
    if (!connectionStatus.isConnected) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '🔌 Cannot reset system: Backend server is not connected.',
          timestamp: new Date(),
        },
      ]);
      return;
    }

    try {
      const health = await checkHealth();
      const status = await getStatus();
      
      if (health.status !== 'healthy' || status.status !== 'running') {
        throw new Error('Server is not responding properly');
      }

      const result = await resetSystem();
      if (result.status === 'success') {
        setMessages([
          {
            role: 'assistant',
            content: '🔄 All documents and chat history have been reset. Please upload new documents to continue.',
            timestamp: new Date(),
          },
        ]);

        const status = await getStatus();
        setSystemStatus((prev) => ({
          ...prev,
          documentsLoaded: status.documents_loaded,
        }));
      }
    } catch (error) {
      console.error('Error resetting system:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ Reset failed: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        theme={theme}
        onThemeToggle={toggleTheme}
        onUploadClick={() => setShowUploadModal(true)}
        onResetClick={handleResetSystem}
        systemStatus={systemStatus}
        isServerWakingUp={isServerWakingUp}
      />
      <ChatArea
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isUploading={isUploading}
      />
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleFileUpload}
      />
    </div>
  );
}

export default App; 