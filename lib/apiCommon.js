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

export async function getUserIdFromToken(Authorization) {
  const addrs = 'http://mnemosyne.co.kr/api/auth/getUserIdFromToken';
  try {
    console.log({
      method: 'GET',
      url: addrs,
      headers: { Authorization },
    });
    const res = await axios({
      method: 'GET',
      url: addrs,
      headers: { Authorization },
    });
    console.log(res.data);
    return { type: 'success', message: res.data.userId };
  } catch (e) {
    return {
      type: 'error',
      onError: (res, id) => {
        const prm = {
          type: 'error',
          resultCode: 400,
          id: ['ERR', 'user.token', id].join('.'),
          name: e.toString(),
        };
        res.end(JSON.stringify(prm));
        return 'error';
      },
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
