import { spawn } from 'node:child_process';
const jobs = [['server/demo.mjs'], ['node_modules/vite/bin/vite.js', '--mode', 'corporate'], ['node_modules/vite/bin/vite.js', '--mode', 'cosmetics']];
const children = jobs.map(args => spawn(process.execPath, args, { stdio: 'inherit', windowsHide: true }));
const stop = () => children.forEach(child => child.kill());
process.on('SIGINT', stop); process.on('SIGTERM', stop);
children.forEach(child => child.on('exit', code => { if (code) { stop(); process.exitCode = code; } }));
