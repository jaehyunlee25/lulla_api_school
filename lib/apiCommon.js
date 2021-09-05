/* eslint-disable no-template-curly-in-string */
/* eslint-disable no-param-reassign */
/* eslint no-extend-native: ['error', { "exceptions": ["String"] }] */
import axios from 'axios';

String.prototype.proc = function proc(param) {
  let self = this;
  Object.keys(param).forEach((key) => {
    const regex = new RegExp(['\\$\\{', key, '\\}'].join(''), 'g'); // 백슬래시 두 번,  잊지 말 것!!
    const val = param[key];
    self = self.replace(regex, val);
  });
  return self;
};
function procError(res, id, eString, message) {
  const prm = {
    type: 'error',
    resultCode: 401,
    id: ['ERR', 'user.token', id].join('.'),
    name: eString,
    message,
  };
  res.end(JSON.stringify(prm));
  return 'error';
}
export async function getUserIdFromToken(Authorization) {
  // 토큰의 유효성을 점검한다.
  const strErr = {
    one: '인증 데이터가 올바르지 않습니다. 올바른 형식은 headers 에 Authorization : Bearer {token}입니다.',
    two: '유효하지 않은 토큰입니다. 재로그인 하여 토큰을 발급받아서 사용해주세요.',
  };
  const addrs = 'http://dev.lulla.co.kr/api/auth/getUserIdFromToken';
  if (!Authorization)
    return {
      type: 'error',
      onError: (res, id) => procError(res, id, '', strErr.one),
    };

  try {
    const result = await axios({
      method: 'GET',
      url: addrs,
      headers: { Authorization },
    });
    // 토큰 유효성 에러
    if (result.type === 'error')
      return {
        type: 'error',
        onError: (res, id) => procError(res, id, '', result.message),
      };
    // 토큰 유효성 통과
    return { type: 'success', message: result.data.userId };
  } catch (e) {
    return {
      type: 'error',
      onError: (res, id) => procError(res, id, e.toString(), strErr.two),
    };
  }
}
export function RESPOND(res, param) {
  res.end(JSON.stringify(param));
}
export function ERROR(res, param) {
  param.type = 'error';
  param.resultCode = 400;
  res.end(JSON.stringify(param));
  return 'error';
}
export function getRandom(start, end) {
  const amount = end - start;
  const rslt = Math.random() * (amount + 1) + start;
  return parseInt(rslt, 10);
}
