/* eslint-disable prefer-template */
/* eslint-disable no-template-curly-in-string */
/* eslint-disable no-param-reassign */
/* eslint no-extend-native: ['error', { "exceptions": ["String", "Array"] }] */
import axios from 'axios';
import Thumbnail from 'image-thumbnail';
import sizeOf from 'image-size';
import fs from 'fs';

const domains = {
  auth: process.env.url_auth_header,
  school: process.env.url_school_header,
  file: process.env.url_file_header,
  send: process.env.url_send_header,
};

String.prototype.proc = function proc(param) {
  let self = this;
  Object.keys(param).forEach((key) => {
    const regex = new RegExp('\\$\\{'.add(key).add('\\}'), 'g'); // 백슬래시 두 번,  잊지 말 것!!
    const val = param[key];
    self = self.replace(regex, val);
  });
  return self;
};
String.prototype.add = function add(str) {
  return [this, str].join('');
};
Array.prototype.sql = function sql(begin, end) {
  // begin 'a', 'b', 'c' end 형태의 스트링 리턴
  return begin + this.map((el) => "'" + el + "'").join(',') + end;
};
Array.prototype.minus = function minus(el) {
  return this.filter((elm) => elm !== el);
};
Array.prototype.minusAr = function minusAr(arr) {
  const res = [];
  this.forEach((el) => {
    let flg = false;
    arr.some((elm) => {
      if (el === elm) flg = true;
      return flg;
    });
    if (!flg) res.push(el);
  });
  return res;
};
function procError(res, id, eString, message) {
  const prm = {
    type: 'error',
    resultCode: 401,
    id: 'ERR.'.add('user.token').add(id),
    name: eString,
    message,
  };
  res.end(JSON.stringify(prm));
  return 'error';
}
export async function POST(domain, addrs, header, param) {
  const config = {
    method: 'POST',
    url: [domains[domain], addrs].join(''),
    headers: header,
    data: param,
  };
  try {
    const result = await axios(config);
    console.log(result);
    if (result.data.type === 'error')
      return {
        type: 'error',
        onError: (res, id) => procError(res, id, '', result.data),
      };
    return { type: 'success', message: result.data };
  } catch (e) {
    return {
      type: 'error',
      onError: (res, id, message) => procError(res, id, e.toString(), message),
    };
  }
}
export async function SIZE(addr) {
  try {
    const result = await getSize();
    return { type: 'success', message: result };
  } catch (e) {
    return {
      type: 'error',
      message: 'getting image size fails',
      eStr: e.toString(),
    };
  }

  function getSize() {
    return new Promise((resolve, reject) => {
      sizeOf(addr, (err, result) => {
        if (err) reject(new Error(err));
        else resolve(result);
      });
    });
  }
}
export async function DELETE(addr, filename) {
  try {
    const full = addr.add(filename);
    fs.unlinkSync(full);
    return {
      type: 'success',
      message: 'image file deleted',
      target: full,
    };
  } catch (e) {
    return {
      type: 'error',
      message: 'delete image file fail',
      eStr: e.toString(),
    };
  }
}
export async function THUMBNAIL(addr, filename) {
  const target = addr.add(filename);
  const thumbName = 'thumb_'.add(filename);
  const destination = addr.add(thumbName);

  try {
    const thumbnail = await Thumbnail(target, { width: 640 });
    const cws = fs.createWriteStream(destination);
    cws.write(thumbnail);
    cws.end();
    return { type: 'success', message: thumbName };
  } catch (e) {
    return {
      type: 'error',
      message: 'thumbnail creating fail',
      eStr: e.toString(),
    };
  }
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
    console.log(result);
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
