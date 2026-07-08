import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { getProjectRoot } from '../bootstrap/state.js'
import { logForDebugging } from '../utils/debug.js'
import { execSync } from 'child_process'

// Lightweight print helper — avoids importing the full CLI print module
function print(msg: string, opts?: { variant?: string }): void {
  const prefix = opts?.variant === 'error' ? '✗ ' :
                 opts?.variant === 'success' ? '✓ ' :
                 opts?.variant === 'info' ? 'ℹ ' : ''
  console.log(prefix + msg)
}

/**
 * Bootstrap/setup a project for Claude Code.
 *
 * The 'up' command initializes a project directory with Claude Code
 * configuration files, similar to 'git init' or 'npm init'.
 *
 * Creates:
 * - .claude/ directory
 * - .claude/settings.json (default settings)
 * - CLAUDE.md (project instructions template)
 *
 * Respects existing files - won't overwrite.
 */
export async function up(): Promise<void> {
  const projectRoot = getProjectRoot()
  const claudeDir = join(projectRoot, '.claude')
  const claudeMdPath = join(projectRoot, 'CLAUDE.md')
  const settingsPath = join(claudeDir, 'settings.json')

  // Create .claude directory
  if (!existsSync(claudeDir)) {
    try {
      mkdirSync(claudeDir, { recursive: true })
      print('Created .claude/ directory', { variant: 'success' })
    } catch (err) {
      print(
        'Failed to create .claude/ directory: ' +
          (err instanceof Error ? err.message : String(err)),
        { variant: 'error' },
      )
      return
    }
  } else {
    print('.claude/ directory already exists', { variant: 'info' })
  }

  // Create CLAUDE.md template if it doesn't exist
  if (!existsSync(claudeMdPath)) {
    const template = `# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

[Describe your project here - what it does, key technologies, architecture]

## Commands

\`\`\`bash
# Build
# Test
# Lint
\`\`\`

## Code Style

[Describe coding conventions, naming patterns, preferred patterns]

## Testing

[Describe testing approach, frameworks used, how to run tests]

## Important Notes

[Any important context Claude should know about this project]
`
    try {
      writeFileSync(claudeMdPath, template, 'utf8')
      print('Created CLAUDE.md template', { variant: 'success' })
    } catch (err) {
      print(
        'Failed to create CLAUDE.md: ' +
          (err instanceof Error ? err.message : String(err)),
        { variant: 'error' },
      )
    }
  } else {
    print('CLAUDE.md already exists', { variant: 'info' })
  }

  // Create settings.json if it doesn't exist
  if (!existsSync(settingsPath)) {
    const defaultSettings = {
      permissions: {
        allow: [],
        deny: [],
        ask: [],
      },
    }
    try {
      writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2) + '\n', 'utf8')
      print('Created .claude/settings.json', { variant: 'success' })
    } catch (err) {
      print(
        'Failed to create .claude/settings.json: ' +
          (err instanceof Error ? err.message : String(err)),
        { variant: 'error' },
      )
    }
  } else {
    print('.claude/settings.json already exists', { variant: 'info' })
  }

  // Check git integration
  try {
    const gitDir = join(projectRoot, '.git')
    if (existsSync(gitDir)) {
      const gitignorePath = join(projectRoot, '.gitignore')
      const claudeEntry = '.claude/'

      if (existsSync(gitignorePath)) {
        const gitignore = readFileSync(gitignorePath, 'utf8')
        if (!gitignore.includes(claudeEntry)) {
          print(
            'Tip: Add .claude/ to .gitignore to keep session data local',
            { variant: 'info' },
          )
        }
      } else {
        try {
          writeFileSync(gitignorePath, claudeEntry + '\n', 'utf8')
          print('Created .gitignore with .claude/ entry', { variant: 'success' })
        } catch {
          // Ignore gitignore creation failure
        }
      }
    }
  } catch {
    // Git not available - skip
  }

  logForDebugging('Project initialized at: ' + projectRoot)
  print('', { variant: 'default' })
  print('Project initialized for Claude Code!', { variant: 'success' })
  print('Edit CLAUDE.md to describe your project and conventions.', {
    variant: 'info',
  })
}
