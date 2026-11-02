import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** GitHub project site: https://<user>.github.io/vehicle-log/ */
const repoBase = '/vehicle-log/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? repoBase : '/',
  plugins: [react()],
}))
