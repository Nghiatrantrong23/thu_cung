import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
import {THEME_KEY,readTheme,saveTheme} from '../src/lib/theme.js'
test('saved appearance overrides OS preference and reload reads the same choice',()=>{
  const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)}
  assert.equal(readTheme(storage,false),'light')
  assert.equal(readTheme(storage,true),'dark')
  assert.equal(saveTheme(storage,'light'),true)
  assert.equal(readTheme(storage,true),'light')
  assert.equal(saveTheme(storage,'dark'),true)
  assert.equal(readTheme(storage,false),'dark')
  assert.deepEqual([...values.keys()],[THEME_KEY])
})
test('blocked or invalid browser storage never prevents rendering or switching',()=>{
  const blocked={getItem(){throw Error('Denied')},setItem(){throw Error('Denied')}}
  assert.equal(readTheme(blocked,true),'dark');assert.equal(saveTheme(blocked,'light'),false)
  assert.equal(readTheme({getItem:()=>'<invalid>'},false),'light')
  assert.equal(saveTheme(null,'dark'),false)
  assert.equal(saveTheme({setItem(){throw Error('Must not write')}},'invalid'),false)
})
test('pre-paint bootstrap and React preference reader agree without exposing other storage',()=>{
  const source=readFileSync(new URL('../public/theme-init.js',import.meta.url),'utf8')
  for(const [saved,prefersDark] of [['dark',false],['light',true],[null,true],['invalid',false]]) {
    const document={documentElement:{dataset:{},style:{}}}
    runInNewContext(source,{document,localStorage:{getItem:key=>{assert.equal(key,THEME_KEY);return saved}},window:{matchMedia:()=>({matches:prefersDark})}})
    const expected=readTheme({getItem:()=>saved},prefersDark)
    assert.equal(document.documentElement.dataset.theme,expected)
    assert.equal(document.documentElement.style.colorScheme,expected)
  }
  const document={documentElement:{dataset:{},style:{}}}
  runInNewContext(source,{document,localStorage:{getItem(){throw Error('Denied')}},window:{}})
  assert.equal(document.documentElement.dataset.theme,'light')
})
