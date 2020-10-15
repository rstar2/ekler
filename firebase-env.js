#!/usr/bin/env node

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { spawn } = require('child_process');

// NOTE!!! firebase is reserved namespace - e.g. cannot have secret-token "firebase.xxx"
const skipMain = ['firebase', 'cli'];
/**
 * Convert environment variable names of the type "VUE_APP_CLOUDINARY_CLOUD_NAME" to "cloudinary.cloudname"
 * according to the Firebase env specification (only lower case keys are allowed)
 * @param {String} key
 */
const sanitizeKey = key => {
  const tokens = key
    .replace('VUE_APP_', '')
    .replace('SERVER_APP_', '')
    .replace('FIREBASE_COLL_', 'DB_COLL_')
    .toLowerCase()
    .split('_');
  const main = tokens[0];
  if (tokens.length === 1) return main;

  tokens.splice(0, 1);

  if (skipMain.includes(main)) return null;

  return main + '.' + tokens.join('');
};

/**
 *
 * @param {Map} envs
 */
const setEnvs = envs => {
  const envsConfig = [];
  envs.forEach((value, key) => {
    key = sanitizeKey(key);

    if (!key) return;

    console.log('Set Env:', key, '->', value);
    envsConfig.push(`${key}=${value}`);
  });

  // execute:
  // firebase functions:config:set someservice.key="THE API KEY" someservice.id="THE CLIENT ID"
  const child = spawn('firebase', ['functions:config:set', ...envsConfig], {
    stdio: 'inherit',
    shell: true
  });
  child.on('exit', function(code, signal) {
    if (code !== 0) {
      console.error('Failed to set environment variables for Firebase functions, exit code:', code);
    } else {
      console.log('Successfully set environment variables for Firebase functions');
    }
  });
};

/**
 *
 * @param {String} path
 * @return {Promise<Map<String, String>>}
 */
const readFile = path => {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(path)
    });

    const envs = new Map();
    rl.on('line', (/* String */ line) => {
      line = line.trim();
      // skip empty and comment lines
      if (!line || line.startsWith('#')) return;
      const tokens = line.split('=');

      if (tokens.length !== 2) {
        console.warn('Cannot parse env variable from line:', line);
        return;
      }
      envs.set(tokens[0].trim(), tokens[1].trim());
    });
    rl.on('close', () => resolve(envs));
    rl.on('error', error => reject(error));
  });
};

Promise.all(
  ['.env', '.env.local', '.env.production.local']
    .map(name => path.join(__dirname, name))
    .filter(fs.existsSync)
    .map(readFile)
)
  .then(envsArr => {
    // allow overwriting of env variable when present in more than on file
    // so that the last one to be set
    return envsArr.reduce((all, envs) => {
      envs.forEach((value, key) => all.set(key, value));
      return all;
    }, new Map());
  })
  .then(setEnvs);
