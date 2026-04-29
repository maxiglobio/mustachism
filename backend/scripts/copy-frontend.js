#!/usr/bin/env node
/**
 * Copies frontend static files to public/ for Vercel deployment
 */
const fs = require('fs')
const path = require('path')

// Support both: backend/frontend (when deployed from backend/) and ../frontend (when root dir is backend)
const frontendDir = fs.existsSync(path.join(__dirname, '../frontend'))
  ? path.join(__dirname, '../frontend')
  : path.join(__dirname, '../../frontend')
const publicDir = path.join(__dirname, '../public')

if (!fs.existsSync(frontendDir)) {
  console.warn('Frontend directory not found, skipping copy')
  process.exit(0)
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item))
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(src, dest)
  }
}

// Copy frontend files to public root (index.html, license-select.html, etc.)
const htmlFiles = [
  'index.html',
  'license-select.html',
  'personal-info.html',
  'order.html',
  'login.html',
  'dashboard.html',
  'story.html',
  'privacy-policy.html',
  'terms-of-service.html',
]
for (const file of htmlFiles) {
  const src = path.join(frontendDir, file)
  if (fs.existsSync(src)) {
    fs.mkdirSync(publicDir, { recursive: true })
    fs.copyFileSync(src, path.join(publicDir, file))
    console.log(`Copied ${file}`)
  }
}

const rootStaticFiles = ['site.webmanifest']
for (const file of rootStaticFiles) {
  const src = path.join(frontendDir, file)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(publicDir, file))
    console.log(`Copied ${file}`)
  }
}

// Copy assets folder
const assetsSrc = path.join(frontendDir, 'assets')
const assetsDest = path.join(publicDir, 'assets')
if (fs.existsSync(assetsSrc)) {
  copyRecursive(assetsSrc, assetsDest)
  console.log('Copied assets/')
}

console.log('Frontend copy complete')
