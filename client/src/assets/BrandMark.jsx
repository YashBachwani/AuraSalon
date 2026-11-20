export function BrandMark({ className = 'h-9 w-9' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="16" fill="#111827" />
      <rect x="2" y="2" width="60" height="60" rx="14" stroke="#D4A017" strokeWidth="2.5" />
      <path
        d="M22 44L32 18L42 44"
        stroke="#D4A017"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M25.5 36H38.5" stroke="#F9FAFB" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
