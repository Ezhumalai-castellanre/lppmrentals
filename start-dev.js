#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting LPPM Rentals Development Environment...\n');

// Start Netlify dev server
console.log('📡 Starting Netlify dev server on port 5001...');
const netlifyDev = spawn('netlify', ['dev', '--port', '5001'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
});

// Wait a bit for Netlify to start
setTimeout(() => {
  console.log('\n🌐 Starting Vite frontend on port 3000...');
  
  // Start Vite dev server
  const viteDev = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(process.cwd(), 'client')
  });

  // Handle process cleanup
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development servers...');
    netlifyDev.kill();
    viteDev.kill();
    process.exit(0);
  });

  netlifyDev.on('close', (code) => {
    console.log(`\n📡 Netlify dev server exited with code ${code}`);
  });

  viteDev.on('close', (code) => {
    console.log(`\n🌐 Vite dev server exited with code ${code}`);
  });

}, 3000);

netlifyDev.on('error', (err) => {
  console.error('❌ Failed to start Netlify dev server:', err);
  process.exit(1);
});
