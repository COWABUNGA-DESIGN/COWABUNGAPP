import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, ChevronDown, ChevronUp } from "lucide-react";
import type { User as UserType, Message, Conversation } from "@shared/schema";

interface ChatPanelProps {
  onClose: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const { data: currentUser } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<Map<string, UserType>>(new Map());
  const [inputValue, setInputValue] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    enabled: !!currentUser,
  });

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages for selected conversation
  useEffect(() => {
    async function fetchMessages() {
      if (!selectedConversation) return;

      try {
        const response = await fetch(`/api/messages/conversation/${selectedConversation.id}`, { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          setMessages(data);

          // Fetch user data for all senders
          const senderIds = Array.from(new Set(data.map((m: Message) => m.senderId)));
          const userMap = new Map<string, UserType>();

          for (const senderId of senderIds) {
            try {
              const userResponse = await fetch(`/api/users/${String(senderId)}`, { credentials: "include" });
              if (userResponse.ok) {
                const userData = await userResponse.json();
                userMap.set(String(senderId), userData);
              }
            } catch (error) {
              console.error(`Failed to fetch user ${senderId}:`, error);
            }
          }

          setUsers(userMap);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    }

    fetchMessages();
  }, [selectedConversation]);

  // WebSocket connection
  useEffect(() => {
    if (!currentUser) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : "";
    const wsUrl = `${protocol}//${host}${port}/ws`;

    try {
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("Chat WebSocket connected");
        setIsConnected(true);
        socket.send(JSON.stringify({ type: "auth", userId: currentUser.id }));
      };

      socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "auth_success") {
            console.log("Chat WebSocket authenticated");
          } else if (data.type === "new_message") {
            const newMsg = data.message;

            // Only add if it's for the current conversation and is direct
            if (selectedConversation && newMsg.channelType === "direct" && newMsg.conversationId === selectedConversation.id) {
              setMessages((prev) => [...prev, newMsg]);

              // Fetch user data if not cached
              if (!users.has(newMsg.senderId)) {
                try {
                  const userResponse = await fetch(`/api/users/${newMsg.senderId}`, { credentials: "include" });
                  if (userResponse.ok) {
                    const userData = await userResponse.json();
                    setUsers((prev) => new Map(prev).set(newMsg.senderId, userData));
                  }
                } catch (error) {
                  console.error(`Failed to fetch user ${newMsg.senderId}:`, error);
                }
              }
            }
          } else if (data.type === "error") {
            console.error("Chat WebSocket error:", data.message);
          }
        } catch (error) {
          console.error("Error handling WebSocket message:", error);
        }
      };

      socket.onclose = () => {
        console.log("Chat WebSocket disconnected");
        setIsConnected(false);
      };

      socket.onerror = (error) => {
        console.error("Chat WebSocket error:", error);
      };

      setWs(socket);

      return () => {
        socket.close();
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
    }
  }, [currentUser]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !ws || !isConnected || !selectedConversation) return;

    const messagePayload = {
      type: "chat_message",
      content: inputValue,
      channelType: "direct",
      conversationId: selectedConversation.id,
    };

    ws.send(JSON.stringify(messagePayload));
    setInputValue("");
  };

  const formatTime = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getOtherUserName = () => {
    if (!selectedConversation || !currentUser) return "User";
    const otherUserId =
      selectedConversation.participant1 === currentUser.id
        ? selectedConversation.participant2
        : selectedConversation.participant1;
    const otherUser = users.get(otherUserId);
    return otherUser?.username || "User";
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Card className="flex flex-col h-96 shadow-2xl w-80">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2 flex-1">
          {selectedConversation ? (
            <>
              <Avatar className="h-6 w-6">
                <AvatarImage src={users.get(selectedConversation.participant1 === currentUser.id ? selectedConversation.participant2 : selectedConversation.participant1)?.profilePicture || undefined} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate">{getOtherUserName()}</span>
            </>
          ) : (
            <span className="text-sm font-medium">Messages</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
            data-testid="button-minimize-chat-panel"
          >
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {selectedConversation && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setSelectedConversation(null);
                setMessages([]);
              }}
              className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
              data-testid="button-back-chat-panel"
            >
              ←
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
            data-testid="button-close-chat-panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Conversations List or Messages */}
          {!selectedConversation ? (
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No conversations yet. Go to Messages page to start chatting.
                  </p>
                ) : (
                  conversations.map((conv) => {
                    const otherUserId =
                      conv.participant1 === currentUser.id
                        ? conv.participant2
                        : conv.participant1;
                    const otherUser = users.get(otherUserId);
                    return (
                      <Button
                        key={conv.id}
                        variant="ghost"
                        onClick={() => setSelectedConversation(conv)}
                        className="w-full justify-start h-auto py-2"
                        data-testid={`button-conv-${conv.id}`}
                      >
                        <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                          <AvatarImage src={otherUser?.profilePicture || undefined} />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm">
                          {otherUser?.username || "User"}
                        </span>
                      </Button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-3 bg-muted/30">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${
                        msg.senderId === currentUser.id ? "justify-end" : "justify-start"
                      }`}
                      data-testid={`msg-${msg.id}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          msg.senderId === currentUser.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-background border"
                        }`}
                      >
                        <p className="break-words">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.senderId === currentUser.id
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t bg-background flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage();
                    }
                  }}
                  disabled={!isConnected}
                  className="text-sm"
                  data-testid="input-chat-msg"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!isConnected || !inputValue.trim()}
                  data-testid="button-send-msg"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
}
