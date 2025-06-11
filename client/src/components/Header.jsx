import { Moon, Sun, Upload, Trash2, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getStatus } from '../api';

export default function Header({ theme, onThemeToggle, onUploadClick, onResetClick }) {
  const [status, setStatus] = useState({
    serverStatus: 'Checking...',
    ragAgentStatus: false,
    documentsLoaded: 0,
    pdfsDirectory: '',
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await getStatus();
        setStatus({
          serverStatus: result.status === 'running' ? 'Online' : 'Offline',
          ragAgentStatus: result.rag_agent_ready,
          documentsLoaded: result.documents_loaded || 0,
          pdfsDirectory: result.pdfs_directory || '',
        });
      } catch (error) {
        console.error('Error checking status:', error);
        setStatus(prev => ({
          ...prev,
          serverStatus: 'Offline',
          ragAgentStatus: false,
        }));
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Status - Always visible */}
          <div className="flex items-center gap-4">
            <img src='../public/logo.png' alt='logo' className='px-2 py-1 bg-white w-30 h-50'></img>
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${status.serverStatus === 'Online' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{status.serverStatus}</span>
              <span>•</span>
              <span className={`h-2 w-2 rounded-full ${status.ragAgentStatus ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>RAG Agent {status.ragAgentStatus ? 'Ready' : 'Not Ready'}</span>
              <span>•</span>
              <span>{status.documentsLoaded} documents loaded</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onUploadClick}
              className="hidden gap-2 md:inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              <Upload className="h-4 w-4" /> Upload PDF
            </button>
            <button
              onClick={onResetClick}
              className=" gap-2 hidden md:inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2"
            >
              <Trash2 className="h-4 w-4" /> Reset
            </button>
            <button
              onClick={onThemeToggle}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} py-4 border-t`}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${status.serverStatus === 'Online' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{status.serverStatus}</span>
              <span>•</span>
              <span className={`h-2 w-2 rounded-full ${status.ragAgentStatus ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>RAG Agent {status.ragAgentStatus ? 'Ready' : 'Not Ready'}</span>
              <span>•</span>
              <span>{status.documentsLoaded} documents loaded</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  onUploadClick();
                  setIsMobileMenuOpen(false);
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload PDF
              </button>
              <button
                onClick={() => {
                  onResetClick();
                  setIsMobileMenuOpen(false);
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 