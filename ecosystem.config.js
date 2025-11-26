module.exports = {
  apps: [
    {
      name: "wisma-web",
      cwd: __dirname,
      script: "npm",
      args: "run start",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "wisma-python",
      cwd: __dirname + "/python-script",
      script: "python",
      args: "app/main.py",
      interpreter: "python",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
