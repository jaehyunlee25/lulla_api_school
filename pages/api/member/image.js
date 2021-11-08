import Busboy from 'busboy';
import fs from 'fs';

import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  THUMBNAIL,
  DELETE,
  SIZE,
} from '../../../lib/apiCommon';
import '../../../lib/pgConn'; // include String.prototype.fQuery
import S3UPLOAD from '../../../lib/S3AWS';

const QTS = {
  // Query TemplateS
  getMIUI: 'getMemberByIdAndUserId',
  newFile: 'newFile',
  setMember: 'setMember',
};
const ADDR = './public/tmp/';
const baseUrl = 'sqls/member/image'; // 끝에 슬래시 붙이지 마시오.

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

  const param = {};
  const busboy = new Busboy({ headers: req.headers });
  let fileLen = 0;
  req.pipe(busboy);
  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    const t = new Date().getTime();
    param[fieldname] = {
      name: t.toString().add('_').add(filename),
      fileName: filename,
      encoding,
      mimetype,
    };
    try {
      const dest = ADDR.add(param[fieldname].name);
      file.pipe(fs.createWriteStream(dest));
    } catch (e) {
      console.log(e);
    }
    file.on('data', (data) => {
      fileLen += data.length;
    });
    file.on('end', async () => {
      if (param[fieldname].mimetype.includes('image')) {
        const dest = ADDR.add(param[fieldname].name);
        const size = await SIZE(dest);
        param[fieldname].width = size.message.width;
        param[fieldname].height = size.message.height;
        param[fieldname].type = size.type;
        param[fieldname].size = fileLen;
      }
    });
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
  const { member_id: memberId, file } = req.body;
  const { name: fileName } = file;

  // #3.1.2. member 검색
  const qMIUI = await QTS.getMIUI.fQuery(baseUrl, { userId, memberId });
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
      message: qThumb.message,
      eStr: qThumb.eStr,
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

  // #3.3. file 테이블에 저장
  const qFile = await QTS.newFile.fQuery(baseUrl, {
    fileName: file.name,
    type: file.mimetype.split('/')[0],
    address: s3Data.Location,
    size: file.size,
    thumbnail_address: s3ThumbData.Location,
    key: s3Data.key,
    width: file.width,
    height: file.height,
  });
  if (qFile.type === 'error')
    return qFile.onError(res, '3.3.1', 'creating file');
  const imageId = qFile.message.rows[0].id;

  // #3.4. 프로필에 이미지 id 저장
  const qMemb = await QTS.setMember.fQuery(baseUrl, { imageId, memberId });
  if (qMemb.type === 'error')
    return qMemb.onError(res, '3.4.1', 'updating member');

  return RESPOND(res, {
    message: '프로필 이미지 변경 성공',
    resultCode: 200,
  });
}
