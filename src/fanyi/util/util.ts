const stringToCamel = (str:string)=>{
  console.log('str',str);
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
  return temp.join("").replace(/[,!。:]/g,'');
};

const stringToCode = (code: any, value: (args: any) => any, params: any) => {
  const result = { value, error: '' };
  try {
    result.value = new Function('context', `return ${code}`)(params) || value; // eslint-disable-line no-new-func
  } catch (e) {
    console.error('js脚本错误：', e);
    result.error = 'js脚本错误';
  }
  return result;
};
const runFnInVm = (code: string, params?: any, globalParams?: undefined) => {
  const NOOP = (args: any) => args;
  const result = stringToCode(code, NOOP, globalParams);
  const fn = result.value;
  result.value = params;
  if (result.error) {
    return result;
  }
  if (typeof fn !== 'function') {
    // console.error('非法的js脚本函数', fn);
    result.error = '非法的js脚本函数';
    return result;
  }
  try {
    result.value = fn.call(fn, params);
  } catch (e) {
    console.error('js脚本执行错误：', e);
    result.error = 'js脚本执行错误：';
  }
  return result;
};
export {stringToCamel,runFnInVm};