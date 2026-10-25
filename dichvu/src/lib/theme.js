export const THEME_KEY='petcare-theme'
export function validTheme(value){return value==='light'||value==='dark'}
export function readTheme(storage,prefersDark=false){
  try {const value=storage?.getItem(THEME_KEY);if(validTheme(value))return value}catch{/* Private mode may deny storage. */}
  return prefersDark?'dark':'light'
}
export function saveTheme(storage,value){
  if(!validTheme(value)||typeof storage?.setItem!=='function')return false
  try{storage?.setItem(THEME_KEY,value);return true}catch{return false}
}
