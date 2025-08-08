/**
 * Install the newest VSIX into your regular VS Code.
 * Usage:
 *   npm run install:vsix
 *
 * Strategy:
 *  - Find the most recent *.vsix in repo root
 *  - Try 'code' CLI; if missing, fallback per-OS:
 *      - macOS: open -a "Visual Studio Code" --args --install-extension ...
 *      - Windows: invoke Code.exe if found
 *      - Linux: try common code binaries
 */
import { promises as fs } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

async function tryCodeCliInstall(vsixPath) {
  const candidates = ['code', 'code-insiders'];
  for (const c of candidates) {
    try {
      await run(c, ['-v']);
      console.log(`[install-vsix] Using CLI: ${c}`);
      await run(c, ['--install-extension', vsixPath]);
      return true;
    } catch {}
  }
  return false;
}

async function tryMacOpenInstall(vsixPath) {
  if (process.platform !== 'darwin') return false;
  const apps = ['Visual Studio Code', 'Visual Studio Code - Insiders'];
  for (const app of apps) {
    try {
      console.log(`[install-vsix] macOS fallback via: ${app}`);
      await run('open', ['-a', app, '--args', '--install-extension', vsixPath]);
      return true;
    } catch {}
  }
  return false;
}

async function tryWindowsExeInstall(vsixPath) {
  if (process.platform !== 'win32') return false;
  const local = process.env.LOCALAPPDATA || '';
  const candidates = [
    path.join(local, 'Programs', 'Microsoft VS Code', 'Code.exe'),
    path.join(local, 'Programs', 'Microsoft VS Code Insiders', 'Code - Insiders.exe'),
  ];
  for (const exe of candidates) {
    if (await existsFile(exe)) {
      try {
        console.log(`[install-vsix] Windows EXE: ${exe}`);
        await run(`"${exe}"`, ['--install-extension', vsixPath]);
        return true;
      } catch {}
    }
  }
  return false;
}

async function tryLinuxInstall(vsixPath) {
  if (process.platform !== 'linux') return false;
  const candidates = ['/usr/bin/code', '/usr/share/code/code', '/var/lib/snapd/snap/bin/code'];
  for (const exe of candidates) {
    if (await existsFile(exe)) {
      try {
        console.log(`[install-vsix] Linux binary: ${exe}`);
        await run(exe, ['--install-extension', vsixPath]);
        return true;
      } catch {}
    }
  }
  return false;
}

async function existsFile(p) {
  try {
    const stat = await fs.stat(p);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function findLatestVsix(dir) {
  const files = await fs.readdir(dir);
  const vsix = [];
  for (const f of files) {
    if (f.toLowerCase().endsWith('.vsix')) {
      const stat = await fs.stat(path.join(dir, f));
      if (stat.isFile()) {
        vsix.push({ file: f, mtimeMs: stat.mtimeMs });
      }
    }
  }
  if (vsix.length === 0) return null;
  vsix.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return path.join(dir, vsix[0].file);
}

async function main() {
  try {
    const vsixPath = await findLatestVsix(root);
    if (!vsixPath) {
      console.error('[install-vsix] No .vsix found in project root. Run "npm run package" first.');
      process.exit(2);
    }

    console.log('[install-vsix] Installing:', vsixPath);

    if (
      (await tryCodeCliInstall(vsixPath)) ||
      (await tryMacOpenInstall(vsixPath)) ||
      (await tryWindowsExeInstall(vsixPath)) ||
      (await tryLinuxInstall(vsixPath))
    ) {
      console.log('[install-vsix] Installed. If prompted in VS Code, click "Reload".');
      return;
    }

    console.error('[install-vsix] Could not invoke VS Code to install the VSIX automatically.');
    if (process.platform === 'darwin') {
      console.error('Hint (macOS):');
      console.error(`  open -a "Visual Studio Code" --args --install-extension "${vsixPath}"`);
      console.error('Or open VS Code → Extensions view → "..." → Install from VSIX…');
    } else if (process.platform === 'win32') {
      console.error('Hint (Windows): ensure "code" is in PATH, or open VS Code and use "Install from VSIX..." from the Extensions menu.');
    } else {
      console.error('Hint (Linux): ensure "code" is available in PATH, or install via the Extensions UI.');
    }
    process.exit(3);
  } catch (err) {
    console.error('[install-vsix] Error:', err?.message || err);
    process.exit(1);
  }
}

main();