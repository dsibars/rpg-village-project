import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';

export default {
  packagerConfig: {
    asar: true,
    icon: './assets/icon',
    ignore: [
      /^\/out($|\/)/,
      /^\/\.git($|\/)/,
      /^\/tests($|\/)/,
      /^\/\.github($|\/)/,
      /^\/rpg-village-windows\.zip$/,
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ['darwin', 'linux', 'win32']),
    new MakerDeb({}),
    new MakerRpm({}),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
  ],
};
