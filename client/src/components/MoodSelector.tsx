import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const moods = [
  { value: "happy", emoji: "😊", label: "Happy" },
  { value: "focused", emoji: "😤", label: "Focused" },
  { value: "tired", emoji: "😴", label: "Tired" },
  { value: "stressed", emoji: "😢", label: "Stressed" },
  { value: "neutral", emoji: "😐", label: "Neutral" },
];

interface MoodSelectorProps {
  currentMood?: string;
}

export function MoodSelector({ currentMood = "neutral" }: MoodSelectorProps) {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleMoodChange = async (mood: string) => {
    setIsLoading(true);
    try {
      await apiRequest("PATCH", "/api/auth/user/mood", { mood });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    } catch (error) {
      console.error("Failed to update mood:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentMoodEmoji = moods.find(m => m.value === currentMood)?.emoji || "😐";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">How's your mood today?</label>
        <span className="text-2xl">{currentMoodEmoji}</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {moods.map((mood) => (
          <Button
            key={mood.value}
            variant="outline"
            size="sm"
            onClick={() => handleMoodChange(mood.value)}
            disabled={isLoading}
            className={`
              transition-all
              ${currentMood === mood.value ? 
                theme === 'unicorn' ? 'bg-gradient-to-r from-cyan-400 to-pink-400 border-0 text-white' :
                'bg-primary/20 border-primary text-primary' 
                : ''
              }
            `}
            data-testid={`button-mood-${mood.value}`}
          >
            <span className="text-lg mr-1">{mood.emoji}</span>
            {mood.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
