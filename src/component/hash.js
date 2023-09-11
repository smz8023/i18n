import {
  createHash,
} from 'node:crypto';

export function generateHash(char) {
  const hash = createHash('md5');
  hash.update(char);
  return hash.digest('hex').slice();
}
