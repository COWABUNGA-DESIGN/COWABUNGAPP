import { Moon, Sun, Wand2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function TripleThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50">
      <Button
        data-testid="button-theme-dark"
        variant="ghost"
        size="icon"
        onClick={() => setTheme("dark")}
        className={`relative ${theme === "dark" ? "" : "opacity-50"}`}
      >
        <Moon className="w-4 h-4" />
        {theme === "dark" && (
          <motion.div
            layoutId="theme-indicator"
            className="absolute inset-0 bg-primary/20 rounded-md -z-10"
            initial={false}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </Button>

      <Button
        data-testid="button-theme-light"
        variant="ghost"
        size="icon"
        onClick={() => setTheme("light")}
        className={`relative ${theme === "light" ? "" : "opacity-50"}`}
      >
        <Sun className="w-4 h-4" />
        {theme === "light" && (
          <motion.div
            layoutId="theme-indicator"
            className="absolute inset-0 bg-primary/20 rounded-md -z-10"
            initial={false}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </Button>

      <Button
        data-testid="button-theme-unicorn"
        variant="ghost"
        size="icon"
        onClick={() => setTheme("unicorn")}
        className={`relative ${theme === "unicorn" ? "" : "opacity-50"}`}
      >
        {theme === "unicorn" ? (
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1.2, rotate: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, duration: 0.6 }}
          >
            <Wand2 className="w-4 h-4 text-primary" />
          </motion.div>
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
        {theme === "unicorn" && (
          <motion.div
            layoutId="theme-indicator"
            className="absolute inset-0 bg-primary/20 rounded-md -z-10"
            initial={false}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </Button>
    </div>
  );
}
