import * as fs from 'fs';
import * as path from 'path';

const appDir = path.resolve(__dirname, '../../app');

const expectedScreens = [
  '(tabs)/build.tsx',
  '(tabs)/moments.tsx',
  '(tabs)/leagues.tsx',
  '(tabs)/profile.tsx',
  'catalog/[fixtureId].tsx',
  'microflow/_layout.tsx',
  'microflow/player.tsx',
  'microflow/timing.tsx',
  'onboarding.tsx',
];

describe('Screen files', () => {
  it.each(expectedScreens)('%s exists and exports a default component', (screenPath) => {
    const fullPath = path.join(appDir, screenPath);
    expect(fs.existsSync(fullPath)).toBe(true);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(path.join(appDir, screenPath));
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});

