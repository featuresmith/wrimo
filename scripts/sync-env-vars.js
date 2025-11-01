#!/usr/bin/env node
/**
 * Sync environment variables from .env to .dev.vars
 * This allows you to manage all env vars in .env and automatically
 * create .dev.vars for Cloudflare Workers backend
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env');
const devVarsPath = join(process.cwd(), '.dev.vars');

// Variables to sync (without VITE_ prefix)
const varsToSync = ['AUTH0_DOMAIN', 'AUTH0_AUDIENCE'];

if (!existsSync(envPath)) {
  console.error('❌ .env file not found');
  console.error(`   Expected at: ${envPath}`);
  process.exit(1);
}

try {
  const envContent = readFileSync(envPath, 'utf-8');
  const envLines = envContent.split('\n');
  
  const envVars = {};
  envLines.forEach((line, index) => {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        envVars[key.trim()] = value.trim();
      } else if (key && !trimmed.includes('=')) {
        console.warn(`⚠️  Skipping malformed line ${index + 1}: ${trimmed}`);
      }
    }
  });

  // Build .dev.vars content
  let devVarsContent = `# Auto-generated from .env
# Do not edit manually - run: pnpm sync-env
# This file is gitignored and used by Cloudflare Workers

`;

  let foundAny = false;
  varsToSync.forEach(varName => {
    // Try both with and without VITE_ prefix
    const value = envVars[varName] || envVars[`VITE_${varName}`];
    if (value) {
      devVarsContent += `${varName}=${value}\n`;
      foundAny = true;
    } else {
      console.warn(`⚠️  Variable not found: ${varName} or VITE_${varName}`);
    }
  });

  if (!foundAny) {
    console.error('❌ No matching variables found in .env');
    console.error(`   Looking for: ${varsToSync.join(', ')} or VITE_${varsToSync.join(', VITE_')}`);
    process.exit(1);
  }

  writeFileSync(devVarsPath, devVarsContent);
  console.log('✅ Synced .env → .dev.vars');
  console.log(`   Created/updated: ${devVarsPath}`);
  console.log(`   Synced variables: ${varsToSync.join(', ')}`);
} catch (error) {
  console.error('❌ Error syncing env vars:', error.message);
  process.exit(1);
}

