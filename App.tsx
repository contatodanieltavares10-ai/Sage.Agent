
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import KeywordResearch from './components/KeywordResearch';
import { AppView, Conversation, ChatMessage, Attachment } from './types';
import { getSEOChatResponse } from './services/geminiService';

const STORAGE_KEY = 'sage_conversations';

interface Notification {
  id: string;
  title: string;
  chatId: string;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Conversation[] = JSON.parse(saved);
        // Reseta estados temporários ao carregar
        setConversations(parsed.map(c => ({ ...c, isTyping: false })));
      } catch (e) {
        console.error("Erro ao carregar conversas salvas", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.map(c => ({
      ...c,
      isTyping: false // Não persiste o estado de carregamento
    }))));
  }, [conversations]);

  const handleNewChat = () => {
    const newChat: Conversation = {
      id: Date.now().toString(),
      title: 'Conversa ' + (conversations.length + 1),
      messages: [],
      createdAt: Date.now(),
      draftInput: '',
      draftAttachments: [],
      isTyping: false
    };
    setConversations(prev => [newChat, ...prev]);
    setActiveConversationId(newChat.id);
    setCurrentView('chat');
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setCurrentView('chat');
    // Remove notificações deste chat ao entrar nele
    setNotifications(prev => prev.filter(n => n.chatId !== id));
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setCurrentView('dashboard');
    }
  };

  const updateDraft = (id: string, draftInput: string, draftAttachments: Attachment[]) => {
    setConversations(prev => prev.map(conv => 
      conv.id === id ? { ...conv, draftInput, draftAttachments } : conv
    ));
  };

  const handleSendMessage = async (id: string, content: string, attachments: Attachment[]) => {
    // 1. Atualiza UI local do chat (adiciona mensagem do usuário e limpa rascunho)
    setConversations(prev => prev.map(conv => {
      if (conv.id === id) {
        const userMessage: ChatMessage = { role: 'user', content, attachments };
        const newMessages = [...conv.messages, userMessage];
        let newTitle = conv.title;
        if (conv.messages.length === 0) {
          newTitle = content.length > 20 ? content.substring(0, 17) + '...' : content;
        }
        return { 
          ...conv, 
          messages: newMessages, 
          title: newTitle, 
          isTyping: true, 
          draftInput: '', 
          draftAttachments: [] 
        };
      }
      return conv;
    }));

    // 2. Busca resposta em background
    try {
      const conv = conversations.find(c => c.id === id);
      const userMessage: ChatMessage = { role: 'user', content, attachments };
      const history = conv ? [...conv.messages, userMessage] : [userMessage];
      
      const response = await getSEOChatResponse(history);
      
      setConversations(prev => prev.map(c => {
        if (c.id === id) {
          const aiMessage: ChatMessage = { role: 'model', content: response || "Sem resposta." };
          return { ...c, messages: [...c.messages, aiMessage], isTyping: false };
        }
        return c;
      }));

      // 3. Notificação se não estiver no chat ativo
      if (activeConversationId !== id) {
        const targetConv = conversations.find(c => c.id === id);
        setNotifications(prev => [...prev, {
          id: Date.now().toString(),
          title: `Resposta pronta em "${targetConv?.title || 'Chat'}"`,
          chatId: id
        }]);
      }
    } catch (err) {
      console.error(err);
      setConversations(prev => prev.map(c => 
        c.id === id ? { 
          ...c, 
          messages: [...c.messages, { role: 'model', content: "Erro na conexão com o Sage." }], 
          isTyping: false 
        } : c
      ));
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            conversations={conversations} 
            onNewChat={handleNewChat} 
            onKeywordResearch={() => setCurrentView('keywords')}
            onSelectChat={handleSelectConversation}
          />
        );
      case 'chat':
        return activeConversation ? (
          <ChatInterface 
            conversation={activeConversation} 
            onUpdateConversation={(messages) => setConversations(prev => prev.map(c => c.id === activeConversation.id ? { ...c, messages } : c))}
            onDraftUpdate={updateDraft}
            onSend={handleSendMessage}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
            <p>Selecione uma conversa ou inicie uma nova.</p>
            <button onClick={handleNewChat} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700">Novo Chat</button>
          </div>
        );
      case 'keywords':
        return <KeywordResearch />;
      default:
        return null;
    }
  };

  const getBreadcrumbLabel = (view: string) => {
    switch(view) {
      case 'dashboard': return 'Início';
      case 'chat': return 'Consultor';
      case 'keywords': return 'Keywords';
      default: return view;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 min-h-screen flex flex-col transition-all duration-300 lg:pl-72 w-full max-w-full relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-4 md:px-8 sticky top-0 z-40">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:text-indigo-600 transition-colors mr-2"
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <i className="fas fa-home hidden md:inline"></i>
            <span className="hidden md:inline">/</span>
            <span className="text-slate-600">{getBreadcrumbLabel(currentView)}</span>
          </div>
        </header>

        {/* Notificações */}
        <div className="fixed top-20 right-8 z-50 flex flex-col gap-3 pointer-events-none">
          {notifications.map(n => (
            <div 
              key={n.id} 
              onClick={() => handleSelectConversation(n.chatId)}
              className="pointer-events-auto bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-slideIn cursor-pointer hover:bg-emerald-100 transition-all border-l-4 border-l-emerald-500"
            >
              <i className="fas fa-check-circle text-emerald-500"></i>
              <span className="font-semibold text-sm">{n.title}</span>
              <button onClick={(e) => { e.stopPropagation(); setNotifications(prev => prev.filter(notif => notif.id !== n.id)); }} className="ml-2 opacity-50 hover:opacity-100">
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 md:p-8 flex-1 overflow-x-hidden">
          {renderContent()}
        </div>

        {currentView !== 'chat' && (
          <footer className="p-4 md:p-6 border-t border-slate-100 bg-white/50 text-slate-400 text-[10px] flex flex-col md:flex-row justify-between items-center gap-4 px-8 md:px-12">
            <p className="text-center md:text-left">© 2024 Sage AI • Suas conversas estão salvas localmente.</p>
            <div className="flex gap-4 font-medium">
              <a href="#" className="hover:text-indigo-600">Documentação</a>
              <a href="#" className="hover:text-indigo-600">Privacidade</a>
            </div>
          </footer>
        )}
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-slideIn {
          animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
