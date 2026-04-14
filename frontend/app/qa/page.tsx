'use client';
import { useState, useRef, useEffect } from 'react';
import { askQuestion, getQAHistory, QAResponse } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Send, Brain, BookOpen, MessageSquare, Sparkles,
  User, Bot, Clock, Star, ExternalLink, Lightbulb
} from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Message {
  type: 'user' | 'bot';
  content: string;
  sources?: QAResponse['sources'];
  timestamp: Date;
  chunks_used?: number;
}

const SUGGESTED_QUESTIONS = [
  'What are the best mystery books?',
  'Recommend me a romance novel',
  'Which books have the highest ratings?',
  'Tell me about books in the Science Fiction genre',
  'What books are suitable for children?',
  'Which author has written the most books?',
];

export default function QAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getQAHistory()
      .then((r) => setHistory(r.data))
      .catch(() => { });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return;

    const userMsg: Message = { type: 'user', content: question, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await askQuestion(question);
      const botMsg: Message = {
        type: 'bot',
        content: res.data.answer,
        sources: res.data.sources,
        chunks_used: res.data.chunks_used,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);

      // Refresh history
      getQAHistory().then((r) => setHistory(r.data)).catch(() => { });
    } catch (e: any) {
      const errorMsg = e?.response?.data?.error || 'Failed to get an answer. Make sure the backend is running.';
      setMessages((prev) => [...prev, {
        type: 'bot',
        content: `❌ ${errorMsg}`,
        timestamp: new Date(),
      }]);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="mb-8 fade-in">
        <div className="flex items-center gap-2 mb-2">
          <div className="pulse-dot" />
          <span className="text-xs" style={{ color: '#10b981' }}>RAG Pipeline Active</span>
        </div>
        <h1 className="text-4xl font-black gradient-text mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          AI Book Assistant
        </h1>
        <p style={{ color: '#94a3b8' }}>
          Ask anything about your book collection. Powered by RAG — Retrieval-Augmented Generation.
        </p>
      </div>

      <div className="flex gap-6 flex-1">
        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="glass-card flex-1 p-4 overflow-y-auto mb-4 fade-in"
            style={{ minHeight: 400, maxHeight: 500 }}>

            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(167,139,250,0.2))', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <Brain size={28} style={{ color: '#a78bfa' }} />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#f1f5f9' }}>Ready to Answer</h3>
                <p className="text-sm max-w-sm" style={{ color: '#64748b' }}>
                  Ask me anything about the books in your library. I'll search through the content using semantic similarity.
                </p>

                {/* Suggested questions */}
                <div className="mt-6 w-full max-w-lg">
                  <p className="text-xs mb-3 flex items-center gap-1 justify-center" style={{ color: '#475569' }}>
                    <Lightbulb size={12} /> Try asking:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button key={q} onClick={() => sendMessage(q)}
                        className="text-xs px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                        style={{ background: 'rgba(99,102,241,0.1)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.2)' }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.type === 'bot' && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
                        <Bot size={14} className="text-white" />
                      </div>
                    )}

                    <div className={`max-w-[80%] ${msg.type === 'user' ? 'order-first' : ''}`}>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed`}
                        style={{
                          background: msg.type === 'user'
                            ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                            : 'rgba(26,26,46,0.8)',
                          color: '#f1f5f9',
                          borderRadius: msg.type === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                          border: msg.type === 'bot' ? '1px solid rgba(99,102,241,0.15)' : 'none',
                        }}>
                        {msg.content}
                      </div>

                      {/* Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs flex items-center gap-1" style={{ color: '#475569' }}>
                            <BookOpen size={11} /> Sources used ({msg.chunks_used} chunks):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {msg.sources.map((src) => (
                              <Link key={src.id} href={`/books/${src.id}`}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all hover:scale-105"
                                style={{ background: 'rgba(26,26,46,0.9)', border: '1px solid rgba(99,102,241,0.2)', color: '#a78bfa' }}>
                                {src.cover_image_url && (
                                  <img src={src.cover_image_url} alt="" className="w-5 h-7 object-cover rounded"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                )}
                                <span className="max-w-[150px] truncate">{src.title}</span>
                                {src.rating && (
                                  <span className="flex items-center gap-0.5" style={{ color: '#fbbf24' }}>
                                    <Star size={9} fill="#fbbf24" />
                                    {src.rating.toFixed(1)}
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-xs mt-1" style={{ color: '#374151' }}>
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>

                    {msg.type === 'user' && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
                        <User size={14} style={{ color: '#a78bfa' }} />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
                      <Bot size={14} className="text-white" />
                    </div>
                    <div className="p-4 rounded-2xl flex items-center gap-2"
                      style={{ background: 'rgba(26,26,46,0.8)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '4px 18px 18px 18px' }}>
                      <LoadingSpinner size="sm" />
                      <span className="text-sm" style={{ color: '#64748b' }}>Searching knowledge base...</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="glass-card p-3 flex gap-3 fade-in">
            <div className="relative flex-1">
              <MessageSquare size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4f46e5' }} />
              <input
                type="text"
                placeholder="Ask anything about books in your library..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="input-dark pl-10"
                disabled={loading}
                style={{ border: 'none', background: 'transparent' }}
              />
            </div>
            <button type="submit" disabled={loading || !input.trim()} className="btn-primary flex items-center gap-2">
              {loading ? <LoadingSpinner size="sm" /> : <Send size={15} />}
              Ask
            </button>
          </form>
        </div>

        {/* Sidebar: History */}
        <div className="w-72 hidden lg:flex flex-col gap-4 fade-in">
          <div className="glass-card p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#94a3b8' }}>
              <Clock size={14} /> Recent Questions
            </h3>
            {history.length === 0 ? (
              <p className="text-xs" style={{ color: '#374151' }}>No questions yet</p>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 8).map((h: any) => (
                  <button key={h.id} onClick={() => sendMessage(h.question)}
                    className="w-full text-left text-xs p-2 rounded-lg transition-all hover:bg-indigo-500/10"
                    style={{ color: '#94a3b8', border: '1px solid transparent' }}>
                    <p className="truncate">{h.question}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#374151' }}>
                      {new Date(h.created_at).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="glass-card p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#94a3b8' }}>
              <Sparkles size={14} /> How It Works
            </h3>
            <div className="space-y-3 text-xs" style={{ color: '#64748b' }}>
              {[
                ['🔍', 'Your question is embedded using sentence-transformers'],
                ['📊', 'ChromaDB searches for semantically similar book chunks'],
                ['📖', 'Relevant context is retrieved and compiled'],
                ['🤖', 'LLM generates a contextual answer with citations'],
              ].map(([emoji, text]) => (
                <div key={text} className="flex gap-2">
                  <span>{emoji}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
