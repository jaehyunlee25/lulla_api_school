/* eslint-disable no-template-curly-in-string */
import { RESPOND, ERROR, getUserIdFromToken } from '../../../../lib/apiCommon'; // include String.prototype.fQuery
import '../../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  setDeny: 'setDeny',
  getDemand: 'getDemand',
  getMIUI: 'getMemberByIdAndUserId',
};
const baseUrl = 'sqls/demand/accept/deny'; // 끝에 슬래시 붙이지 마시오.
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
      id: 'ERR.demand.accept.deny.3.2.2',
      message: 'post server logic error',
      error: e.toString(),
    });
  }
}
async function main(req, res) {
  const { member_id: memberId, demand_id: demandId } = req.body;

  // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  // #3.2. member 검색
  // #3.2.1.
  const qMIUI = await QTS.getMIUI.fQuery(baseUrl, { userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '3.2.2', 'searching member');
  // #3.2.2.
  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.demand.accept.getCarers.3.2.3',
      message: 'no such member',
    });
  const { grade } = qMIUI.message.rows[0];

  // #3.3. 요청 거절은 1. 원장, 2. 관리자만이 가능하다.
  if (grade > 2)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.demand.accept.deny.3.3.1',
      message: '요청을 거절할 권한이 없습니다.',
    });

  // #3.3. demand 정보 가져오기
  const qDemand = await QTS.getDemand.fQuery(baseUrl, { demandId });
  if (qDemand.type === 'error')
    return qDemand.onError(res, '3.3.1', 'searching demand');

  if (qDemand.message.rows.length === 0)
    return ERROR(res, {
      id: 'ERR.demand.accept.deny.3.3.2',
      message: '거절할 요청장이 존재하지 않습니다.',
    });

  // const demand = qDemand.message.rows[0];

  // #3.4.
  const qDeny = await QTS.setDeny.fQuery(baseUrl, { demandId });
  if (qDeny.type === 'error')
    return qDeny.onError(res, '3.4.1', 'udpating demand');

  // #3.9. 리턴
  return RESPOND(res, {
    resultCode: 200,
    message: '초대장을 거절했습니다.',
  });
}
