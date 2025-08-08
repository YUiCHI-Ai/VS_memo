/**
 * Launch VS Code Extension Development Host for this project via CLI.
 * Will try 'code' CLI, then platform-specific fallbacks (macOS 'open -a "Visual Studio Code" --args ...').
 * Also ensures TS build exists.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

function run(cmd, args = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const cp = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
    cp.on('error', reject);
    cp.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`))));
  });
}

async function tryCodeCli(args) {
  const candidates = ['code', 'code-insiders'];
  for (const c of candidates) {
    try {
      await run(c, ['-v']);
      console.log(`[devhost] Using CLI: ${c}`);
      await run(c, args);
      return true;
    } catch {}
  }
  return false;
}

async function tryMacOpen(args) {
  if (process.platform !== 'darwin') return false;
  const apps = ['Visual Studio Code', 'Visual Studio Code - Insiders'];
  for (const app of apps) {
    try {
      console.log(`[devhost] Trying macOS app: ${app}`);
      await run('open', ['-n', '-a', app, '--args', ...args]);
      return true;
    } catch {}
  }
  return false;
}

async function tryWindowsExe(args) {
  if (process.platform !== 'win32') return false;
  const local = process.env.LOCALAPPDATA || '';
  const candidates = [
    path.join(local, 'Programs', 'Microsoft VS Code', 'Code.exe'),
    path.join(local, 'Programs', 'Microsoft VS Code Insiders', 'Code - Insiders.exe'),
  ];
  for (const exe of candidates) {
    if (existsSync(exe)) {
      try {
        console.log(`[devhost] Using Windows EXE: ${exe}`);
        await run(`"${exe}"`, args);
        return true;
      } catch {}
    }
  }
  return false;
}

async function tryLinuxCode(args) {
  if (process.platform !== 'linux') return false;
  const candidates = ['/usr/bin/code', '/usr/share/code/code', '/var/lib/snapd/snap/bin/code'];
  for (const exe of candidates) {
    if (existsSync(exe)) {
      try {
        console.log(`[devhost] Using Linux binary: ${exe}`);
        await run(exe, args);
        return true;
      } catch {}
    }
  }
  return false;
}

async function ensureBuild() {
  const outMain = path.join(root, 'out', 'extension.js');
  if (!existsSync(outMain)) {
    console.log('[devhost] out/extension.js not found. Running compile...');
    await run('npm', ['run', 'compile'], { cwd: root });
  }
}

async function main() {
  try {
    await ensureBuild();

    // Print extension info
    try {
      const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
      console.log(`[devhost] Launching Extension Development Host for ${pkg.displayName || pkg.name} ${pkg.version || ''}`);
    } catch {}

    const args = [
      '--new-window',
      `--extensionDevelopmentPath=${root}`,
    ];

    // Try code CLI -> mac fallback -> win -> linux
    if (
      (await tryCodeCli(args)) ||
      (await tryMacOpen(args)) ||
      (await tryWindowsExe(args)) ||
      (await tryLinuxCode(args))
    ) {
      console.log('[devhost] Extension Development Host launched.');
      return;
    }

    // Final guidance
    console.error('[devhost] Could not launch VS Code automatically.');
    if (process.platform === 'darwin') {
      console.error('Hint (macOS): Run this manually:');
      console.error(`  open -n -a "Visual Studio Code" --args ${args.map(a => `"${a}"`).join(' ')}`);
    } else if (process.platform === 'win32') {
      console.error('Hint (Windows): Ensure "code" is in PATH or run VS Code and press F5 to debug.');
    } else {
      console.error('Hint (Linux): Ensure "code" (VS Code) is installed and available in PATH.');
    }
    process.exit(2);
  } catch (err) {
    console.error('[devhost] Error:', err.message || err);
    process.exit(1);
  }
}

main();