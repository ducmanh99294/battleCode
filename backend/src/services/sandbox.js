const { spawn } = require("child_process");

let pyProcess = null;

function startRunner() {
  pyProcess = spawn("docker", [
    "run",
    "-i",
    "--rm",
    "--memory=100m",
    "--cpus=0.5",
    "--network=none",
    "python-sandbox"
  ]);

  pyProcess.stdout.on("data", (data) => {
    console.log("PYTHON:", data.toString());
  });

  pyProcess.stderr.on("data", (data) => {
    console.error("PYTHON ERROR:", data.toString());
  });

  pyProcess.on("exit", () => {
    console.log("⚠️ Python runner stopped → restarting...");
    startRunner();
  });
}

// 🚀 gửi code vào container
function runCode(code, state) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ code, state }) + "\n";

    pyProcess.stdin.write(payload);

    pyProcess.stdout.once("data", (data) => {
      try {
        const result = JSON.parse(data.toString());
        resolve(result);
      } catch {
        resolve({ error: "Invalid response" });
      }
    });
  });
}

module.exports = {
  startRunner,
  runCode
};