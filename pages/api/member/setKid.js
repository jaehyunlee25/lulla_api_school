import { RESPOND, ERROR, getUserIdFromToken } from '../../../lib/apiCommon';
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getMIUI: 'getMemberByIdAndUserId',
  getKid: 'getKid',
  setKid: 'setKid',
};
let EXEC_STEP = 0;
const baseUrl = 'sqls/member/setKid'; // 끝에 슬래시 붙이지 마시오.
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

  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.member.setKid.3',
      message: 'server logic error',
      error: e.toString(),
      step: EXEC_STEP,
    });
  }
}
async function main(req, res) {
  EXEC_STEP = '3.1.'; // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  // #3.2 userId와 memberId가 같은 멤버 조회
  EXEC_STEP = '3.2.'; // #3.2.1 memberId 유효성 점검
  const { member_id: memberId, kid: userKid } = req.body;
  const {
    id: kidId,
    /* name: kidName,
    birth: kidBirth,
    gender: kidGender,
    image_id: kidImageId, */
  } = userKid;

  EXEC_STEP = '3.3.'; // #3.3 member 검색
  const qMIUI = await QTS.getMIUI.fQuery(baseUrl, { userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '3.3.1', 'searching member');

  EXEC_STEP = '3.4.'; // #3.4.
  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.member.setKid.3.4.1',
      message: 'no such member',
    });
  const { kid_id: memberKidId } = qMIUI.message.rows[0];

  EXEC_STEP = '3.5.'; // #3.4 kid_id 유효성 검사
  if (kidId !== memberKidId)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.member.setKid.3.5.1',
      message: '해당하는 원생의 정보를 수정할 권한이 없습니다.',
    });

  EXEC_STEP = '3.6.'; // #3.4 kid 조회
  const qGetKid = await QTS.getKid.fQuery(baseUrl, { kidId });
  if (qGetKid.type === 'error')
    return qGetKid.onError(res, '3.6.1', 'searching member');
  const kid = qGetKid.message.rows[0];

  EXEC_STEP = '3.7.'; // #3.7 kid 정보 수정
  Object.keys(userKid).forEach((key) => {
    const val = userKid[key];
    if (!val) return;
    kid[key] = val;
  });

  EXEC_STEP = '3.8.'; // #3.8 kid 테이블 수정
  const qSetKid = await QTS.setKid.fQuery(baseUrl, kid);
  if (qSetKid.type === 'error')
    return qSetKid.onError(res, '3.8.1', 'searching member');

  EXEC_STEP = '3.9.'; // kid 정보 조회
  const qGet = await QTS.getKid.fQuery(baseUrl, { kidId });
  if (qGet.type === 'error')
    return qGet.onError(res, '3.9.1', 'searching member');
  const data = qGet.message.rows[0];

  return RESPOND(res, {
    data,
    message: '원생의 정보를 수정하였습니다.',
    resultCode: 200,
  });
}
