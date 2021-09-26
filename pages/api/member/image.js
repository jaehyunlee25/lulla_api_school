import Busboy from 'busboy';
import fs from 'fs';

import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  THUMBNAIL,
  DELETE,
} from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery
import S3UPLOAD from '../../../lib/S3AWS';

const QTS = {
  // Query TemplateS
  getMIUI: 'getMemberByIdAndUserId',
};
const ADDR = './public/tmp/';

export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  // #2. preflight 처리
  if (req.method === 'OPTIONS') return RESPOND(res, {});

  setBaseURL('sqls/member/image'); // 끝에 슬래시 붙이지 마시오.

  const param = {};
  const busboy = new Busboy({ headers: req.headers });
  req.pipe(busboy);
  busboy.on('file', (fieldname, file, filename) => {
    const t = new Date().getTime();
    param[fieldname] = t.toString().add('_').add(filename);
    try {
      const dest = ADDR.add(param[fieldname]);
      file.pipe(fs.createWriteStream(dest));
    } catch (e) {
      console.log(e);
    }
  });
  busboy.on('field', (fieldname, val) => {
    param[fieldname] = val;
  });
  busboy.on('finish', async () => {
    req.body = param;
    try {
      return await main(req, res);
    } catch (e) {
      return ERROR(res, {
        id: 'ERR.school.index.3',
        message: 'server logic error',
        error: e.toString(),
      });
    }
  });

  return false;
}
async function main(req, res) {
  // #3.1.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1.1');
  const userId = qUserId.message;
  const { member_id: memberId, file: fileName } = req.body;

  // #3.1.2. member 검색
  const qMIUI = await QTS.getMIUI.fQuery({ userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '3.1.2.1', 'searching member');
  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.school.school.3.2.2',
      message: '토큰의 userId와 일치하는 member를 찾을 수 없습니다.',
    });

  // #3.2.1. thumbnail 생성
  const qThumb = await THUMBNAIL(ADDR, fileName);
  if (qThumb.type === 'error')
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.school.school.3.2.1.1',
      message: qUpload.message,
      eStr: qUpload.eStr,
    });
  const thumbFileName = qThumb.message;

  // #3.2.2. file upload
  const qUpload = await S3UPLOAD(ADDR.add(fileName), 'lulla');
  if (qUpload.type === 'error')
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.school.school.3.2.2.1',
      message: qUpload.message,
      eStr: qUpload.eStr,
    });
  const s3Data = qUpload.message;

  // #3.2.3. thumbnail upload
  const qThumbUpload = await S3UPLOAD(ADDR.add(thumbFileName), 'thumb');
  if (qThumbUpload.type === 'error')
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.school.school.3.2.3.1',
      message: qThumbUpload.message,
      eStr: qThumbUpload.eStr,
    });
  const s3ThumbData = qThumbUpload.message;

  // #3.2.4. delete image & thumbnail from local
  DELETE(ADDR, fileName);
  DELETE(ADDR, thumbFileName);


  return RESPOND(res, {
    s3Data,
    s3ThumbData,
    message: '해당하는 데이터를 성공적으로 반환하였습니다.',
    resultCode: 200,
  });
}
