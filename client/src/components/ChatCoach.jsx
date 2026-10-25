import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, MessageCircle, Sparkles } from 'lucide-react';
import { chatWithCoach } from '../services/backendService';
import { CoachMark } from './ui';
import ChatMessage from './ChatMessage';
const ChatCoach = ({
  user,
  planContext,
  messages,
  onUpdateMessages
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);
  const handleSend = async (value = input) => {
    if (!value.trim() || loading) return;
    const userMessage = {
      role: 'user',
      text: value.trim(),
      timestamp: Date.now()
    };
    const updated = [...messages, userMessage];
    onUpdateMessages(updated);
    setInput('');
    setLoading(true);
    try {
      const text = await chatWithCoach(userMessage.text, messages.map(message => ({
        role: message.role,
        text: message.text
      })), planContext);
      onUpdateMessages([...updated, {
        role: 'model',
        text,
        timestamp: Date.now()
      }]);
    } catch {
      onUpdateMessages([...updated, {
        role: 'model',
        text: 'I’m having trouble connecting. Please try your question again in a moment.',
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };
  return <div className="chat-shell">
  <header className="chat-header">
    <CoachMark />
    <div>
      <strong>Guruji</strong>
      <span>Quick questions about your plan</span>
    </div>
    <span className="chat-status"><span className="live-dot" /> AI ASSISTANT</span>
  </header>
  <div className="chat-messages" ref={scrollRef} role="log" aria-label="Conversation with Guruji" aria-live="polite">
    {messages.length < 2 && <div className="chat-welcome">
      <span className="chat-welcome-icon"><Sparkles size={26} /></span>
      <h2>A little clarity.<br /><span>A lot less guesswork.</span></h2>
      <p>A meal substitution, an exercise doubt, or a missed session.<br />Ask your quick follow-up here.</p>
    </div>}
    {messages.map((message, index) => <div key={index} className={`chat-message ${message.role === 'user' ? 'from-user' : 'from-coach'}`}>
      {message.role !== 'user' && <CoachMark />}
      <div className="message-content">
        <span className="message-author">{message.role === 'user' ? 'YOU' : 'GURUJI'}</span>
        <div className="message-bubble">{message.role === 'user' ? message.text : <ChatMessage text={message.text} />}</div>
      </div>
    </div>)}
    {loading && <div className="chat-message from-coach">
      <CoachMark />
      <div className="message-content">
        <span className="message-author">GURUJI</span>
        <div className="typing-indicator" role="status" aria-label="Guruji is replying">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>}
  </div>
  {messages.length < 3 && <div className="chat-suggestions">{['Can I swap an ingredient?', 'Explain my warm-up', 'I missed a workout. What now?'].map(suggestion => <button disabled={loading} key={suggestion} onClick={() => handleSend(suggestion)}>
      {suggestion}
      <MessageCircle size={14} />
    </button>)}</div>}
  <form className="chat-composer" onSubmit={event => {
      event.preventDefault();
      handleSend();
    }}>
    <label className="sr-only" htmlFor="coach-input">Message Guruji</label>
    <textarea id="coach-input" ref={inputRef} value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => {
        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
          event.preventDefault();
          handleSend();
        }
      }} placeholder="Ask about a meal, exercise, or your routine…" rows={2} />
    <button type="submit" disabled={loading || !input.trim()} aria-label="Send message"><ArrowUp size={20} /></button>
  </form>
  <p className="chat-disclaimer">A little guidance, whenever you need it. Shift + Enter for a new line.</p>
</div>;
};
export default ChatCoach;
