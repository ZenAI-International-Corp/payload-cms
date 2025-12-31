import * as migration_20251231_032434 from './20251231_032434';
import * as migration_20251231_040008 from './20251231_040008';

export const migrations = [
  {
    up: migration_20251231_032434.up,
    down: migration_20251231_032434.down,
    name: '20251231_032434',
  },
  {
    up: migration_20251231_040008.up,
    down: migration_20251231_040008.down,
    name: '20251231_040008'
  },
];
