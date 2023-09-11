/* eslint-disable*/
import traverse from '@babel/traverse';
import * as t from '@babel/types';
// import path, { resolve } from 'path';
import { parseVue, parseJS } from './parse.js';
import {
  generateTemplate,
  generateJS,
  generateInterpolation,
  generateSfc,
} from './generator.js';
import { hasChineseCharacter } from './utils.js';
import { generateHash } from './hash.js';
import { FileType, NodeTypes } from './typings.js';
import translateCNToUS from './cnTous.js'
function createDirectiveAttr(type, name, value) {
  // 处理特殊的事件属性
  if (type === 'on') {
    return {
      name: 'on',
      type: NodeTypes.DIRECTIVE,
      loc: {
        source: `@${name}="${value}"`,
      },
    };
  }

  return {
    name: 'bind',
    type: NodeTypes.DIRECTIVE,
    loc: {
      source: `:${name}="${value}"`,
    },
  };
}

function createInterpolationNode(content) {
  return {
    type: NodeTypes.INTERPOLATION,
    loc: {
      source: `{{ ${content} }}`,
    },
  };
}


class Transformer {
  // 转换后的代码
  // result = '';

  // 提取的中文键值对
  // locales= {};

  // sourceCode =  '';


  // importVar = 'I18N';

  // importPath = '';

  constructor({
    code,
    fileType
  }) {
    this.sourceCode = code;
    this.result = code;
    this.locales = {};
    // this.importPath = importPath;
    this.fileType = fileType || '.vue';
    // this.startTransform();
  }

  startTransform () {
    if (hasChineseCharacter(this.sourceCode)) {
      if (
        this.fileType === FileType.JS
        && this.hasChineseCharacterInJS(this.sourceCode)
      ) {
        this.result = generateJS(this.transformJS(this.sourceCode));
      } else if (this.fileType === FileType.VUE) {
        const descriptor = parseVue(this.sourceCode);
        if (
          descriptor?.template?.content
          && hasChineseCharacter(descriptor?.template?.content)
        ) {
          const _ast = this.transformTemplate(descriptor?.template?.ast)
          console.log('_ast', _ast);
          descriptor.template.content = generateTemplate({
            ..._ast,
            tag: '',
          });
        }

        if (
          descriptor?.script?.content
        ) {
          descriptor.script.content = generateJS(
            this.transformJS(descriptor.script.content),
          );
        } else if (
          descriptor?.scriptSetup?.content
        ) {
          descriptor.scriptSetup.content = generateJS(
            this.transformJS(descriptor.scriptSetup.content, false, true),
          );
        }

        this.result = generateSfc(descriptor);
      }
    }
  }

  hasChineseCharacterInJS(code) {
    let result = false;
    traverse(parseJS(code), {
      enter: (nodePath) => {
        if (
          nodePath.node.type === 'StringLiteral'
          && hasChineseCharacter(nodePath.node.extra?.rawValue)
        ) {
          nodePath.stop();
          result = true;
        }

        if (
          nodePath.node.type === 'TemplateLiteral'
          && nodePath.node.quasis.some((q) => hasChineseCharacter(q.value.cooked))
        ) {
          nodePath.stop();
          result = true;
        }

        if (
          nodePath.node.type === 'JSXText'
          && hasChineseCharacter(nodePath.node.value)
        ) {
          nodePath.stop();
          result = true;
        }
      },
    });

    return result;
  }

