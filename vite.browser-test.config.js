import {defineConfig} from 'vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({plugins:[tailwindcss()],define:{'import.meta.env.VITE_SUPABASE_URL':JSON.stringify('https://station-test.supabase.co'),'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':JSON.stringify('public-test-placeholder')},server:{host:'127.0.0.1',port:5174,strictPort:true}});
