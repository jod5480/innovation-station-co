import React, { useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  SquarePen,
  Search,
  Camera,
  Image as ImageIcon,
  Mic,
  Sticker,
} from "lucide-react";
import { DirectMessageConversation, User, Application } from "../../types";
import { MessageSquare, ExternalLink, Clapperboard, Sparkles } from "lucide-react";

interface DirectMessagesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: DirectMessageConversation[];
  currentUser: User;
  onSendMessage: (conversationId: string, text: string) => void;
  onUserClick: (user: User) => void;
  activeConversationUser?: User | null;
  myApplications?: Application[];
  receivedApplications?: Application[];
  onUpdateApplicationStatus?: (
    id: string,
    status: any,
    applicantId?: string,
    projectTitle?: string,
  ) => void;
  onMarkRead?: (conversationId: string) => void;
}

export const DirectMessagesDrawer: React.FC<DirectMessagesDrawerProps> = ({
  isOpen,
  onClose,
  conversations,
  currentUser,
  onSendMessage,
  onUserClick,
  activeConversationUser,
  myApplications = [],
  receivedApplications = [],
  onUpdateApplicationStatus,
  onMarkRead,
}) => {
  if (!isOpen) return null;

  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    activeConversationUser
      ? conversations.find((c) => c.participant.id === activeConversationUser.id)?.conversationId ||
          null
      : null,
  );

  const [messageInput, setMessageInput] = useState("");
  const [activeTab, setActiveTab] = useState<"Chats" | "Groups" | "Submissions">("Chats");
  const [appsViewMode, setAppsViewMode] = useState<"submitted" | "received">("submitted");
  const [searchQuery, setSearchQuery] = useState("");

  // Track read status in local state (mocking the first conv as unread initially)
  const [readConvs, setReadConvs] = useState<Set<string>>(new Set());

  const activeConv = conversations.find((c) => c.conversationId === selectedConvId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConv) return;
    onSendMessage(activeConv.conversationId, messageInput.trim());
    setMessageInput("");
  };

  const handleConvClick = (convId: string) => {
    setSelectedConvId(convId);
    setReadConvs((prev) => new Set(prev).add(convId));
    onMarkRead?.(convId);
  };

  // Filter conversations by Search and Tab
  const filteredConversations = conversations.filter((c) => {
    // Search filter
    if (
      searchQuery &&
      !c.participant.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Tab filter (Mocking: all are primary, except we can hide them in requests/general if we want. For now, let's just say all are primary, general is empty)
    if (activeTab === "Groups" || activeTab === "Submissions") return false;

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-black/95 border-l border-border text-neutral-100 h-full flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl animate-in slide-in-from-right duration-300">
        {!activeConv ? (
          /* INBOX VIEW */
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0 apple-glass-subtle border-b border-white/5">
              <button
                onClick={onClose}
                className="p-1 hover:bg-muted rounded-full transition-colors active:scale-95"
              >
                <ArrowLeft className="w-6 h-6 text-foreground" strokeWidth={1.5} />
              </button>

              <button className="flex items-center gap-1 font-brand font-bold text-base text-foreground focus:outline-none active:scale-95 transition-transform">
                {currentUser.username}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              <button className="p-1 hover:bg-muted rounded-full transition-colors active:scale-95">
                <SquarePen className="w-6 h-6 text-foreground" strokeWidth={1.5} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center shrink-0 border-b border-white/5">
              <button
                onClick={() => setActiveTab("Chats")}
                className={`flex-1 py-3 text-center text-[14px] font-semibold transition-colors ${
                  activeTab === "Chats"
                    ? "text-[var(--theme-color)] border-b-[2px] border-[var(--theme-color)]"
                    : "text-neutral-500 border-b-[2px] border-transparent hover:text-neutral-300"
                }`}
              >
                Chats
              </button>
              <button
                onClick={() => setActiveTab("Groups")}
                className={`flex-1 py-3 text-center text-[14px] font-semibold transition-colors ${
                  activeTab === "Groups"
                    ? "text-[var(--theme-color)] border-b-[2px] border-[var(--theme-color)]"
                    : "text-neutral-500 border-b-[2px] border-transparent hover:text-neutral-300"
                }`}
              >
                Groups
              </button>
              <button
                onClick={() => setActiveTab("Submissions")}
                className={`flex-1 py-3 text-center text-[14px] font-semibold transition-colors ${
                  activeTab === "Submissions"
                    ? "text-[var(--theme-color)] border-b-[2px] border-[var(--theme-color)]"
                    : "text-neutral-500 border-b-[2px] border-transparent hover:text-neutral-300"
                }`}
              >
                Submissions
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
              {/* Search Bar */}
              <div className="px-4 py-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full pl-10 pr-4 py-2 apple-glass-input rounded-xl text-sm text-foreground placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                  />
                </div>
              </div>

              {/* Submissions View */}
              {activeTab === "Submissions" && (
                <div className="px-4 py-2 space-y-4">
                  <div className="flex items-center gap-2 p-1 bg-muted/50 border border-border rounded-xl">
                    <button
                      onClick={() => setAppsViewMode("submitted")}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        appsViewMode === "submitted"
                          ? "bg-[var(--theme-color)] text-foreground shadow"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      My Submissions ({myApplications.length})
                    </button>
                    <button
                      onClick={() => setAppsViewMode("received")}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        appsViewMode === "received"
                          ? "bg-[var(--theme-color)] text-foreground shadow"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Received ({receivedApplications.length})
                    </button>
                  </div>

                  {appsViewMode === "submitted" ? (
                    myApplications.length === 0 ? (
                      <div className="p-8 text-center bg-muted/50 rounded-2xl border border-border text-muted-foreground text-xs space-y-2">
                        <Clapperboard className="w-8 h-8 text-neutral-500 mx-auto" />
                        <p className="font-semibold text-neutral-300">No Applications Yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3 pb-20">
                        {myApplications.map((app) => (
                          <div
                            key={app.id}
                            className="p-4 rounded-2xl bg-[#121212] border border-border space-y-2.5 shadow-md"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="font-brand font-bold text-sm text-foreground truncate">
                                  {app.projectTitle}
                                </h4>
                                <span className="text-[11px] text-white font-mono">
                                  Applied as: {app.selectedRole}
                                </span>
                              </div>
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-muted text-foreground">
                                {app.status}
                              </span>
                            </div>
                            {app.coverNote && (
                              <p className="text-xs text-neutral-300 italic bg-background/40 p-2.5 rounded-xl border border-white/5">
                                "{app.coverNote}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  ) : receivedApplications.length === 0 ? (
                    <div className="p-8 text-center bg-muted/50 rounded-2xl border border-border text-muted-foreground text-xs space-y-2">
                      <Sparkles className="w-8 h-8 text-neutral-500 mx-auto" />
                      <p className="font-semibold text-neutral-300">No Applications Received</p>
                    </div>
                  ) : (
                    <div className="space-y-3 pb-20">
                      {receivedApplications.map((app) => (
                        <div
                          key={app.id}
                          className="p-4 rounded-2xl bg-[#121212] border border-border space-y-3 shadow-md"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={app.applicant.avatar}
                                alt={app.applicant.name}
                                className="w-10 h-10 rounded-full object-cover shrink-0"
                              />
                              <div className="truncate">
                                <span className="font-bold text-sm text-foreground block truncate">
                                  {app.applicant.name}
                                </span>
                                <span className="text-[11px] text-white block truncate">
                                  For: {app.selectedRole}
                                </span>
                              </div>
                            </div>
                          </div>
                          {onUpdateApplicationStatus && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  onUpdateApplicationStatus(
                                    app.id,
                                    "Shortlisted",
                                    app.applicantId,
                                    app.projectTitle,
                                  )
                                }
                                className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-[11px] font-semibold"
                              >
                                Shortlist
                              </button>
                              <button
                                onClick={() =>
                                  onUpdateApplicationStatus(
                                    app.id,
                                    "Selected",
                                    app.applicantId,
                                    app.projectTitle,
                                  )
                                }
                                className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[11px] font-semibold"
                              >
                                Select
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Groups View */}
              {activeTab === "Groups" && (
                <div className="p-8 text-center text-neutral-500">Groups feature coming soon.</div>
              )}

              {/* Messages List */}
              {activeTab === "Chats" && (
                <div className="mt-2 space-y-0.5 px-2">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((c, idx) => {
                      const isUnread = c.unreadCount > 0 && !readConvs.has(c.conversationId);

                      return (
                        <button
                          key={c.conversationId}
                          onClick={() => handleConvClick(c.conversationId)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors text-left active:scale-[0.98] group"
                        >
                          <img
                            src={c.participant.avatar}
                            alt={c.participant.name}
                            className="w-14 h-14 rounded-full object-cover shrink-0 border border-border"
                          />
                          <div className="flex-1 truncate pr-2">
                            <span
                              className={`text-[14px] block truncate ${isUnread ? "font-bold text-foreground" : "font-semibold text-neutral-200"}`}
                            >
                              {c.participant.username}
                            </span>
                            <span
                              className={`text-[13px] block truncate mt-0.5 ${isUnread ? "font-semibold text-white" : "text-muted-foreground"}`}
                            >
                              {c.lastMessage} · {c.messages[c.messages.length - 1]?.time || "2h"}
                            </span>
                          </div>
                          {isUnread ? (
                            <div className="w-2.5 h-2.5 rounded-full bg-[var(--theme-color)] shrink-0 shadow-[0_0_8px_var(--theme-color)] opacity-90" />
                          ) : (
                            <Camera
                              className="w-5 h-5 text-neutral-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              strokeWidth={1.5}
                            />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center text-neutral-500 py-10">No messages found.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ACTIVE CHAT VIEW */
          <div className="flex flex-col h-full bg-black/60 animate-in slide-in-from-right duration-200">
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 apple-glass-subtle shrink-0">
              <button
                onClick={() => setSelectedConvId(null)}
                className="p-1 hover:bg-muted rounded-full transition-colors active:scale-95"
              >
                <ArrowLeft className="w-6 h-6 text-foreground" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => onUserClick(activeConv.participant)}
                className="flex items-center gap-2 flex-1 text-left active:opacity-70 transition-opacity"
              >
                <img
                  src={activeConv.participant.avatar}
                  alt={activeConv.participant.name}
                  className="w-9 h-9 rounded-full object-cover border border-[var(--theme-color)]/30"
                />
                <div>
                  <span className="text-sm font-bold text-foreground block leading-tight">
                    {activeConv.participant.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground block font-mono">
                    @{activeConv.participant.username}
                  </span>
                </div>
              </button>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <Camera className="w-5 h-5 text-foreground" strokeWidth={1.5} />
              </button>
            </div>

            {/* Message Bubbles */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {activeConv.messages.map((m) => {
                const isMe = m.senderId === currentUser.id;
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[75%] px-4 py-2.5 text-[14px] leading-relaxed ${
                        isMe
                          ? "bg-[var(--theme-color)] text-foreground rounded-[20px] rounded-br-sm shadow-md shadow-[var(--theme-color)]/25"
                          : "apple-glass-subtle text-foreground rounded-[20px] rounded-bl-sm border border-border"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1 px-1 flex items-center gap-1">
                      {m.time}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSend}
              className="p-3 border-t border-white/5 apple-glass-subtle shrink-0 flex items-center gap-2"
            >
              <button
                type="button"
                className="p-2.5 bg-[var(--theme-color)] shadow-md shadow-[var(--theme-color)]/30 rounded-full text-foreground shrink-0 active:scale-95 transition-transform"
              >
                <Camera className="w-5 h-5" fill="currentColor" />
              </button>

              <div className="relative flex-1 flex items-center apple-glass-input rounded-full px-1">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Message..."
                  className="flex-1 px-4 py-2.5 bg-transparent text-[14px] text-foreground placeholder-neutral-400 focus:outline-none"
                />

                {messageInput.trim() ? (
                  <button
                    type="submit"
                    className="p-2 mr-1 text-white font-bold text-sm transition-all active:scale-95"
                  >
                    Send
                  </button>
                ) : (
                  <div className="flex items-center text-muted-foreground pr-2 gap-1 shrink-0">
                    <button type="button" className="p-1.5 hover:text-foreground transition-colors">
                      <Mic className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                    <button type="button" className="p-1.5 hover:text-foreground transition-colors">
                      <ImageIcon className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                    <button type="button" className="p-1.5 hover:text-foreground transition-colors">
                      <Sticker className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
