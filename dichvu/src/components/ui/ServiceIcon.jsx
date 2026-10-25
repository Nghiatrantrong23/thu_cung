export default function ServiceIcon({ name = '', className = 'h-6 w-6' }) {
  const label = name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const drawing = /cat|tia|groom/.test(label)
    ? <><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m8.5 7.5 12 12m-12-3 12-12M12 12l3-3"/></>
    : /spa|massage|thu gian/.test(label)
      ? <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Zm7-1v4m-2-2h4"/></>
      : /tam|ve sinh|say/.test(label)
        ? <><path d="M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12Z"/><path d="M9 15a3 3 0 0 0 3 3"/></>
        : <><circle cx="7" cy="6" r="2"/><circle cx="17" cy="6" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="20" cy="12" r="2"/><path d="M6 18c0-7 12-7 12 0s-5 2-6 2-6 3-6-2Z"/></>
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{drawing}</svg>
}
