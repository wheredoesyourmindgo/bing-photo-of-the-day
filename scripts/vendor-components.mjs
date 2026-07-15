#!/usr/bin/env node

import {readFileSync, existsSync} from 'node:fs'
import path from 'node:path'
import {spawnSync} from 'node:child_process'

const cwd = process.cwd()
const manifestPath = path.join(cwd, 'vendor-components.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

const SOURCE_DIRS = {
  shadcn: path.join('src', 'components', 'ui'),
  'animate-ui': path.join('src', 'components', 'animate-ui'),
  'motion-primitives': path.join('src', 'components', 'ui')
}

const MOTION_PRIMITIVES_FILES = new Set(['disclosure.tsx', 'in-view.tsx'])

function printHelp() {
  console.log(`Usage:
  yarn vendor-components list
  yarn vendor-components sync
  yarn vendor-components sync <name> [more names...]
  yarn vendor-components sync --source=<source>
  yarn vendor-components discover

Options:
  --dry-run   Passes --dry-run through to shadcn add.
  --silent    Passes --silent through to shadcn add.

Sources:
  shadcn
  animate-ui
  motion-primitives`)
}

function componentStatus(component) {
  const existingPaths = component.paths.filter((file) => existsSync(path.join(cwd, file)))

  return {
    status:
      existingPaths.length === 0
        ? 'missing'
        : existingPaths.length === component.paths.length
          ? 'complete'
          : 'partial',
    existingPaths
  }
}

function normalizeName(value) {
  return value.trim().toLowerCase()
}

function findComponents(selectors, source) {
  const selectorSet = new Set(selectors.map(normalizeName))

  return manifest.components.filter((component) => {
    if (source && component.source !== source) {
      return false
    }

    if (selectorSet.size === 0) {
      return true
    }

    return (
      selectorSet.has(normalizeName(component.name)) ||
      selectorSet.has(normalizeName(component.spec))
    )
  })
}

function listComponents() {
  for (const component of manifest.components) {
    const {status, existingPaths} = componentStatus(component)
    const paths = existingPaths.length > 0 ? existingPaths.join(', ') : component.paths.join(', ')
    console.log(
      `${component.source.padEnd(17)} ${component.name.padEnd(32)} ${status.padEnd(9)} ${paths}`
    )
  }
}

function discoverComponents() {
  const trackedPaths = new Map()
  for (const component of manifest.components) {
    for (const file of component.paths) {
      const entries = trackedPaths.get(file) ?? []
      entries.push(component.name)
      trackedPaths.set(file, entries)
    }
  }

  const findings = []

  for (const [source, relativeDir] of Object.entries(SOURCE_DIRS)) {
    const dir = path.join(cwd, relativeDir)
    const result = spawnSync('rg', ['--files', dir], {
      cwd,
      encoding: 'utf8'
    })

    if (result.status !== 0) {
      continue
    }

    for (const absPath of result.stdout.split('\n').filter(Boolean)) {
      const relPath = path.relative(cwd, absPath)

      if (source === 'motion-primitives' && !MOTION_PRIMITIVES_FILES.has(path.basename(relPath))) {
        continue
      }

      if (source === 'shadcn' && MOTION_PRIMITIVES_FILES.has(path.basename(relPath))) {
        continue
      }

      findings.push({
        source,
        path: relPath,
        trackedBy: trackedPaths.get(relPath) ?? []
      })
    }
  }

  for (const finding of findings.sort((a, b) => a.path.localeCompare(b.path))) {
    const tracking =
      finding.trackedBy.length > 0 ? `tracked by ${finding.trackedBy.join(', ')}` : 'untracked'
    console.log(`${finding.source.padEnd(17)} ${finding.path} (${tracking})`)
  }
}

function syncComponents(selectors, source, options) {
  const components = findComponents(selectors, source)

  if (components.length === 0) {
    console.error('No matching tracked components found.')
    process.exitCode = 1
    return
  }

  for (const component of components) {
    const args = ['shadcn', 'add', '-y', '-o']
    if (options.dryRun) {
      args.push('--dry-run')
    }
    if (options.silent) {
      args.push('--silent')
    }
    args.push(component.spec)

    console.log(`Syncing ${component.source}:${component.name}`)
    const result = spawnSync('yarn', args, {
      cwd,
      stdio: 'inherit',
      encoding: 'utf8'
    })

    if (result.status !== 0) {
      process.exitCode = result.status ?? 1
      return
    }

    if (!options.dryRun) {
      const filesToFormat = component.paths.filter((file) => existsSync(path.join(cwd, file)))

      if (filesToFormat.length > 0) {
        console.log(`Formatting ${component.source}:${component.name}`)
        const prettierResult = spawnSync('yarn', ['prettier', '--write', ...filesToFormat], {
          cwd,
          stdio: 'inherit',
          encoding: 'utf8'
        })

        if (prettierResult.status !== 0) {
          process.exitCode = prettierResult.status ?? 1
          return
        }
      }
    }
  }
}

const args = process.argv.slice(2)
const command = args[0] ?? 'list'
const selectors = []
let source
const options = {
  dryRun: false,
  silent: false
}

for (const arg of args.slice(1)) {
  if (arg === '--dry-run') {
    options.dryRun = true
    continue
  }

  if (arg === '--silent') {
    options.silent = true
    continue
  }

  if (arg.startsWith('--source=')) {
    source = arg.slice('--source='.length)
    continue
  }

  selectors.push(arg)
}

if (source && !Object.keys(SOURCE_DIRS).includes(source)) {
  console.error(`Unknown source "${source}".`)
  process.exit(1)
}

switch (command) {
  case 'list':
    listComponents()
    break
  case 'discover':
    discoverComponents()
    break
  case 'sync':
    syncComponents(selectors, source, options)
    break
  case 'help':
  case '--help':
  case '-h':
    printHelp()
    break
  default:
    console.error(`Unknown command "${command}".`)
    printHelp()
    process.exit(1)
}
