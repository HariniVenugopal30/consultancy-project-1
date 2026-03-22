import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { execSync, spawn } from 'node:child_process';

function getListeningPidsForPort(port) {
	try {
		const output = execSync('netstat -ano', { encoding: 'utf8' });
		const lines = output.split(/\r?\n/);
		const pids = new Set();

		for (const line of lines) {
			if (!line.includes('LISTENING')) {
				continue;
			}

			if (!line.includes(`:${port}`)) {
				continue;
			}

			const parts = line.trim().split(/\s+/);
			const pid = Number(parts[parts.length - 1]);
			if (Number.isInteger(pid) && pid > 0) {
				pids.add(pid);
			}
		}

		return [...pids];
	} catch {
		return [];
	}
}

function killPid(pid) {
	try {
		execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
	} catch {
		// Ignore if process exits before kill or is inaccessible.
	}
}

function cleanupWindowsDevConflicts() {
	for (const port of [3000, 3001]) {
		const pids = getListeningPidsForPort(port);
		for (const pid of pids) {
			killPid(pid);
		}
	}
}

function removeStaleLock() {
	const lockPath = join(process.cwd(), '.next', 'dev', 'lock');
	if (existsSync(lockPath)) {
		rmSync(lockPath, { force: true });
	}
}

if (process.platform === 'win32') {
	cleanupWindowsDevConflicts();
}

removeStaleLock();

const nextBin = join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(process.execPath, [nextBin, 'dev', '--webpack', '-p', '3000'], {
	stdio: 'inherit',
	env: process.env,
});

child.on('exit', (code, signal) => {
	if (signal) {
		process.kill(process.pid, signal);
		return;
	}

	process.exit(code ?? 0);
});
