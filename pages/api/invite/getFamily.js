/* eslint-disable no-template-curly-in-string */
import { RESPOND, ERROR, getUserIdFromToken } from '../../../lib/apiCommon'; // include String.prototype.fQuery
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getKidId: 'getKidId',
  getFamily: 'getFamily',
  getConfirmedFamily: 'getConfirmedFamily',
  getMIUI: 'getMemberByIdAndUserId',
};
const baseUrl = 'sqls/invite/getFamily'; // 끝에 슬래시 붙이지 마시오.
let EXEC_STEP = 0;
export default async function handler(req, res) {
  // 회원가입
  // 기능: : 탈퇴회원 활성화,  혹은 신규멤버 등록 및 보안토큰 발행,  관련멤버명단 추출
  // 리턴: : USER,  token,  schoolMember
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  // #2. preflight 처리
  if (req.method === 'OPTIONS') return RESPOND(res, {});
  // #3. 데이터 처리
  // #3.1. 작업

  // #3.2.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.invite.getFamily.3.2.2',
      message: 'post server logic error',
      error: e.toString(),
      step: EXEC_STEP,
    });
  }
}
async function main(req, res) {
  const { member_id: memberId, confirmed } = req.body;

  EXEC_STEP = '3.1.'; // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  EXEC_STEP = '3.2.'; // #3.2. member 검색
  // #3.2.1.
  const qMIUI = await QTS.getMIUI.fQuery(baseUrl, { userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '3.2.2', 'searching member');
  // #3.2.2.
  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.invite.getFamily.3.2.3',
      message: 'no such member',
    });
  const { school_id: schoolId, grade } = qMIUI.message.rows[0];

  EXEC_STEP = '3.3.'; // #3.3. 관리자 초대장 검색은 5. 보호자만이 가능하다.
  if (grade !== 5)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.invite.getFamily.3.3.1',
      message: '가족 초대를 검색할 권한이 없습니다.',
    });

  EXEC_STEP = '3.4.'; // #3.3. 보호자의 kid_id를 검색한다.
  const qGetKid = await QTS.getKidId.fQuery(baseUrl, { memberId });
  if (qGetKid.type === 'error')
    return qGetKid.onError(res, '3.4.1', 'searching a kid of member');

  const kidId = qGetKid.message.rows[0].kid_id;
  if (!kidId)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.invite.getFamily.3.4.1',
      message: '해당하는 kid가 존재하지 않습니다.',
    });

  EXEC_STEP = '3.5.'; // #3.5. 초대장을 검색한다.
  let qGet;
  if (confirmed) {
    qGet = await QTS.getConfirmedFamily.fQuery(baseUrl, {
      schoolId,
      kidId,
    });
    if (qGet.type === 'error')
      return qGet.onError(res, '3.5.1', 'searching invitation');
  } else {
    qGet = await QTS.getFamily.fQuery(baseUrl, {
      schoolId,
      memberId,
    });
    if (qGet.type === 'error')
      return qGet.onError(res, '3.5.2', 'searching invitation');
  }
  const family = qGet.message.rows;

  EXEC_STEP = '3.7.'; // #3.7. 리턴
  return RESPOND(res, {
    family,
    resultCode: 200,
    message: '초대장을 성공적으로 반환하였습니다.',
  });
}
