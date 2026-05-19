module.exports = {
  apps: [{
      "name": "navigation-site",
      "script": "./nav/server/index.mjs",
      "args": "start",
      "cwd": "./",
      "instances": 1,
      "autorestart": true,
      "watch": false,
      "max_memory_restart": "1G",
      "env": {
        "NODE_ENV": "production",
        "PORT": "8991",
        "NUXT_MYSQL_HOST": "127.0.0.1",
        "NUXT_MYSQL_PORT": "3306",
        "NUXT_MYSQL_USER": "your_mysql_user",
        "NUXT_MYSQL_PASSWORD": "your_mysql_password",
        "NUXT_MYSQL_DATABASE": "your_database_name",
        "NUXT_PUBLIC_SITE_NAME": "非乐鱼导航",
        "NUXT_PUBLIC_SITE_URL": "https://your-domain.com"
      },
      "error_file": "./logs/pm2-error.log",
      "out_file": "./logs/pm2-out.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z"
    }]
}