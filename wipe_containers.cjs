const Docker = require('dockerode');
const fs = require('fs');
const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });

async function run() {
  const containers = await docker.listContainers({all: true});
  for (const c of containers) {
    if (c.Names[0].startsWith('/jtg-server-')) {
      const container = docker.getContainer(c.Id);
      console.log('Removing container', c.Id);
      try { await container.stop(); } catch(e) {}
      await container.remove();
    }
  }
}
run();
