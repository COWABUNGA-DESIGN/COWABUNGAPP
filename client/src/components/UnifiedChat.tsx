import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Hash, Building2, MessageCircle } from "lucide-react";
import { NewMessageDialog } from "@/components/NewMessageDialog";
import type { User as UserType, Message, Conversation } from "@shared/schema";

interface Channel {
  id: string;
  type: "headquarters" | "department";
  name: string;
  icon: typeof Hash | typeof Building2;
}

export function UnifiedChat() {
  const { data: currentUser } = useAuth();

  // State for channels tab
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [channelMessages, setChannelMessages] = useState<Message[]>([]);
  const [channelUsers, setChannelUsers] = useState<Map<string, UserType>>(new Map());

  // State for DM tab
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [dmMessages, setDmMessages] = useState<Message[]>([]);
  const [dmUsers, setDmUsers] = useState<Map<string, UserType>>(new Map());

  // Shared state
  const [inputValue, setInputValue] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("channels");

  // Get channels from current user
  const channels: Channel[] = [];
  if (currentUser?.headquarters) {
    channels.push({
      id: currentUser.headquarters,
      type: "headquarters",
      name: `${currentUser.headquarters} HQ`,
      icon: Building2,
    });
  }
  if (currentUser?.department) {
    channels.push({
      id: currentUser.department,
      type: "department",
      name: currentUser.department,
      icon: Hash,
    });
  }

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: !!currentUser,
    refetchInterval: 3000,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [channelMessages, dmMessages]);

  // Fetch channel messages
  useEffect(() => {
    if (!selectedChannel) return;

    const fetchChannelMessages = async () => {
      try {
        const endpoint =
          selectedChannel.type === "headquarters"
            ? `/api/messages/headquarters/${encodeURIComponent(selectedChannel.id)}`
            : `/api/messages/department/${encodeURIComponent(selectedChannel.id)}`;

        const response = await fetch(endpoint, { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          setChannelMessages(data);

          // Fetch user data for all senders
          const senderIds = Array.from(new Set(data.map((m: Message) => m.senderId)));
          const userMap = new Map<string, UserType>();

          for (const senderId of senderIds) {
            try {
              const userResponse = await fetch(`/api/users/${senderId as string}`, {
                credentials: "include",
              });
              if (userResponse.ok) {
                const userData = await userResponse.json();
                userMap.set(senderId as string, userData);
              }
            } catch (error) {
              console.error(`Failed to fetch user ${senderId}:`, error);
            }
          }
          setChannelUsers(userMap);
        }
      } catch (error) {
        console.error("Failed to fetch channel messages:", error);
      }
    };

    fetchChannelMessages();
  }, [selectedChannel]);

  // Fetch DM messages
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchDmMessages = async () => {
      try {
        const response = await fetch(`/api/messages/conversation/${selectedConversation.id}`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setDmMessages(data);

          // Fetch user data for all senders
          const senderIds = Array.from(new Set(data.map((m: Message) => m.senderId)));
          const userMap = new Map<string, UserType>();

          for (const senderId of senderIds) {
            try {
              const userResponse = await fetch(`/api/users/${senderId as string}`, {
                credentials: "include",
              });
              if (userResponse.ok) {
                const userData = await userResponse.json();
                userMap.set(senderId as string, userData);
              }
            } catch (error) {
              console.error(`Failed to fetch user ${senderId}:`, error);
            }
          }
          setDmUsers(userMap);
        }
      } catch (error) {
        console.error("Failed to fetch DM messages:", error);
      }
    };

    fetchDmMessages();
  }, [selectedConversation]);

  // Fetch other participant data for conversations
  useEffect(() => {
    if (conversations.length === 0 || !currentUser) return;

    const fetchConversationUsers = async () => {
      const userIds = new Set<string>();
      conversations.forEach((conv) => {
        const otherUserId = conv.participant1 === currentUser.id ? conv.participant2 : conv.participant1;
        userIds.add(otherUserId);
      });

      const userMap = new Map<string, UserType>();
      for (const userId of Array.from(userIds)) {
        try {
          const response = await fetch(`/api/users/${userId}`, { credentials: "include" });
          if (response.ok) {
            const userData = await response.json();
            userMap.set(userId, userData);
          }
        } catch (error) {
          console.error(`Failed to fetch user ${userId}:`, error);
        }
      }
      setDmUsers(userMap);
    };

    fetchConversationUsers();
  }, [conversations, currentUser]);

  // WebSocket setup
  useEffect(() => {
    if (!currentUser) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : "";
    const wsUrl = `${protocol}//${host}${port}/ws`;

    try {
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setIsConnected(true);
        socket.send(JSON.stringify({ type: "auth", userId: currentUser.id }));
        console.log("Chat WebSocket connected");
      };

      socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "new_message" && data.message) {
            const newMsg = data.message;

            // Add to channel messages if viewing that channel
            if (
              newMsg.channelType === "headquarters" &&
              selectedChannel?.type === "headquarters" &&
              selectedChannel.id === newMsg.headquarters
            ) {
              setChannelMessages((prev) => [...prev, newMsg]);

              // Fetch user if not cached
              const senderId = newMsg.senderId as string;
              if (!channelUsers.has(senderId)) {
                try {
                  const userResponse = await fetch(`/api/users/${senderId}`, {
                    credentials: "include",
                  });
                  if (userResponse.ok) {
                    const userData = await userResponse.json();
                    setChannelUsers((prev) => new Map(prev).set(senderId, userData));
                  }
                } catch (error) {
                  console.error(`Failed to fetch user:`, error);
                }
              }
            } else if (
              newMsg.channelType === "department" &&
              selectedChannel?.type === "department" &&
              selectedChannel.id === newMsg.department
            ) {
              setChannelMessages((prev) => [...prev, newMsg]);

              // Fetch user if not cached
              const senderId = newMsg.senderId as string;
              if (!channelUsers.has(senderId)) {
                try {
                  const userResponse = await fetch(`/api/users/${senderId}`, {
                    credentials: "include",
                  });
                  if (userResponse.ok) {
                    const userData = await userResponse.json();
                    setChannelUsers((prev) => new Map(prev).set(senderId, userData));
                  }
                } catch (error) {
                  console.error(`Failed to fetch user:`, error);
                }
              }
            } else if (
              newMsg.channelType === "direct" &&
              selectedConversation?.id === newMsg.conversationId
            ) {
              setDmMessages((prev) => [...prev, newMsg]);

              // Fetch user if not cached
              if (!dmUsers.has(newMsg.senderId)) {
                try {
                  const userResponse = await fetch(`/api/users/${newMsg.senderId}`, {
                    credentials: "include",
                  });
                  if (userResponse.ok) {
                    const userData = await userResponse.json();
                    setDmUsers((prev) => new Map(prev).set(newMsg.senderId, userData));
                  }
                } catch (error) {
                  console.error(`Failed to fetch user:`, error);
                }
              }
            }
          }
        } catch (error) {
          console.error("Error handling WebSocket message:", error);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        console.log("Chat WebSocket disconnected");
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };

      setWs(socket);

      return () => {
        socket.close();
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
    }
  }, [currentUser]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !ws || !isConnected) return;

    if (activeTab === "channels" && selectedChannel) {
      const payload = {
        type: "chat_message",
        content: inputValue,
        channelType: selectedChannel.type,
        [selectedChannel.type === "headquarters" ? "headquarters" : "department"]: selectedChannel.id,
      };
      ws.send(JSON.stringify(payload));
    } else if (activeTab === "direct" && selectedConversation) {
      const payload = {
        type: "chat_message",
        content: inputValue,
        channelType: "direct",
        conversationId: selectedConversation.id,
      };
      ws.send(JSON.stringify(payload));
    }

    setInputValue("");
  };

  const getOtherUser = (conv: Conversation) => {
    if (!currentUser) return null;
    const otherUserId = conv.participant1 === currentUser.id ? conv.participant2 : conv.participant1;
    return dmUsers.get(otherUserId);
  };

  const renderMoodEmoji = (mood?: string | null) => {
    const moodEmojis: Record<string, string> = {
      happy: "😊",
      focused: "😤",
      tired: "😴",
      stressed: "😢",
      neutral: "😐",
    };
    return moodEmojis[mood || "neutral"] || "😐";
  };

  if (!currentUser) return null;

  return (
    <div className="h-full flex flex-col gap-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="channels" data-testid="tab-channels">
            <Hash className="w-4 h-4 mr-2" />
            Channels
          </TabsTrigger>
          <TabsTrigger value="direct" data-testid="tab-direct">
            <MessageCircle className="w-4 h-4 mr-2" />
            Direct Messages
          </TabsTrigger>
        </TabsList>

        {/* Channels Tab */}
        <TabsContent value="channels" className="flex-1 flex gap-2 overflow-hidden">
          {/* Channel List */}
          <div className="w-40 border-r flex flex-col gap-2 p-2">
            <p className="text-xs font-semibold text-muted-foreground px-2">CHANNELS</p>
            {channels.map((channel) => (
              <Button
                key={channel.id}
                variant={selectedChannel?.id === channel.id ? "default" : "ghost"}
                className="w-full justify-start text-left"
                onClick={() => {
                  setSelectedChannel(channel);
                  setChannelMessages([]);
                  setChannelUsers(new Map());
                }}
                data-testid={`button-channel-${channel.id}`}
              >
                <channel.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate text-sm">{channel.name}</span>
              </Button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedChannel ? (
              <>
                <div className="border-b p-2 bg-muted/30">
                  <p className="text-sm font-semibold">{selectedChannel.name}</p>
                </div>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-2">
                    {channelMessages.map((msg, idx) => {
                      const sender = channelUsers.get(msg.senderId);
                      const isCurrentUser = sender?.id === currentUser.id;
                      const fallback = sender?.username ? sender.username[0].toUpperCase() : "?";

                      return (
                        <div
                          key={idx}
                          className={`flex gap-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}
                          data-testid={`message-${idx}`}
                        >
                          {!isCurrentUser && (
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              <AvatarImage src={sender?.profilePicture || undefined} />
                              <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`flex-1 max-w-xs ${isCurrentUser ? "text-right" : ""}`}>
                            {!isCurrentUser && (
                              <p className="text-xs font-semibold mb-1">
                                {sender?.username || "Unknown"}
                              </p>
                            )}
                            <div
                              className={`inline-block px-3 py-2 rounded-lg text-sm ${
                                isCurrentUser
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="break-words">{msg.content}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={!isConnected}
                    data-testid="input-channel-message"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!isConnected || !inputValue.trim()}
                    data-testid="button-send-channel"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Select a channel to start messaging
              </div>
            )}
          </div>
        </TabsContent>

        {/* Direct Messages Tab */}
        <TabsContent value="direct" className="flex-1 flex gap-2 overflow-hidden">
          {/* Conversation List */}
          <div className="w-40 border-r flex flex-col gap-2 p-2 overflow-hidden">
            <div className="flex items-center justify-between px-2 gap-1">
              <p className="text-xs font-semibold text-muted-foreground">MESSAGES</p>
              <NewMessageDialog onConversationCreated={(conv) => setSelectedConversation(conv)} />
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-1">
                {conversations.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">No conversations yet</p>
                ) : (
                  conversations.map((conv) => {
                    const otherUser = getOtherUser(conv);
                    const fallback = otherUser?.username ? otherUser.username[0].toUpperCase() : "?";

                    return (
                      <Button
                        key={conv.id}
                        variant={selectedConversation?.id === conv.id ? "default" : "ghost"}
                        className="w-full justify-start text-left"
                        onClick={() => {
                          setSelectedConversation(conv);
                          setDmMessages([]);
                        }}
                        data-testid={`button-conversation-${conv.id}`}
                      >
                        <Avatar className="h-5 w-5 mr-2 flex-shrink-0">
                          <AvatarImage src={otherUser?.profilePicture || undefined} />
                          <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm flex-1">{otherUser?.username || "Unknown"}</span>
                        <span className="text-xs ml-1">{renderMoodEmoji(otherUser?.mood)}</span>
                      </Button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {(() => {
                  const otherUser = getOtherUser(selectedConversation);
                  const fallback = otherUser?.username ? otherUser.username[0].toUpperCase() : "?";

                  return (
                    <>
                      <div className="border-b p-2 bg-muted/30 flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={otherUser?.profilePicture || undefined} />
                          <AvatarFallback>{fallback}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-semibold flex-1">{otherUser?.username || "Unknown"}</p>
                        <span className="text-lg">{renderMoodEmoji(otherUser?.mood)}</span>
                      </div>
                    </>
                  );
                })()}
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-2">
                    {dmMessages.map((msg, idx) => {
                      const sender = dmUsers.get(msg.senderId);
                      const isCurrentUser = sender?.id === currentUser.id;
                      const fallback = sender?.username ? sender.username[0].toUpperCase() : "?";

                      return (
                        <div
                          key={idx}
                          className={`flex gap-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}
                          data-testid={`dm-message-${idx}`}
                        >
                          {!isCurrentUser && (
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              <AvatarImage src={sender?.profilePicture || undefined} />
                              <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`inline-block px-3 py-2 rounded-lg text-sm ${
                              isCurrentUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="break-words">{msg.content}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={!isConnected}
                    data-testid="input-dm-message"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!isConnected || !inputValue.trim()}
                    data-testid="button-send-dm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
