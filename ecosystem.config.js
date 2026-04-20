module.exports = {
  apps: [{
    name: 'navigation-site',
    cwd: './apps/web',
    script: './.output/server/index.mjs',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
