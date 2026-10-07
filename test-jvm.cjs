const Docker = require('dockerode');
const fs = require('fs');
const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });

async function run() {
  const container = await docker.createContainer({
    Image: "itzg/minecraft-server",
    Cmd: ["bash", "-c", "echo $JVM_OPTS; java -XX:+PrintFlagsFinal -version | grep -i ignoreworlddata"],
    Env: [
      "EULA=TRUE",
      "JVM_OPTS=-DPaper.IgnoreWorldDataVersion=true"
    ]
  });
  await container.start();
  const stream = await container.logs({ stdout: true, stderr: true, follow: true });
  stream.pipe(process.stdout);
}
run();
