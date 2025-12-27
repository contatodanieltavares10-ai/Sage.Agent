
import React from 'react';
import { Conversation } from '../types';

interface DashboardProps {
  conversations: Conversation[];
  onNewChat: () => void;
  onKeywordResearch: () => void;
  onSelectChat: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ conversations, onNewChat, onKeywordResearch, onSelectChat }) => {
  const recentChats = [...conversations].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fadeIn py-8">
      <header className="text-center space-y-4">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-indigo-200">
          <i className="fas fa-leaf text-4xl"></i>
        </div>
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Sage Intelligence</h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
          Sua central avançada de estratégia orgânica e desenvolvimento frontend. Otimize sua presença digital com IA especializada.
        </p>
      </header>

      <div className="flex justify-center">
        <button 
          onClick={onNewChat}
          className="group bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-50 transition-all text-left max-w-xl w-full"
        >
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <i className="fas fa-plus text-2xl"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Novo Planejamento</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Inicie uma conversa estratégica para discutir arquitetura de conteúdo, SEO técnico ou desenvolvimento de apps.
          </p>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-history text-indigo-500 opacity-50"></i>
            Atividade Recente
          </h3>
        </div>
        
        <div className="divide-y divide-slate-50">
          {recentChats.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <i className="fas fa-inbox text-4xl mb-4 opacity-20"></i>
              <p className="text-sm">Você ainda não possui conversas salvas. Que tal começar uma agora?</p>
            </div>
          ) : (
            recentChats.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => onSelectChat(chat.id)}
                className="px-8 py-6 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center">
                    <i className="far fa-comments text-lg"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{chat.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {chat.messages.length} mensagens • {new Date(chat.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-slate-300 group-hover:translate-x-1 transition-transform"></i>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
