#### Radarr on Alpine
`docker exec -it radarr sh`\
`apk add nodejs && apk add npm`\
`npm -v && node -v`\
`exit`
#### Sonarr on Ubuntu
`docker exec -it sonarr sh`\
`cd ~`\
`curl -sL https://deb.nodesource.com/setup_18.x -o /tmp/nodesource_setup.sh`\
`bash /tmp/nodesource_setup.sh`\
`apt-get install -y nodejs`\
`node -v && npm -v`\
`exit`
