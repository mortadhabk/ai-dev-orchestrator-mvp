import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
export async function runAgentContainer(opts) {
    const workspaceHost = `/tmp/workspaces/${opts.jobId}`;
    await mkdir(workspaceHost, { recursive: true });
    const envFlags = Object.entries(opts.env).flatMap(([k, v]) => ['-e', `${k}=${v}`]);
    const args = [
        'run',
        '--rm',
        '-v',
        `${workspaceHost}:/workspace`,
        ...envFlags,
        opts.image,
    ];
    return await new Promise((resolve) => {
        const child = spawn('docker', args, { stdio: ['ignore', 'pipe', 'pipe'] });
        let combined = '';
        child.stdout.on('data', (data) => {
            combined += data.toString();
        });
        child.stderr.on('data', (data) => {
            combined += data.toString();
        });
        child.on('close', (code) => {
            resolve({ success: code === 0, output: combined.trim() });
        });
    });
}
