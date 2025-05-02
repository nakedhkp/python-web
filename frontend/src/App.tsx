import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import './App.css';

// WebSocket连接URL
// 使用ws://localhost:8000/ws连接后端服务
const WS_URL = 'ws://localhost:8000/ws';
// 使用http://localhost:8000连接后端服务
const API_URL = 'http://localhost:8000';
// 组件定义和状态
const App: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [noteId, setNoteId] = useState<string>('');
  const [ws, setWs] = useState<WebSocket | null>(null); // 定义WebSocket连接 管理与后端的实时连接
  const [isConnected, setIsConnected] = useState<boolean>(false); 
  const [error, setError] = useState<string | null>(null); 
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // 获取笔记内容
  const fetchNoteContent = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/notes/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setContent(data.content || '');
      setError(null);
    } catch (e) {
      console.error('获取笔记内容失败:', e);
      setError('无法连接到服务器，请确保后端服务正在运行');
    }
  };

  // 初始化WebSocket连接
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('noteId') || Math.random().toString(36).substring(7);
    setNoteId(id);

    // 获取初始笔记内容
    fetchNoteContent(id);

    // 建立WebSocket连接
    const websocket = new WebSocket(`${WS_URL}/${id}`);
    
    websocket.onopen = () => {
      console.log('WebSocket连接已建立');
      setIsConnected(true);
      setError(null);
    };

    websocket.onclose = () => {
      console.log('WebSocket连接已关闭');
      setIsConnected(false);
      // 尝试重新连接
      setTimeout(() => {
        console.log('尝试重新连接...');
        setWs(new WebSocket(`${WS_URL}/${id}`));
      }, 3000);
    };

    websocket.onerror = (event) => {
      console.error('WebSocket错误:', event);
      setError('WebSocket连接错误，请检查后端服务是否运行');
    };

    websocket.onmessage = (event) => {
      console.log('收到更新:', event.data);
      setContent(event.data);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  // 处理内容更新
  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(value);
    }
  }, [ws]);

  // 切换主题
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // 切换全屏模式
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 复制笔记链接
  const copyNoteLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?noteId=${noteId}`;
    navigator.clipboard.writeText(link);
    // 可以添加一个Toast提示
    alert('笔记链接已复制到剪贴板');
  };

  return (
    <div className={`App ${isDarkMode ? 'dark-mode' : ''} ${isFullscreen ? 'fullscreen' : ''}`}>
      <header className="App-header">
        <div className="header-content">
          <h1>协作Markdown笔记</h1>
          <div className="header-actions">
            <button onClick={toggleTheme} className="theme-toggle">
              {isDarkMode ? '🌞' : '🌙'}
            </button>
            <button onClick={toggleFullscreen} className="fullscreen-toggle">
              {isFullscreen ? '⤢' : '⤡'}
            </button>
            <button onClick={copyNoteLink} className="share-button">
              分享笔记
            </button>
          </div>
        </div>
        <div className="status-bar">
          <p>笔记ID: {noteId}</p>
          <p className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            状态: {isConnected ? '已连接' : '未连接'}
          </p>
          {error && <p className="error-message">{error}</p>}
        </div>
      </header>
      <div className="editor-container">
        <div className="editor">
          <SimpleMDE
            value={content}
            onChange={handleContentChange}
            options={{
              spellChecker: false,
              placeholder: '开始编辑...',
              autofocus: true,
              toolbar: [
                'bold', 'italic', 'heading', '|',
                'quote', 'unordered-list', 'ordered-list', '|',
                'link', 'image', '|',
                'preview', 'side-by-side', 'fullscreen', '|',
                'guide'
              ]
            }}
          />
        </div>
        <div className="preview">
          <ReactMarkdown
            components={{
              code({node, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <pre className={className}>
                    <code className={className}>
                      {String(children).replace(/\n$/, '')}
                    </code>
                  </pre>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default App;
