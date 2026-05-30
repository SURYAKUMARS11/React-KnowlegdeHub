import React from "react";

export default function Icon({ name, size = 16, className = "", ariaHidden = true }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", className };

  switch (name) {
    case "plus":
      return (
        <svg {...common} aria-hidden={ariaHidden}>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "drafts":
      return (
        <svg {...common} aria-hidden={ariaHidden}>
          <path d="M4 7a2 2 0 012-2h8l6 6v6a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 7V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "article":
      return (
        <svg {...common} aria-hidden={ariaHidden}>
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M7 8h10M7 12h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "activity":
      return (
        <svg {...common} aria-hidden={ariaHidden}>
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case "view":
      return (
        <svg {...common} aria-hidden={ariaHidden}>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    default:
      return null;
  }
}
