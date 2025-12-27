module.exports = {
  apps: [
    {
      name: 'nextjs-5031',
      script: 'node_modules/.bin/next',
      args: 'dev',
      cwd: '/home/usr1/code/arorarealtech/nextjsaroradotcom',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        PORT: 5031,
        NODE_ENV: 'development'
      }
    },
    {
      name: 'nextjs-5032',
      script: 'node_modules/.bin/next',
      args: 'dev',
      cwd: '/home/usr1/code/arorarealtech/nextjsaroradotcom',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        PORT: 5032,
        NODE_ENV: 'development'
      }
    }
  ]
};
