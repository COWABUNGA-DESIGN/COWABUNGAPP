import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { TripleThemeToggle } from "@/components/TripleThemeToggle";
import { Globe } from "lucide-react";
import elevexLogoUrl from "@assets/IMG_8550_1763924590334.jpeg";
import successVideoUrl from "@assets/login_success_video.mp4";
import bgDarkUrl from "@assets/IMG_0730_1763452702046.jpeg";
import bgLightUrl from "@assets/IMG_0723_1763452702046.jpeg.jpeg";
import bgUnicornUrl from "@assets/IMG_0733_1763453430197.jpeg";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const [showSuccess, setShowSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const backgroundUrl = theme === "dark" ? bgDarkUrl : theme === "light" ? bgLightUrl : bgUnicornUrl;
  const logoUrl = elevexLogoUrl;
  const welcomeMessage = "Elevate your life";

  // Handle video end - navigate after video finishes
  useEffect(() => {
    if (!showSuccess || !videoRef.current) return;

    const video = videoRef.current;
    const handleVideoEnd = async () => {
      // Invalidate and ensure the auth query is properly refetched
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      // Give the server a moment to confirm the session is set
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Now navigate to home
      setLocation("/");
    };

    video.addEventListener("ended", handleVideoEnd);
    video.play();

    return () => {
      video.removeEventListener("ended", handleVideoEnd);
    };
  }, [showSuccess, setLocation]);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return await res.json();
    },
    onSuccess: async () => {
      setShowSuccess(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat transition-all duration-500"
      style={{ 
        backgroundImage: `url(${backgroundUrl})`,
        transform: theme === "unicorn" ? "rotate(0deg)" : "none",
        backgroundSize: isMobile ? "200%" : "cover",
        backgroundPosition: "center center",
      }}
    >
      <div 
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: theme === "dark" ? "rgba(0,0,0,0.4)" : theme === "light" ? "rgba(255,255,255,0.3)" : "rgba(255,144,187,0.2)"
        }}
      />

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ 
                duration: 0.6, 
                ease: "easeInOut",
                delay: 0.1
              }}
              className="flex items-center justify-center w-full h-full"
            >
              <video 
                ref={videoRef}
                className="w-full h-full object-contain"
                controls={false}
                autoPlay
                muted={false}
                data-testid="video-success-animation"
              >
                <source src={successVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex flex-col items-center justify-center mb-4">
            <img src={logoUrl} alt="Logo" className="w-64 h-auto" />
          </div>
          <motion.h1 
            key={welcomeMessage}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-base font-bold tracking-tight"
          >
            {welcomeMessage}
          </motion.h1>
          <div className="space-y-1">
            <p className="text-[10px] gradient-text leading-relaxed">Sebastien g, aka Lion Coding</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">Works with Apple Development Program</p>
          </div>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex justify-center items-center gap-4 mb-6">
              <TripleThemeToggle />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={language === "en" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLanguage("en")}
                  data-testid="button-lang-en"
                >
                  <Globe className="h-4 w-4 mr-1" />
                  EN
                </Button>
                <Button
                  type="button"
                  variant={language === "fr" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLanguage("fr")}
                  data-testid="button-lang-fr"
                >
                  <Globe className="h-4 w-4 mr-1" />
                  FR
                </Button>
              </div>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common_username")}</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-username"
                          placeholder={t("login_username_placeholder")}
                          autoComplete="username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common_password")}</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-password"
                          type="password"
                          placeholder={t("login_password_placeholder")}
                          autoComplete="current-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  data-testid="button-login"
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? `${t("login_button")}...` : t("login_button")}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}