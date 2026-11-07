// Apply before React/CSS paint to avoid a bright flash for a saved dark theme.
;(function(){
  let theme
  try{theme=localStorage.getItem('petcare-theme')}catch{}
  if(theme!=='dark'&&theme!=='light')theme=window.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light'
  document.documentElement.dataset.theme=theme
  document.documentElement.style.colorScheme=theme
})()
