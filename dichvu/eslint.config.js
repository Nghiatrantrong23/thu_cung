import js from '@eslint/js'
import globals from 'globals'

export default [
  {ignores:['dist/**','node_modules/**','.cache/**']},
  {files:['src/**/*.{js,jsx}','test/**/*.js','vite.config.js','eslint.config.js'],...js.configs.recommended,
    languageOptions:{ecmaVersion:'latest',sourceType:'module',parserOptions:{ecmaFeatures:{jsx:true}},globals:{...globals.browser,...globals.node}},
    // JSX reference analysis requires an additional React plugin. Keep correctness
    // checks enabled without misreporting component imports as unused variables.
    rules:{...js.configs.recommended.rules,'no-unused-vars':'off'}},
]
