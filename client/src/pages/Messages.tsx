import { UnifiedChat } from "@/components/UnifiedChat";

export default function Messages() {
  return (
    <div className="h-full flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">Team communication and collaboration</p>
      </div>

      <div className="flex-1 overflow-hidden bg-card rounded-lg border">
        <UnifiedChat />
      </div>
    </div>
  );
}