  /**
   * 转换template节点
   */
  transformTemplate (ast) {
    /**
     * this is a hack
     * FIXME:指定 v-pre 的元素的属性及其子元素的属性和插值语法都不需要解析，
     * 但是 @vue/compiler-sfc 解析后的props中不会包含 v-pre 的属性名，所以这里暂时使用正则表达式匹配v-pre，并生动注入 v-pre 到 props 中
     * https://github.com/vuejs/vue-next/issues/4975
     */
    if (
      ast.type === 1
      && /^<+?[^>]+\s+(v-pre)[^>]*>+?[\s\S]*<+?\/[\s\S]*>+?$/gm.test(
        ast.loc.source,
      )
    ) {
      ast.props = [
        {
          type: 7,
          name: 'pre',
          // @ts-expect-error 类型“{ source: string; }”缺少类型“SourceLocation”中的以下属性: start, endts(2739)
          loc: {
            source: 'v-pre',
          },
        },
      ];
      return ast;
    }

    if (ast.props.length) {
      // @ts-expect-error 类型“{ name: string; type: number; loc: { source: string; }; }”缺少类型“DirectiveNode”中的以下属性: exp, arg, modifiersts(2322)
      ast.props = ast.props.map((prop) => {
        // vue指令
        if (
          prop.type === 7
          && hasChineseCharacter((prop.exp)?.content)
        ) {
          const jsCode = generateInterpolation(
             this.transformJS((prop.exp)?.content, true),
          );
          return createDirectiveAttr(
            prop.name,
            (prop.arg)?.content,
            jsCode,
          );
        }
        // 普通属性
        if (prop.type === 6 && hasChineseCharacter(prop.value?.content)) {
          const localeKey =  this.extractChar(prop.value.content);
          return createDirectiveAttr('bind', prop.name, `pageText['${localeKey}']`);
        }

        return prop;
      });
    }

    if (ast.children.length) {
      // @ts-expect-error 类型“{ type: number; loc: { source: string; }; }”缺少类型“TextCallNode”中的以下属性: content, codegenNodets(2322)
      ast.children =  ast.children.map((child) => {
        if (child.type === 2 && hasChineseCharacter(child.content)) {
          const localeKey =this.extractChar(child.content);
          // return 'xxx'
          return createInterpolationNode(`pageText['${localeKey}']`);
        }

        // 插值语法，插值语法的内容包含在child.content内部，如果匹配到中文字符，则进行JS表达式解析并替换
        if (
          child.type === 5
          && hasChineseCharacter((child.content)?.content)
        ) {
          const jsCode = generateInterpolation(
            this.transformJS(
              (child.content)?.content,
              true,
            ),
          );
          return createInterpolationNode(jsCode);
        }

        // 元素
        if (child.type === 1) {
          const _child = this.transformTemplate(child);
          return _child
        }

        return child;
      });
    }

    return ast;
  };

