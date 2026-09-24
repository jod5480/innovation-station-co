import React, { useState } from 'react';
import { X, Send, MessageSquare, ArrowLeft, Video, Film, CheckCheck } from 'lucide-react';
import { DirectMessageConversation, User, ChatMessage } from '../../types';

interface DirectMessagesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: DirectMessageConversation[];
  currentUser: User;
  onSendMessage: (conversationId: string, text: string) => void;
  onUserClick: (user: User) => void;
  activeConversationUser?: User | null;
}

export const DirectMessagesDrawer: React.FC<DirectMessagesDrawerProps> = ({
  isOpen,
  onClose,
  conversations,
  currentUser,
  onSendMessage,
  onUserClick,
  activeConversationUser,
}) => {
  if (!isOpen) return null;

  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    activeConversationUser
      ? conversations.find((c) => c.participant.id === activeConversationUser.id)?.conversationId || 'conv_1'
      : 'conv_1'
  );

  const [messageInput, setMessageInput] = useState('');

  const activeConv = conversations.find((c) => c.conversationId === selectedConvId) || conversations[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConv) return;
    onSendMessage(activeConv.conversationId, messageInput.trim());
    setMessageInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#121826] border-l border-white/10 text-neutral-100 h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#0A0E17]/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-[#FF6B00]" />
            <div>
              <h3 className="font-brand font-bold text-base">Direct Dispatches</h3>
              <span className="text-[10px] text-[#94A3B8] font-mono">
                ENCRYPTED CINEMA NETWORK
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Conversation List Sidebar */}
          <div className="w-full sm:w-48 border-r border-white/10 overflow-y-auto bg-[#0A0E17]/60 p-2 space-y-1 shrink-0">
            <span className="text-[10px] font-mono text-[#94A3B8] uppercase px-2 py-1 block">
              COLLABORATORS
            </span>
            {conversations.map((c) => {
              const isSelected = c.conversationId === activeConv?.conversationId;
              return (
                <button
                  key={c.conversationId}
                  onClick={() => setSelectedConvId(c.conversationId)}
                  className={`w-full p-2 rounded-xl flex items-center gap-2.5 text-left transition-colors ${
                    isSelected
                      ? 'bg-[#FF6B00]/15 border border-[#FF6B00]/40 text-neutral-100'
                      : 'hover:bg-white/5 text-neutral-400'
                  }`}
                >
                  <img
                    src={c.participant.avatar}
                    alt={c.participant.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                  <div className="truncate">
                    <span className="text-xs font-semibold block truncate">
                      {c.participant.name}
                    </span>
                    <span className="text-[10px] text-neutral-500 truncate block">
                      {c.lastMessage}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Chat Conversation Area */}
          {activeConv ? (
            <div className="flex-1 flex flex-col bg-[#121826] justify-between">
              {/* Chat Subheader */}
              <div className="p-3 border-b border-white/10 bg-[#0A0E17]/40 flex items-center justify-between">
                <button
                  onClick={() => onUserClick(activeConv.participant)}
                  className="flex items-center gap-2 text-left"
                >
                  <img
                    src={activeConv.participant.avatar}
                    alt={activeConv.participant.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <span className="text-xs font-bold text-neutral-100 block">
                      {activeConv.participant.name}
                    </span>
                    <span className="text-[10px] text-[#FFB800] font-mono">
                      {activeConv.participant.roles[0]} · {activeConv.participant.country}
                    </span>
                  </div>
                </button>
              </div>

              {/* Message Bubbles */}
              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                {activeConv.messages.map((m) => {
                  const isMe = m.senderId === currentUser.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-[#FF6B00] text-white font-medium rounded-tr-none shadow-sm shadow-[#FF6B00]/20'
                            : 'bg-white/10 text-neutral-100 rounded-tl-none border border-white/10'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[10px] text-neutral-500 mt-1 px-1 flex items-center gap-1">
                        {m.time}
                        {isMe && <CheckCheck className="w-3 h-3 text-[#FFB800]" />}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSend}
                className="p-3 bg-[#0A0E17] border-t border-white/10 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message ${activeConv.participant.name}...`}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-neutral-100 placeholder-[#94A3B8] focus:outline-none focus:border-[#FF6B00]"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="px-3 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#E05300] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 transition-transform active:scale-95 shadow-sm shadow-[#FF6B00]/20"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-neutral-500">
              Select a conversation to begin
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
