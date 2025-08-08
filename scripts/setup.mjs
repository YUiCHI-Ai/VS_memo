/**
 * One-shot setup script for Prompt Memo VS Code extension.
 *
 * Usage:
 *   npm run setup                 # install deps if needed + compile
 *   npm run setup -- --devhost    # install + compile + launch Extension Development Host
 *
 * Related:
 *   npm start                     # launch Extension Development Host (alias of devhost)
 *   npm run package               # create VSIX via vsce
 *   npm run package:install       # create VSIX then install into your VS Code
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

function run(cmd, args = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const cp = spawn(cmd, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      cwd: root,
      ...opts
    });
    cp.on('error', reject);
    cp.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`))));
  });
}

async function ensureInstall() {
  const hasNodeModules = existsSync(path.join(root, 'node_modules'));
  if (hasNodeModules) {
    console.log('[setup] node_modules detected. Skipping npm install.');
    return;
  }
  console.log('[setup] Installing dependencies (npm install)...');
  await run('npm', ['install']);
}

async function compile() {
  console.log('[setup] Compiling TypeScript (npm run compile)...');
  await run('npm', ['run', 'compile']);
}

async function devhost() {
  console.log('[setup] Launching Extension Development Host...');
  // Use the provided devhost script for consistency
  const scriptPath = path.join(root, 'scripts', 'devhost.mjs');
  await run(process.execPath, [scriptPath]);
}

async function main() {
  const args = process.argv.slice(2);
  const autoDevhost = args.includes('--devhost');

  try {
    console.log('[setup] Project root:', root);
    await ensureInstall();
    await compile();

    console.log('[setup] Setup completed.');
    if (autoDevhost) {
      await devhost();
    } else {
      console.log('');
      console.log('Next steps:');
      console.log('  - Start Dev Host:  npm start');
      console.log('  - Package VSIX:    npm run package');
      console.log('  - Install VSIX:    npm run package:install');
      console.log('');
      console.log('Tip: To run everything at once:');
      console.log('  npm run setup -- --devhost');
    }
  } catch (err) {
    console.error('[setup] Error:', err?.message || err);
    process.exit(1);
  }
}

main();