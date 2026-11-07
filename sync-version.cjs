const fs = require('fs');

const pkg = require('./package.json');
const fullVersion = pkg.version;

const cleanVersion = fullVersion.split('-')[0];

const tauriPath = './src-tauri/tauri.conf.json';
let tauriConf = fs.readFileSync(tauriPath, 'utf8');
tauriConf = tauriConf.replace(/"version":\s*".*"/, `"version": "${cleanVersion}"`);
fs.writeFileSync(tauriPath, tauriConf);

const cargoPath = './src-tauri/Cargo.toml';
let cargoToml = fs.readFileSync(cargoPath, 'utf8');
cargoToml = cargoToml.replace(/^version\s*=\s*".*"/m, `version = "${cleanVersion}"`);
fs.writeFileSync(cargoPath, cargoToml);

console.log(`Sincronizado: Node (${fullVersion}) -> Tauri/Cargo (${cleanVersion})`);