import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { ChatPanel } from "@/components/ChatPanel";

export function FloatingMessageButton() {
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Load position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("floatingMessageButtonPosition");
    if (saved) {
      try {
        setPosition(JSON.parse(saved));
      } catch {
        setPosition({ x: 20, y: 20 });
      }
    }
  }, []);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem("floatingMessageButtonPosition", JSON.stringify(position));
  }, [position]);

  // Handle mouse down on button
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isOpen) return;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const buttonWidth = 140;
      const buttonHeight = 40;

      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;

      // Keep within bounds
      newX = Math.max(0, Math.min(newX, windowWidth - buttonWidth));
      newY = Math.max(0, Math.min(newY, windowHeight - buttonHeight));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div
      ref={buttonRef}
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : isOpen ? "default" : "grab",
      }}
      data-testid="floating-message-button"
    >
      {!isOpen ? (
        <Button
          onMouseDown={handleMouseDown}
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full shadow-lg"
          data-testid="button-open-messages"
        >
          <MessageSquare className="h-5 w-5 mr-2" />
          Messages
        </Button>
      ) : (
        <ChatPanel onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
}
