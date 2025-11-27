import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search } from "lucide-react";
import type { User, Conversation } from "@shared/schema";

interface NewMessageDialogProps {
  onConversationCreated?: (conversation: Conversation) => void;
}

export function NewMessageDialog({ onConversationCreated }: NewMessageDialogProps) {
  const { data: currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: open,
  });

  // Filter users based on search query and exclude current user
  const filteredUsers = users.filter((user) => {
    if (user.id === currentUser?.id) return false;
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  });

  const handleSelectUser = async (otherUserId: string) => {
    try {
      const response = await apiRequest("POST", "/api/conversations", { otherUserId });
      const conversation = await response.json() as Conversation;

      // Invalidate conversations list to refresh
      await queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });

      if (onConversationCreated) {
        onConversationCreated(conversation);
      }

      setOpen(false);
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-6 w-6" data-testid="button-new-dm">
          <PlusCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Direct Message</DialogTitle>
          <DialogDescription>
            Select a user to start a conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-users"
            />
          </div>

          <ScrollArea className="h-[300px] border rounded-md">
            <div className="p-2">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No users found
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredUsers.map((user) => (
                    <Button
                      key={user.id}
                      variant="ghost"
                      className="w-full justify-start gap-3 h-auto py-3"
                      onClick={() => handleSelectUser(user.id)}
                      data-testid={`button-select-user-${user.id}`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profilePicture || undefined} />
                        <AvatarFallback>
                          {user.username?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="font-medium text-sm truncate w-full">
                          {user.username}
                        </span>
                        <span className="text-xs text-muted-foreground truncate w-full">
                          {user.email || `@${user.username}`}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
