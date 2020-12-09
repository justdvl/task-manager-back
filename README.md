# task-manager-back

need to mkdir public folder in top-lvl dir

you need to create .env in main dir with these constants:

SERVER_IP=<your server ip>
NODE_PORT=8080<or your port>

if running on local server, use SERVER_IP=http://localhost:3000

Assuming you are running this at a subfolder of your domain, also add SUBDIRECTORY to .env file, 
such as if you're running react app on domain.com/task_manager, env would be SUBDIRECTORY=/task_manager

You need MongoDB to be running in order to use this app.
on Windows: first run mongod.exe, then cmd as admin, mongo.

for configuration of whole full-stack app, see https://justdvl.medium.com/how-to-install-node-js-663630c7dd4b
