import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import "./App.css";

// FIXED: Better API URL handling with fallback
const API_URL = import.meta.env.VITE_REACT_APP_FASTAPI_URL || "http://localhost:8000";
console.log("🔧 API URL:", API_URL); // Debug log

const USER_ID_KEY = "chat_user_id";
const SESSIONS_KEY = "chat_sessions";
const CONVS_KEY = "chat_conversations";

export default function App() {
  const [userId, setUserId] = useState(null);
  const [sessions, setSessions] = useState([]);   
  const [activeSession, setActiveSession] = useState(null);
  const [conversations, setConversations] = useState({}); 
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ensuring, setEnsuring] = useState(false);
  const [apiStatus, setApiStatus] = useState("checking"); // NEW: Track API connectivity
  const messagesEndRef = useRef(null);
  const hasInitialized = useRef(false); // FIXED: Prevent double initialization

  const THINKING_PREFIX = "Thinking";

  // helpers to read or save localStorage 
  function loadLocalState() {
    const uid = localStorage.getItem(USER_ID_KEY) || null;
    const savedSessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]");
    const savedConvs = JSON.parse(localStorage.getItem(CONVS_KEY) || "{}");
    return { uid, savedSessions, savedConvs };
  }
  function saveSessionsToLocal(sessions) {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
  function saveConversationsToLocal(convs) {
    localStorage.setItem(CONVS_KEY, JSON.stringify(convs));
  }

  // NEW: Check if API is reachable
  async function checkApiConnection() {
    try {
      console.log("🔍 Testing API connection to:", API_URL);
      const response = await axios.get(`${API_URL}/debug/db-test`, { timeout: 5000 });
      console.log("✅ API is reachable:", response.data);
      setApiStatus("connected");
      return true;
    } catch (error) {
      console.error("❌ API connection failed:", error.message);
      if (error.code === 'ECONNREFUSED') {
        console.error("💡 Make sure FastAPI server is running on", API_URL);
      }
      setApiStatus("disconnected");
      return false;
    }
  }

  useEffect(() => {
    // FIXED: Prevent double initialization in strict mode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    (async () => {
      // First check if API is reachable
      const apiReachable = await checkApiConnection();
      
      if (!apiReachable) {
        console.warn("⚠️ Proceeding with cached data only - API unavailable");
      }

      // user id
      let uid = localStorage.getItem(USER_ID_KEY);
      if (!uid) {
        uid = uuidv4();
        localStorage.setItem(USER_ID_KEY, uid);
      }
      setUserId(uid);

      // load sessions + conversations from localStorage
      const { savedSessions, savedConvs } = loadLocalState();
      setConversations(savedConvs || {});
      
      if (savedSessions && savedSessions.length > 0) {
        setSessions(savedSessions);
        const first = savedSessions[0];
        
        if (apiReachable) {
          await ensureAndLoad(uid, first, { selectAfterLoad: true, showCachedFirst: true });
        } else {
          // Just show cached data without API call
          setActiveSession(first);
        }
      } else {
        // no sessions stored then create first session
        const sid = `session_${Date.now()}`;
        setSessions([sid]);
        setConversations((p) => ({ ...p, [sid]: [] }));
        saveSessionsToLocal([sid]);
        saveConversationsToLocal({ [sid]: [] });
        
        if (apiReachable) {
          await ensureAndLoad(uid, sid, { selectAfterLoad: true, showCachedFirst: false });
        } else {
          setActiveSession(sid);
        }
      }
    })();
  }, []); // Empty dependency array is correct

  // scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeSession, loading]);

  // server/session helpers
  async function ensureSessionOnServer(uid, sessionId) {
    setEnsuring(true);
    try {
      console.log("📡 Ensuring session:", { uid, sessionId, url: `${API_URL}/sessions/ensure` });
      const response = await axios.post(`${API_URL}/sessions/ensure`, {
        user_id: uid,
        session_id: sessionId,
      }, { timeout: 10000 });
      console.log("✅ Session ensured:", response.data);
      return true;
    } catch (err) {
      console.error("❌ ensureSession error:", {
        message: err.message,
        response: err?.response?.data,
        status: err?.response?.status,
        code: err.code
      });
      return false;
    } finally {
      setEnsuring(false);
    }
  }

  async function fetchHistoryFromServer(uid, sessionId) {
    try {
      const url = `${API_URL}/history/${encodeURIComponent(uid)}/${encodeURIComponent(sessionId)}`;
      console.log("📡 Fetching history from:", url);
      const res = await axios.get(url, { timeout: 10000 });
      console.log("✅ History received:", res.data);
      const msgs = Array.isArray(res.data.messages) ? res.data.messages : [];
      return msgs;
    } catch (err) {
      console.error("❌ fetchHistory error:", {
        message: err.message,
        response: err?.response?.data,
        status: err?.response?.status
      });
      return null;
    }
  }

  async function ensureAndLoad(uid, sessionId, opts = { selectAfterLoad: true, showCachedFirst: true }) {
    if (opts.showCachedFirst) {
      setActiveSession(sessionId);
    }

    await ensureSessionOnServer(uid, sessionId);
    const serverMsgs = await fetchHistoryFromServer(uid, sessionId);

    setConversations((prev) => {
      const cached = Array.isArray(prev[sessionId]) ? prev[sessionId] : [];
      let finalMsgs;
      if (Array.isArray(serverMsgs)) {
        finalMsgs = serverMsgs.length > 0 ? serverMsgs : cached;
      } else {
        finalMsgs = cached;
      }
      const next = { ...prev, [sessionId]: finalMsgs };
      saveConversationsToLocal(next);
      return next;
    });

    if (opts.selectAfterLoad) {
      setActiveSession(sessionId);
    }
  }

  async function createAndSelectSession(uid, sessionId) {
    setSessions((prev) => {
      if (prev.includes(sessionId)) return prev;
      const next = [sessionId, ...prev];
      saveSessionsToLocal(next);
      return next;
    });

    setConversations((prev) => {
      const next = { ...prev };
      if (!next[sessionId]) next[sessionId] = [];
      saveConversationsToLocal(next);
      return next;
    });

    if (apiStatus === "connected") {
      await ensureAndLoad(uid, sessionId, { selectAfterLoad: true, showCachedFirst: true });
    } else {
      setActiveSession(sessionId);
    }
  }

  async function handleSelectSession(sessionId) {
    await ensureAndLoad(userId, sessionId, { selectAfterLoad: true, showCachedFirst: true });
  }

  async function handleNewChat() {
    const newId = `session_${Date.now()}`;
    await createAndSelectSession(userId, newId);
  }

  function handleDeleteSession(id) {
    setSessions((prev) => {
      const next = prev.filter((s) => s !== id);
      saveSessionsToLocal(next);
      return next;
    });
    setConversations((prev) => {
      const copy = { ...prev };
      delete copy[id];
      saveConversationsToLocal(copy);
      return copy;
    });
    if (activeSession === id) {
      const remaining = sessions.filter((s) => s !== id);
      const newActive = remaining.length ? remaining[0] : null;
      setActiveSession(newActive);
    }
  }

  async function handleSend(e) {
    e?.preventDefault();
    if (!input.trim() || !activeSession) return;

    // Check API status before sending
    if (apiStatus === "disconnected") {
      alert("⚠️ Cannot send message: API server is not reachable. Please start the FastAPI server.");
      return;
    }

    const userMsg = { sender: "user", text: input };

    setConversations((prev) => {
      const prevMsgs = prev[activeSession] || [];
      const next = { ...prev, [activeSession]: [...prevMsgs, userMsg] };
      saveConversationsToLocal(next);
      return next;
    });

    const thinkingId = `${THINKING_PREFIX}${Date.now()}`;
    setConversations((prev) => {
      const prevMsgs = prev[activeSession] || [];
      const thinkingMsg = { sender: "bot", text: "", temp: true, tempId: thinkingId };
      const next = { ...prev, [activeSession]: [...prevMsgs, thinkingMsg] };
      saveConversationsToLocal(next);
      return next;
    });

    const payload = {
      user_query: input,
      user_id: userId,
      session_id: activeSession,
    };

    setInput("");
    setLoading(true);

    try {
      console.log("📡 Sending chat request:", { url: `${API_URL}/chat`, payload });
      
      await ensureSessionOnServer(userId, activeSession);

      const res = await axios.post(`${API_URL}/chat`, payload, { 
        timeout: 120000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log("✅ Chat response received:", res.data);

      const botText = (res.data && (res.data.response || res.data.result || res.data.answer)) || "No response";
      const aiMsg = { sender: "bot", text: botText };

      setConversations((prev) => {
        const prevMessages = prev[activeSession] || [];
        let replaced = false;
        const newMessages = prevMessages.map((m) => {
          if (m.temp && m.tempId === thinkingId) {
            replaced = true;
            return aiMsg;
          }
          return m;
        });
        if (!replaced) newMessages.push(aiMsg);
        const next = { ...prev, [activeSession]: newMessages };
        saveConversationsToLocal(next);
        return next;
      });
    } catch (err) {
      console.error("❌ chat error:", {
        message: err.message,
        response: err?.response?.data,
        status: err?.response?.status,
        code: err.code
      });
      
      let errorText = "Sorry — I couldn't process that. ";
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        errorText += "The server appears to be offline.";
        setApiStatus("disconnected");
      } else if (err.response?.status === 404) {
        errorText += "Endpoint not found (404). Check API URL.";
      } else if (err.response?.status === 500) {
        errorText += "Server error (500). Check FastAPI logs.";
      } else {
        errorText += "Try again.";
      }
      
      const errMsg = { sender: "bot", text: errorText };

      setConversations((prev) => {
        const prevMessages = prev[activeSession] || [];
        let replaced = false;
        const newMessages = prevMessages.map((m) => {
          if (m.temp && m.tempId === thinkingId) {
            replaced = true;
            return errMsg;
          }
          return m;
        });
        if (!replaced) newMessages.push(errMsg);
        const next = { ...prev, [activeSession]: newMessages };
        saveConversationsToLocal(next);
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  const activeMessages = conversations[activeSession] || [];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>Sessions</h3>
          <button className="new-btn" onClick={handleNewChat} disabled={ensuring}>+ New</button>
        </div>

        {/* NEW: API Status indicator */}
        <div style={{ 
          padding: "8px 16px", 
          background: apiStatus === "connected" ? "#d4edda" : "#f8d7da",
          color: apiStatus === "connected" ? "#155724" : "#721c24",
          fontSize: "12px",
          borderRadius: "4px",
          margin: "8px"
        }}>
          API: {apiStatus === "connected" ? "✅ Connected" : "❌ Disconnected"}
        </div>

        <div className="session-list">
          {sessions.length === 0 && <div className="empty-note">No sessions yet</div>}
          {sessions.map((sid) => (
            <div
              key={sid}
              className={`session-item ${sid === activeSession ? "active" : ""}`}
              onClick={() => handleSelectSession(sid)}
            >
              <div className="session-title">{sid}</div>
              <div className="session-actions">
                <button
                  className="small"
                  onClick={(e) => { e.stopPropagation(); handleDeleteSession(sid); }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-id">User: {userId?.slice(0, 8)}...</div>
        </div>
      </aside>

      <main className="chat-panel">
        <div className="chat-header">
          <h2>{activeSession ? `Session: ${activeSession}` : "No session selected"}</h2>
          {loading && <div className="loading-indicator">Thinking…</div>}
        </div>

        <div className="messages">
          {(!activeMessages || activeMessages.length === 0) && !loading && (
            <div className="empty-chat">Start the conversation — say hi 👋</div>
          )}

          {activeMessages.map((m, i) => (
            <div key={i} className={`message-row ${m.sender === "user" ? "user" : "bot"}`}>
              <div
                className={
                  m.temp
                    ? `bubble thinking-bubble`
                    : `bubble ${m.sender === "user" ? "user-bubble" : "bot-bubble"}`
                }
              >
                {m.temp ? (
                  <span className="thinking-dots" aria-hidden>
                    <span className="dot d1" />
                    <span className="dot d2" />
                    <span className="dot d3" />
                  </span>
                ) : (
                  m.text
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="composer" onSubmit={handleSend}>
          <input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!activeSession || loading}
          />
          <button type="submit" disabled={!input.trim() || loading}>Send</button>
        </form>
      </main>
    </div>
  );
}