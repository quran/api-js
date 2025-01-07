import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJson = fs.readFileSync(
  path.join(__dirname, '../package.json'),
  'utf8'
);
const version = JSON.parse(packageJson).version;

const dist = path.join(__dirname, '../dist');

// replace {{VERSION_TO_REPLACE}} in dist/* with the current version
const files = fs.readdirSync(dist);
files.forEach((file) => {
  const content = fs.readFileSync(path.join(dist, file), 'utf8');
  const newContent = content.replace('{{VERSION_TO_REPLACE}}', version);
  fs.writeFileSync(path.join(dist, file), newContent);
});

// eslint-disable-next-line no-undef
console.log('✅ Version replaced in dist/*');
