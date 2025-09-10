# fragments
## Running the Server

### Prerequisites
- Node.js ≥ 20 (Node 24+ recommended; uses built-in `--watch` and `--env-file`)
- npm (comes with Node)
- VS Code with ESLint extension installed
- `jq` (for pretty JSON output in terminal)

### Install Dependencies
```bash
npm install


Scripts
Lint
npm run lint
Runs ESLint on ./src/**/*.js. 
Fix all issues until no errors are reported.



Start (normal mode)
npm start
Starts the server normally.
Browser: open http://localhost:8080
Terminal: curl -s http://localhost:8080 | jq


Dev (watch mode + env file)
npm run dev
Uses Node’s built-in --watch and loads environment variables from debug.env.
Example debug.env file:
LOG_LEVEL=debug


Debug (watch + env + inspector)
npm run debug
Same as dev, but also starts the Node inspector on port 9229, so you can attach VS Code’s debugger.


VS Code Debugging
Add a .vscode/launch.json file with the following content:

{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug via npm run debug",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run-script", "debug"],
      "skipFiles": ["<node_internals>/**"],
      "type": "node"
    }
  ]
}


To test debugging:
Open src/app.js
Set a breakpoint at line:
res.status(200).json({


Run Debug via npm run debug in VS Code
Visit http://localhost:8080
 → VS Code will pause on your breakpoint


Headers Check
Response headers should include:
Cache-Control: no-cache
Access-Control-Allow-Origin: *
Check with Chrome DevTools (Network tab → Headers) or in terminal:
curl -i http://localhost:8080



Conditional Env Dump (debug mode only)
In src/server.js, environment variables are logged only if LOG_LEVEL=debug:
if ((process.env.LOG_LEVEL || '').toLowerCase() === 'debug') {
  const logger = require('./logger');
  logger.debug({ env: process.env }, 'process.env');
}
Run:
npm run dev
You will see a JSON dump of process.env in the terminal
