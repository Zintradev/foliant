const fs = require('fs');

// Read the new version that npm just updated in package.json
const pkg = require('./package.json');
const version = pkg.version;

// Update tauri.conf.json
const tauriPath = './src-tauri/tauri.conf.json';
let tauriConf = fs.readFileSync(tauriPath, 'utf8');
tauriConf = tauriConf.replace(/"version":\s*".*"/, `"version": "${version}"`);
fs.writeFileSync(tauriPath, tauriConf);

// Update Cargo.toml
const cargoPath = './src-tauri/Cargo.toml';
let cargoToml = fs.readFileSync(cargoPath, 'utf8');
cargoToml = cargoToml.replace(/^version\s*=\s*".*"/m, `version = "${version}"`);
fs.writeFileSync(cargoPath, cargoToml);

console.log(`Successfully synced: version ${version} in Tauri and Cargo.`);