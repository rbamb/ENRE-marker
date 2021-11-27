/** To publish ENRE-marker to the remote registry,
 * run `npm run publish`,
 * NOT `npm publish`, which won't publish to private registry
 * (this behavior has been blocked by setting `private` to true in package.json)
*/

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const publishPath = path.resolve(__dirname, '..', 'publish');
const mainPath = path.resolve(__dirname, '..');

try {
  fs.rmSync(publishPath, { recursive: true, force: true });
} catch (e) {
  console.log(e);
  return -1;
}

fs.mkdirSync(publishPath);


const pkg = require('../package.json');

pkg.files = [
  'extension.vsix',
  'CHANGELOG.md',
];

delete pkg.devDependencies;
delete pkg.scripts;
delete pkg.private;

const newPkg = fs.openSync(path.resolve(publishPath, 'package.json'), 'w');

fs.writeFileSync(newPkg, JSON.stringify(pkg));

fs.copyFileSync(
  path.resolve(mainPath, 'README.md'),
  path.resolve(publishPath, 'README.md'),
);

fs.copyFileSync(
  path.resolve(mainPath, 'CHANGELOG.md'),
  path.resolve(publishPath, 'CHANGELOG.md'),
);

console.log('Using vsce to package extension...')
execSync(
  `npx vsce package -o ${path.resolve(publishPath, 'extension.vsix')}`,
  {
    cwd: mainPath,
  },
)

console.log('Publishing to remote registry...')
try {
  execSync(
    'npm publish',
    {
      cwd: publishPath,
      timeout: 60000,
    },
  )
} catch (e) {
  console.log('Unable to publish, maybe a network connectivity issue');
  return -1;
}

console.log('Done');
