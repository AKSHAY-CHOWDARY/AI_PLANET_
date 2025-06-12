import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Mic, MicOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

// Typing animation component
const TypingIndicator = () => {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <img src='/ai_planet_icon.png' alt='logo' className='rounded-full bg-white w-30 h-50'></img>
      </div>
      <div className="max-w-[80%] md:max-w-[70%] rounded-lg p-4 bg-muted">
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

const ProcessingIndicator = () => {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <img src='/ai_planet_icon.png' alt='logo' className='rounded-full bg-white w-30 h-50'></img>
      </div>
      <div className="max-w-[80%] md:max-w-[70%] rounded-lg p-4 bg-muted">
        <div className="flex items-center space-x-3">
          <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-muted-foreground">Processing document...</span>
        </div>
      </div>
    </div>
  );
};

export default function ChatArea({ messages, onSendMessage, isLoading, isUploading }) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  // Log initial state
  useEffect(() => {
    console.log('Speech Recognition Support:', browserSupportsSpeechRecognition);
    console.log('Microphone Available:', isMicrophoneAvailable);
    console.log('Is Secure Context:', window.isSecureContext);
    setDebugInfo(`Browser Support: ${browserSupportsSpeechRecognition ? 'Yes' : 'No'}, 
                  Mic Available: ${isMicrophoneAvailable ? 'Yes' : 'No'}, 
                  Secure Context: ${window.isSecureContext ? 'Yes' : 'No'}`);
  }, [browserSupportsSpeechRecognition, isMicrophoneAvailable]);

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      console.log('Transcript received:', transcript);
      setInput(transcript);
    }
  }, [transcript]);

  // Update isListening state when listening state changes
  useEffect(() => {
    console.log('Listening state changed:', listening);
    setIsListening(listening);
  }, [listening]);

  const toggleListening = async () => {
    console.log('Toggle listening clicked');
    setMicError('');
    
    try {
      // Check for HTTPS
      if (!window.isSecureContext) {
        const error = 'Speech recognition requires a secure (HTTPS) connection.';
        console.error(error);
        setMicError(error);
        return;
      }

      // Check browser support
      if (!browserSupportsSpeechRecognition) {
        const error = 'Your browser does not support speech recognition. Please use Chrome.';
        console.error(error);
        setMicError(error);
        return;
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const error = 'Your browser does not support accessing the microphone.';
        console.error(error);
        setMicError(error);
        return;
      }

      console.log('Requesting microphone permission...');
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted:', stream.active);
      
      if (isListening) {
        console.log('Stopping speech recognition');
        SpeechRecognition.stopListening();
        resetTranscript();
      } else {
        console.log('Starting speech recognition');
        await SpeechRecognition.startListening({ continuous: true });
      }
    } catch (error) {
      console.error('Microphone error:', error);
      setMicError(`Microphone error: ${error.message || 'Please allow microphone access to use voice input.'}`);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
      if (isListening) {
        SpeechRecognition.stopListening();
        resetTranscript();
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Debug info at the top */}
        <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
          {debugInfo}
        </div>
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-4 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <img src='/ai_planet_icon.png' alt='logo' className='rounded-full bg-white w-30 h-50'></img>
              </div>
            )}
            <div
              className={`max-w-[80%] md:max-w-[70%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-muted'
              }`}
            >
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
              <div className="text-xs mt-2 opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}
        {isUploading && <ProcessingIndicator />}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t bg-background p-4">
        <div className="flex flex-col gap-2 max-w-4xl mx-auto">
          {micError && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
              {micError}
            </div>
          )}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message or click the mic to speak..."
                disabled={isLoading}
                className="w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-20"
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors ${
                  isListening
                    ? 'text-destructive hover:bg-destructive/10'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 