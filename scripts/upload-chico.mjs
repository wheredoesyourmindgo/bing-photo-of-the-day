#!/usr/bin/env node

import {readdirSync, readFileSync} from 'node:fs'
import path from 'node:path'
import {put, list} from '@vercel/blob'

const sourceDir = process.argv[2]

if (!sourceDir) {
  console.log('Usage: node scripts/upload-chico.mjs <source-dir>')
  process.exit(1)
}

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp'])

const files = readdirSync(sourceDir).filter((name) =>
  IMAGE_EXT.has(path.extname(name).toLowerCase())
)

if (files.length === 0) {
  console.log(`No images found in ${sourceDir}`)
  process.exit(0)
}

const {blobs: existing} = await list()
const existingPathnames = new Set(existing.map((b) => b.pathname))

const urls = []
for (const name of files) {
  if (existingPathnames.has(name)) {
    const already = existing.find((b) => b.pathname === name)
    console.log(`skip (already uploaded): ${name}`)
    urls.push(already.url)
    continue
  }
  const file = readFileSync(path.join(sourceDir, name))
  const blob = await put(name, file, {access: 'public'})
  console.log(`uploaded: ${name} -> ${blob.url}`)
  urls.push(blob.url)
}

console.log('\nCHICO_IMAGES entries:\n')
console.log(urls.map((url) => `  '${url}'`).join(',\n'))