  transformJS (code, isInTemplate, isScriptSetup) {
    const ast = parseJS(code);
    // let shouldImportVar = false;
    
    const visitor = {
      Program (nodePath) {
        console.log('nodePath', nodePath)
        if (nodePath.node.body.length > 1) {
          nodePath.node.body.unshift(...[t.importDeclaration(
            [t.importDefaultSpecifier(t.identifier('i18n'))],
            t.stringLiteral('./i18n.js'),
          ),
          t.importDeclaration(
            [t.importDefaultSpecifier(t.identifier('{getLanguage}'))],
            t.stringLiteral('fe-coms/utils/i18n/index.js'),
          )
        ])
        }
      },
      // ImportDeclaration: {
      //   exit: (nodePath)=> {
      //     console.log('nodePath', nodePath);
      //   }
      // },
      // 字符串
      StringLiteral: {
        exit: (nodePath) => {
          if (hasChineseCharacter(nodePath.node.extra?.rawValue)) {
              const localeKey = this.extractChar(
                nodePath.node.extra?.rawValue,
              )
              if (this.fileType === FileType.JS) {
                shouldImportVar = true;
                nodePath.replaceWith(
                  t.memberExpression(
                    t.memberExpression(t.identifier('pageText')),
                    t.identifier('"'+localeKey+'"')),
                    true
                );
              } else if (this.fileType === FileType.VUE) {
                if (isInTemplate) {
                  nodePath.replaceWith(
                    t.memberExpression(t.identifier('pageText'), 
                      t.identifier("'"+localeKey+"'"),
                      true
                    ),
                  );
                } else {
                  if (nodePath.container.type === 'JSXAttribute') {
                    if (isScriptSetup) {
                      nodePath.container.value = t.jsxExpressionContainer(t.memberExpression(t.identifier('pageText'), t.identifier('"'+localeKey+'"'), true));
                    } else {
                      nodePath.container.value = t.jsxExpressionContainer(t.memberExpression( t.memberExpression(t.thisExpression(),t.identifier('pageText')), t.identifier('"'+localeKey+'"'), true));
                    }
                  } else {
                   // js 字符串
                   if (isScriptSetup) {
                    nodePath.replaceWith(
                      t.memberExpression(
                        t.identifier('pageText'),
                        t.identifier('"'+localeKey+'"'),
                        true
                      ),
                    )
                   } else {
                      nodePath.replaceWith(
                        t.memberExpression(
                          t.memberExpression(t.thisExpression(), t.identifier('pageText')),
                          t.identifier('"'+localeKey+'"'),
                          true
                          ),
                      )
                    }
                  }
                }
              }
          }
        },
      },
      // 模版字符串
      TemplateLiteral: {
        exit: (nodePath) => {
          // 检测模板字符串内部是否含有中文字符
          if (
            nodePath.node.quasis.some((q) => hasChineseCharacter(q.value.cooked))
          ) {
            // 生成替换字符串，注意这里不需要过滤quasis里的空字符串
            const replaceStr = nodePath.node.quasis
              .map((q) => q.value.cooked)
              .join(``) + `${nodePath.node.expressions.map(exp=>`{${exp.name}}`).join('')}`;
            
              const localeKey = this.extractChar(replaceStr)
                const isIncludeInterpolation = !!nodePath.node.expressions?.length;
                if (this.fileType === FileType.JS) {
                  shouldImportVar = true;
                  if (isIncludeInterpolation) {
                    if (isScriptSetup) {
                      nodePath.replaceWith(
                        t.callExpression(
                            t.identifier('variableReplace'),
                          [
                            t.memberExpression(
                              t.identifier('pageText'),
                              t.identifier('"'+localeKey.replace(/\{.*\}/g, ''+'"')),
                              true
                            ),
                            t.objectExpression(
                            [...nodePath.node.expressions.map(i=>{
                              return t.objectProperty(
                                    t.identifier(i.name),
                                      t.identifier('"'+i.name+'"'),
                                      true
                                  )
                            })]
                            ),
                          
                          ],
                        ),
                      );
                    } else {
                      nodePath.replaceWith(
                        t.callExpression(
                          t.memberExpression(
                            t.thisExpression(),
                            t.identifier('variableReplace'),
                          ),
                          [
                            t.memberExpression(
                              t.identifier('pageText'),
                              t.identifier('"'+localeKey.replace(/\{.*\}/g, ''+'"')),
                              true
                            ),
                            t.objectExpression(
                            [...nodePath.node.expressions.map(i=>{
                              return t.objectProperty(
                                    t.identifier(i.name),
                                    t.memberExpression(
                                      t.thisExpression(),
                                      t.identifier('"'+i.name+'"'),
                                      true
                                    )
                                  )
                            })]
                            ),
                          
                          ],
                        ),
                      );
                    }
                  } else {
                    nodePath.replaceWith(
                      t.callExpression(
                        t.identifier('variableReplace'),
                        [
                          t.memberExpression(
                            t.identifier('pageText'),
                            t.identifier('"'+localeKey.replace(/\{.*\}/g, '')+'"'),
                            true
                          ),
                          t.objectExpression(
                           [...nodePath.node.expressions.map(i=>{
                            return t.objectProperty(
                                  t.identifier(i.name),
                                  t.memberExpression(
                                    t.thisExpression(),
                                    t.identifier('"'+i.name+'"'),
                                    true
                                  )
                                )
                           })]
                          ),
                         
                        ],
                      )
                    );
                  }
                } else if (this.fileType === FileType.VUE) {
                  if (isInTemplate) {
                    if (isIncludeInterpolation) {
                      nodePath.replaceWith(
                        t.callExpression(
                            t.identifier('variableReplace'),
                          [
                            t.memberExpression(
                              t.identifier('pageText'),
                              t.identifier("'"+localeKey.replace(/\{.*\}/g, '')+"'")
                            ),
                            t.objectExpression(
                             [...nodePath.node.expressions.map(i=>{
                              return t.objectProperty(
                                    t.identifier(i.name),
                                    t.identifier("'"+i.name+"'"),
                                    true
                                  )
                             })]
                            ),
                           
                          ],
                        ),
                      );
                    } else {
                      nodePath.replaceWith(
                        t.memberExpression(t.identifier('pageText'), 
                          t.identifier("'"+localeKey+"'"),
                          true
                        ),
                      );
                    }
                  } else if (isIncludeInterpolation) {
                    // callExpression => 函数
                    // 第一个参数函数名
                    // 数组参数
                    if (isScriptSetup) {
                      nodePath.replaceWith(
                        t.callExpression(
                            t.identifier('variableReplace'),
                          [
                            t.memberExpression(
                              t.identifier('pageText'),
                              t.identifier('"'+localeKey.replace(/\{.*\}/g, '')+'"'),
                              true
                            ),
                            t.objectExpression(
                            [...nodePath.node.expressions.map(i=>{
                              return t.objectProperty(
                                    t.identifier(i.name),
                                      t.identifier('"'+i.name+'"'),
                                      true
                                  )
                            })]
                            ),
                          
                          ],
                        ),
                      );
                    } else {
                      nodePath.replaceWith(
                        t.callExpression(
                          t.memberExpression(
                            t.thisExpression(),
                            t.identifier('variableReplace'),
                          ),
                          [
                            t.memberExpression(
                              t.identifier('pageText'),
                              t.identifier('"'+localeKey.replace(/\{.*\}/g, '')+'"'),
                              true
                            ),
                            t.objectExpression(
                            [...nodePath.node.expressions.map(i=>{
                              return t.objectProperty(
                                    t.identifier(i.name),
                                    t.memberExpression(
                                      t.thisExpression(),
                                      t.identifier('"'+i.name+'"'),
                                      true
                                    )
                                  )
                            })]
                            ),
                          
                          ],
                        ),
                      );
                    }
                  } else {
                    if (nodePath.container.type === 'JSXAttribute' && isScriptSetup) {
                      nodePath.container.value = t.jsxExpressionContainer(t.memberExpression(t.identifier('pageText'), t.identifier('"'+localeKey+'"'),true));
                    }else if (nodePath.container.type === 'JSXAttribute') {
                      nodePath.container.value = t.jsxExpressionContainer(t.memberExpression(t.memberExpression(t.thisExpression(),t.identifier('pageText')), t.identifier('"'+localeKey+'"'),true));
                    } else {
                      nodePath.replaceWith(
                        t.memberExpression(
                          t.memberExpression(t.thisExpression(), t.identifier('pageText')),
                          t.identifier('"'+localeKey)+'"'),
                          true
                      );
                    }
                  }
                }
          }
        },
      },
      // jsx 
      JSXText: {
        exit: (nodePath) => {
          if (hasChineseCharacter(nodePath.node.value)) {
              const localeKey = this.extractChar(
                nodePath.node.extra?.rawValue,
              )
              if (isScriptSetup) {
                nodePath.replaceWith(
                  t.jsxExpressionContainer(
                    t.memberExpression(
                      t.identifier('pageText'),
                      t.identifier('"'+localeKey+'"')),
                      true
                  ),
                );
              } else {
                nodePath.replaceWith(
                  // jsxExpressionContainer => <JSXElement>{yourExpression}</JSXElement>
                  // memberExpression => this.pageText[localeKey]
                  t.jsxExpressionContainer(
                    t.memberExpression(
                      t.memberExpression(t.thisExpression(), t.identifier('pageText')),
                      t.identifier('"'+localeKey+'"')),
                      true
                  ),
                );
            }
          }
        },
      }
    };
    traverse(ast, visitor);
    return ast
  };
  // 英文翻译
  extractChar (char) {
    const locale = char.trim();
    const key = generateHash(locale);
    // const key = await translateCNToUS(char)
    // const _key = this.stringToCamel(key)
    this.locales[key] = locale;
    return key;
  };
  // 驼峰
  stringToCamel (str) {
    if(!str) {
      return '';
    }
    let temp = str.split(" ");
    for (let i = 1; i < temp.length; i++) {
      temp[i] = temp[i][0].toUpperCase() + temp[i].slice(1);
    }
    if(!temp){
      return '';
    }
    return temp.join("").replace(/[,!。:.]/g,'');
  };
}

export default Transformer;


// {{ `你的：${my}` }}
// const a = 'pageText.VariableLibrary{content}'
// const b = a.replace(/\{.*\}/g, '')
// console.log('b', b);
// var a = ['name', 'age'].join(`{}`)
// console.log('a', a);