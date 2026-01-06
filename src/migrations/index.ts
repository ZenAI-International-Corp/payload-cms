import * as migration_20251231_032434 from './20251231_032434';
import * as migration_20251231_040008 from './20251231_040008';
import * as migration_20251231_053239 from './20251231_053239';
import * as migration_20260105_093911 from './20260105_093911';
import * as migration_20260106_061506 from './20260106_061506';

export const migrations = [
  {
    up: migration_20251231_032434.up,
    down: migration_20251231_032434.down,
    name: '20251231_032434',
  },
  {
    up: migration_20251231_040008.up,
    down: migration_20251231_040008.down,
    name: '20251231_040008',
  },
  {
    up: migration_20251231_053239.up,
    down: migration_20251231_053239.down,
    name: '20251231_053239',
  },
  {
    up: migration_20260105_093911.up,
    down: migration_20260105_093911.down,
    name: '20260105_093911',
  },
  {
    up: migration_20260106_061506.up,
    down: migration_20260106_061506.down,
    name: '20260106_061506'
  },
];
