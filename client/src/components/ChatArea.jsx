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

export default function ChatArea({ messages, onSendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Update isListening state when listening state changes
  useEffect(() => {
    setIsListening(listening);
  }, [listening]);

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  const toggleListening = () => {
    if (isListening) {
      SpeechRecognition.stopListening();
      resetTranscript();
    } else {
      SpeechRecognition.startListening({ continuous: true });
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
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t bg-background p-4">
        <div className="flex gap-4 max-w-4xl mx-auto">
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
      </form>
    </div>
  );
} 