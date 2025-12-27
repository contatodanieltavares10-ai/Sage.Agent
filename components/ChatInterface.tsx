
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Conversation, Attachment } from '../types';

interface ChatInterfaceProps {
  conversation: Conversation;
  onUpdateConversation: (messages: ChatMessage[]) => void;
  onDraftUpdate: (id: string, draft: string, attachments: Attachment[]) => void;
  onSend: (id: string, content: string, attachments: Attachment[]) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ conversation, onUpdateConversation, onDraftUpdate, onSend }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincroniza o scroll quando novas mensagens chegam ou quando o estado de digitação muda
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation.messages, conversation.isTyping]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleInputChange = (val: string) => {
    onDraftUpdate(conversation.id, val, conversation.draftAttachments || []);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await fileToBase64(file);
      newAttachments.push({
        data: base64,
        mimeType: file.type,
        name: file.name
      });
    }
    onDraftUpdate(conversation.id, conversation.draftInput || '', [...(conversation.draftAttachments || []), ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const newAttachments: Attachment[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const base64 = await fileToBase64(file);
          newAttachments.push({
            data: base64,
            mimeType: file.type,
            name: `clipboard-image-${Date.now()}.png`
          });
        }
      }
    }

    if (newAttachments.length > 0) {
      onDraftUpdate(conversation.id, conversation.draftInput || '', [...(conversation.draftAttachments || []), ...newAttachments]);
    }
  };

  const removeAttachment = (index: number) => {
    const updated = (conversation.draftAttachments || []).filter((_, i) => i !== index);
    onDraftUpdate(conversation.id, conversation.draftInput || '', updated);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const currentInput = conversation.draftInput || '';
    const currentAttachments = conversation.draftAttachments || [];
    if ((!currentInput.trim() && currentAttachments.length === 0) || conversation.isTyping) return;
    
    onSend(conversation.id, currentInput, currentAttachments);
  };

  const handleDownloadCode = (code: string) => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sage-output.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePreviewCode = (code: string) => {
    const win = window.open();
    if (win) {
      win.document.write(code);
      win.document.close();
    }
  };

  const renderContent = (content: string) => {
    const codeBlockRegex = /```(?:html|javascript|typescript|css)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textSection = content.substring(lastIndex, match.index);
        const paragraphs = textSection.split('\n\n').filter(p => p.trim());
        paragraphs.forEach((p, pIdx) => {
          parts.push(<p key={`text-${match.index}-${pIdx}`} className="mb-6 last:mb-8 text-slate-700 leading-relaxed">{p.trim()}</p>);
        });
      }
      
      const code = match[1];
      parts.push(
        <div key={`code-${match.index}`} className="my-8 bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-800 w-full">
          <div className="px-4 py-2 bg-slate-800 flex justify-between items-center text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-2">
              <i className="fas fa-file-code text-indigo-400"></i>
              ARQUIVO GERADO
            </span>
            <div className="flex gap-3">
              <button onClick={() => handlePreviewCode(code)} className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                <i className="fas fa-eye text-[10px]"></i> Visualizar
              </button>
              <button onClick={() => handleDownloadCode(code)} className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                <i className="fas fa-download text-[10px]"></i> Download
              </button>
            </div>
          </div>
          <pre className="p-5 overflow-x-auto text-indigo-200 font-mono text-sm leading-relaxed custom-scrollbar">
            <code>{code}</code>
          </pre>
        </div>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      const paragraphs = remainingText.split('\n\n').filter(p => p.trim());
      paragraphs.forEach((p, pIdx) => {
        parts.push(<p key={`text-end-${pIdx}`} className="mb-6 last:mb-0 text-slate-700 leading-relaxed">{p.trim()}</p>);
      });
    }

    return parts;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white ring-4 ring-indigo-50">
            <i className="fas fa-code text-lg"></i>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 leading-tight">{conversation.title || 'Novo Chat'}</h3>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Sage Online
            </p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 custom-scrollbar bg-slate-50/20">
        {conversation.messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 py-20">
            <i className="fas fa-file-import text-6xl text-indigo-300"></i>
            <p className="text-lg font-medium text-slate-800">Sage Expert</p>
            <p className="text-sm max-w-xs">Envie textos, imagens ou arquivos para análise completa.</p>
          </div>
        )}
        
        {conversation.messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[95%] md:max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-xs shadow-sm mt-1 ${
                msg.role === 'user' ? 'bg-slate-700 text-white' : 'bg-indigo-600 text-white'
              }`}>
                <i className={`fas ${msg.role === 'user' ? 'fa-user' : 'fa-leaf'}`}></i>
              </div>
              <div className={`px-5 py-5 rounded-2xl text-[15px] shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
              }`}>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {msg.attachments.map((att, attIdx) => (
                      <div key={attIdx} className="relative group">
                        {att.mimeType.startsWith('image/') ? (
                          <img src={`data:${att.mimeType};base64,${att.data}`} className="w-32 h-32 object-cover rounded-lg border-2 border-white/20 shadow-md" alt="Attachment" />
                        ) : (
                          <div className="w-32 h-32 bg-slate-800/50 rounded-lg flex flex-col items-center justify-center p-2 text-center border-2 border-white/20">
                            <i className="fas fa-file-pdf text-3xl mb-2"></i>
                            <span className="text-[10px] truncate w-full">{att.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {msg.role === 'user' ? (
                  <span className="text-white">{msg.content}</span>
                ) : (
                  renderContent(msg.content)
                )}
              </div>
            </div>
          </div>
        ))}
        {conversation.isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs">
                <i className="fas fa-leaf"></i>
              </div>
              <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-6 border-t border-slate-100 bg-white">
        {(conversation.draftAttachments || []).length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            {conversation.draftAttachments!.map((att, idx) => (
              <div key={idx} className="relative w-20 h-20 group">
                {att.mimeType.startsWith('image/') ? (
                  <img src={`data:${att.mimeType};base64,${att.data}`} className="w-full h-full object-cover rounded-xl border border-slate-200" alt="Preview" />
                ) : (
                  <div className="w-full h-full bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <i className="fas fa-file text-xl"></i>
                    <span className="text-[8px] mt-1 px-1 truncate w-full text-center">{att.name}</span>
                  </div>
                )}
                <button 
                  onClick={() => removeAttachment(idx)}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="relative flex items-end gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            multiple 
            accept="image/*,application/pdf"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-all flex-shrink-0"
            title="Anexar arquivo ou imagem"
          >
            <i className="fas fa-paperclip text-lg"></i>
          </button>
          
          <div className="relative flex-1 group">
            <textarea
              value={conversation.draftInput || ''}
              onChange={(e) => handleInputChange(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              rows={1}
              placeholder="Cole uma imagem ou digite aqui..."
              className="w-full px-5 py-3.5 pr-14 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none resize-none transition-all text-slate-800 placeholder-slate-400 font-medium"
            />
            <button
              type="submit"
              disabled={(!conversation.draftInput?.trim() && (conversation.draftAttachments || []).length === 0) || conversation.isTyping}
              className="absolute right-2 bottom-2 w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:bg-slate-300 transition-all shadow-lg shadow-indigo-200 active:scale-95"
            >
              {conversation.isTyping ? <i className="fas fa-circle-notch fa-spin text-sm"></i> : <i className="fas fa-arrow-up text-sm"></i>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
