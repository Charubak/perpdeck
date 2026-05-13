import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const dir = dirname(fileURLToPath(import.meta.url));
// Load .env.local from repo root — silently skips if file doesn't exist
config({ path: join(dir, '../../../.env.local'), override: false });
config({ path: join(dir, '../../../.env'), override: false });
