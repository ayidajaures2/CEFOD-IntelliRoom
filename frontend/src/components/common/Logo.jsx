import { Link } from "react-router-dom";

/**
 * Logo CEFOD IntelliRoom.
 * - variant "full" : image + nom (navbar, footer)
 * - variant "mark" : image seule (sidebar compacte)
 * L'image vit dans public/cefod-logo.jpeg
 */
export default function Logo({ variant = "full", to = "/", className = "" }) {
  const img = (
    <img
      src="/cefod-logo.jpeg"
      alt="Logo CEFOD"
      className="h-9 w-9 rounded-lg object-cover"
    />
  );

  const content = (
    <span className={`flex items-center gap-2.5 ${className}`}>
      {img}
      {variant === "full" && (
        <span className="font-display text-lg font-black leading-none">
          CEFOD <span className="text-accent">IntelliRoom</span>
        </span>
      )}
    </span>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}