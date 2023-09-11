/**
 * 匹配中文字符
 */
export function hasChineseCharacter(code) {
  return code && /[\u{4E00}-\u{9FFF}]/gmu.test(code);
}
