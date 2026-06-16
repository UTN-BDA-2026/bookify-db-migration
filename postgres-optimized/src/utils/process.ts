import { spawn } from "node:child_process";

export function runCommand(
  command: string,
  args: string[],
  options?: { env?: NodeJS.ProcessEnv }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: options?.env ?? process.env
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code ?? -1}`));
    });
    child.on("error", reject);
  });
}
