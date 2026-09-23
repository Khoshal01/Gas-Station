import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',use:{baseURL:'http://127.0.0.1:5174',channel:'chrome',headless:true},reporter:'list',webServer:{command:'node node_modules/vite/bin/vite.js --config vite.browser-test.config.js',url:'http://127.0.0.1:5174',reuseExistingServer:false}});
