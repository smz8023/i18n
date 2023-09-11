import { parse as vueParser } from '@vue/compiler-sfc';
import { parse as babelParser } from '@babel/parser';

export function parseVue(code) {
  return vueParser(code).descriptor;
}

export function parseJS(code) {
  return babelParser(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });
}
