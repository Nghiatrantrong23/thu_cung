import {createContext,useContext,useEffect,useLayoutEffect,useRef,useState} from 'react'
import {readTheme,saveTheme,THEME_KEY,validTheme} from '../lib/theme.js'
const ThemeContext=createContext(null)
function storage(){try{return window.localStorage}catch{return null}}
export function ThemeProvider({children}){
  const chosenThisSession=useRef(false)
  const [theme,setTheme]=useState(()=>{
    const applied=document.documentElement.dataset.theme
    return validTheme(applied)?applied:readTheme(storage(),window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  })
  useLayoutEffect(()=>{document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme},[theme])
  useEffect(()=>{
    const media=window.matchMedia?.('(prefers-color-scheme: dark)')
    function syncSystem(){let chosen;try{chosen=storage()?.getItem(THEME_KEY)}catch{/* Keep the current session usable without storage. */}if(!chosenThisSession.current&&!validTheme(chosen))setTheme(media?.matches?'dark':'light')}
    function syncStorage(event){if(event.key===THEME_KEY||event.key===null){chosenThisSession.current=validTheme(event.newValue);setTheme(validTheme(event.newValue)?event.newValue:readTheme(storage(),media?.matches))}}
    media?.addEventListener('change',syncSystem);window.addEventListener('storage',syncStorage)
    return()=>{media?.removeEventListener('change',syncSystem);window.removeEventListener('storage',syncStorage)}
  },[])
  function toggleTheme(){const next=theme==='dark'?'light':'dark';chosenThisSession.current=true;saveTheme(storage(),next);setTheme(next)}
  return <ThemeContext.Provider value={{theme,toggleTheme}}>{children}</ThemeContext.Provider>
}
export function useTheme(){return useContext(ThemeContext)}
