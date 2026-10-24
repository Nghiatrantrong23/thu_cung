// Decorative illustrations, not photographs of the customer's own pets.
export default function PetIllustration({ species = 'Chó', className = 'h-16 w-16' }) {
  const cat = species === 'Mèo'
  return <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
    {cat ? <><path d="M12 29 10 8l17 10h10L54 8l-2 22" fill="#f5dfbd" stroke="#8e7452" strokeWidth="2.5" strokeLinejoin="round"/><path d="m15 19-1-4 7 5m28-1 1-4-7 5" stroke="#d99880" strokeWidth="3" strokeLinecap="round"/></> : <><path d="M19 17c-8-9-15-2-14 11 1 10 9 14 14 6m26-17c8-9 15-2 14 11-1 10-9 14-14 6" fill="#b88b64" stroke="#86684f" strokeWidth="2.5"/></>}
    <path d="M12 33c0-14 8-22 20-22s20 8 20 22c0 15-8 22-20 22s-20-7-20-22Z" fill={cat ? '#f5dfbd' : '#ead5b7'} stroke={cat ? '#8e7452' : '#86684f'} strokeWidth="2.5"/>
    <path d="M21 30v3m22-3v3" stroke="#344c4d" strokeWidth="3.5" strokeLinecap="round"/>
    <ellipse cx="32" cy="41" rx="12" ry="9" fill="#fff8ed"/>
    <path d="m28 38 4 4 4-4Z" fill="#806451" stroke="#806451" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M32 42v3m-5 0q5 5 10 0" stroke="#806451" strokeWidth="2" strokeLinecap="round"/>
    {cat && <path d="m8 37 13 2M7 45l14-2m22-4 13-2m-13 6 14 2" stroke="#8e7452" strokeWidth="1.5" strokeLinecap="round"/>}
    {!cat && <path d="M30 47v3q2 5 4 0v-3" fill="#df9b91"/>}
  </svg>
}
