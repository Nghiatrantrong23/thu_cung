export default function WorkIcon({ name = '', className = 'h-5 w-5' }) {
  const paths = name.includes('lich-hen') ? <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2"/></>
    : name.includes('dat-lich') ? <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4m-5 5v7m-3.5-3.5h7"/></>
    : name.includes('hoa-don') ? <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 7h6m-6 4h6m-6 4h3"/></>
    : name.includes('khieu-nai') ? <><path d="M21 11a8 8 0 0 1-8 8H5l-4 3V11a10 10 0 0 1 20 0Z"/><path d="M11 6v6m0 3h.01"/></>
    : name.includes('ca-lam') || name.includes('cham-soc') || name.includes('lich-lam') ? <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/></>
    : name.includes('dich-vu') ? <><path d="M8 4a4 4 0 0 0 8 0m-4 4v13M4 12h16"/><circle cx="5" cy="6" r="3"/><circle cx="19" cy="6" r="3"/></>
    : name.includes('bao-cao') ? <><path d="M4 3v18h17M8 17v-5m5 5V7m5 10v-8"/></>
    : name.includes('tai-khoan') ? <><circle cx="9" cy="8" r="4"/><path d="M2 21v-3a7 7 0 0 1 14 0v3m3-10 3 2v4l-3 2-3-2v-4l3-2Z"/></>
    : name === 'bell' ? <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>
    : name === 'menu' ? <path d="M4 6h16M4 12h16M4 18h16"/>
    : <><path d="m3 11 9-8 9 8v10H3V11Z"/><path d="M9 21v-7h6v7"/></>
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
}
