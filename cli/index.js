const path = require('path');
const dotenv = require('dotenv');

// load all needed env files
['.env', '.env.local'].forEach(name => dotenv.config({ path: path.resolve(__dirname, '../', name) }));

const argv = require('minimist')(process.argv.slice(2));
const command = argv._[0];

(async () => {
  try {
    if (!command) throw new Error('No command');

    if (command.startsWith('db-')) {
      await require('./db')(command.substr('db-'.length), argv);
    } else {
      // for now no other possible CLI commands
      throw new Error(`Unknown command ${command}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
