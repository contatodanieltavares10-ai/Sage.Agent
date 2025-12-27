
import React from 'react';
import { AppView, Conversation } from '../types';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  conversations, 
  activeConversationId, 
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isOpen,
  onClose
}) => {
  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`w-72 bg-slate-900 h-screen text-white flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-leaf text-xl"></i>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Sage</h1>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <nav className="flex-1 mt-6 px-4 space-y-8 overflow-y-auto custom-scrollbar">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4 px-2">Menu Principal</p>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => { onViewChange('dashboard'); onClose?.(); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    currentView === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <i className="fas fa-house w-5 text-center"></i>
                  <span className="font-medium text-sm">Início</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => { onViewChange('keywords'); onClose?.(); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    currentView === 'keywords' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <i className="fas fa-magnifying-glass-chart w-5 text-center"></i>
                  <span className="font-medium text-sm">Pesquisa Keywords</span>
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 px-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Conversas</p>
              <button 
                onClick={() => { onNewChat(); onClose?.(); }}
                className="text-indigo-400 hover:text-indigo-300 text-xs font-bold flex items-center gap-1"
              >
                <i className="fas fa-plus"></i> Novo
              </button>
            </div>
            
            <ul className="space-y-1">
              {conversations.length === 0 ? (
                <li className="px-4 py-3 text-xs text-slate-500 italic">Nenhuma conversa salva.</li>
              ) : (
                conversations.map((chat) => (
                  <li key={chat.id} className="group relative">
                    <button
                      onClick={() => { onSelectConversation(chat.id); onClose?.(); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left truncate pr-10 ${
                        activeConversationId === chat.id && currentView === 'chat'
                          ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      <i className="far fa-comment-dots w-4 text-center opacity-70"></i>
                      <span className="text-sm truncate">{chat.title}</span>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteConversation(chat.id); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 transition-all"
                    >
                      <i className="fas fa-trash-alt text-[10px]"></i>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
