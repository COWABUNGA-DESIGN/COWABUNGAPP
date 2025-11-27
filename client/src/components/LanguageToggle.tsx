import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { CanadaFlag } from "@/components/icons/CanadaFlag";
import { QuebecFlag } from "@/components/icons/QuebecFlag";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg" data-testid="toggle-language">
      <Button
        size="sm"
        variant={language === 'fr' ? 'default' : 'ghost'}
        onClick={() => setLanguage('fr')}
        className="h-8 gap-1.5"
        data-testid="button-lang-fr"
        aria-label="Français (Québec)"
      >
        <QuebecFlag className="w-5 h-3.5" />
        Français
      </Button>
      <Button
        size="sm"
        variant={language === 'en' ? 'default' : 'ghost'}
        onClick={() => setLanguage('en')}
        className="h-8 gap-1.5"
        data-testid="button-lang-en"
        aria-label="English (Canada)"
      >
        <CanadaFlag className="w-5 h-3.5" />
        English
      </Button>
    </div>
  );
}
