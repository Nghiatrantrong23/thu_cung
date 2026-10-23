export default function PawIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <ellipse cx="5.5" cy="10.5" rx="2" ry="2.7" />
      <ellipse cx="9.5" cy="6" rx="2" ry="2.7" />
      <ellipse cx="14.5" cy="6" rx="2" ry="2.7" />
      <ellipse cx="18.5" cy="10.5" rx="2" ry="2.7" />
      <path d="M12 11c-3 0-5.5 3-5.5 5.2 0 1.8 1.4 2.8 3 2.8 1 0 1.6-.4 2.5-.4s1.5.4 2.5.4c1.6 0 3-1 3-2.8C17.5 14 15 11 12 11z" />
    </svg>
  )
}
