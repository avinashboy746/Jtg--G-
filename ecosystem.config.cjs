module.exports = {
  apps: [
    {
      name: "jtg-panel",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: 6767,
      },
    },
  ],
};
