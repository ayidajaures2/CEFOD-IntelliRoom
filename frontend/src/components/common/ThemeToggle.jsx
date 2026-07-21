import { LuSun, LuMoon } from "react-icons/lu";
import { useTheme } from "../../contexts/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ink/15 text-ink/70 transition-colors hover:border-accent hover:text-accent ${className}`}
    >
      {isDark ? <LuSun className="h-5 w-5" /> : <LuMoon className="h-5 w-5" />}
    </button>
  );
}
