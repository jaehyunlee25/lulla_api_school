/* eslint-disable no-template-curly-in-string */
import { RESPOND, ERROR, getUserIdFromToken } from '../../../lib/apiCommon'; // include String.prototype.fQuery
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getInvitation: 'getInvitation',
  getInvResult: 'getInvResult',
};
const baseUrl = 'sqls/invite/getInfo'; // 끝에 슬래시 붙이지 마시오.
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
      id: 'ERR.invite.getInfo.3.2.2',
      message: 'post server logic error',
      error: e.toString(),
      step: EXEC_STEP,
    });
  }
}
async function main(req, res) {
  const { invitation_id: invId } = req.body;

  EXEC_STEP = '3.1.'; // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  // const userId = qUserId.message;

  EXEC_STEP = '3.2.'; // invitation 정보를 불러온다.
  const qInv = await QTS.getInvitation.fQuery(baseUrl, { invId });
  if (qInv.type === 'error')
    return qInv.onError(res, '3.2.1', 'searching invitation');

  if (qInv.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.invite.getInfo.3.2.2',
      message: '해당하는 초청장이 존재하지 않습니다.',
    });

  /* const inv = qInv.message.rows[0];
  if (inv.userId !== userId)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.invite.getInfo.3.2.2',
      message: '해당 초청정보를 검색할 권한이 없습니다.',
    }); */

  EXEC_STEP = '3.2.'; // 출력할 invitation 정보를 불러온다.
  const qResult = await QTS.getInvResult.fQuery(baseUrl, { invId });
  if (qResult.type === 'error')
    return qResult.onError(res, '3.2.1', 'searching invitation');

  const invitation = qResult.message.rows[0];

  // #3.7. 리턴
  return RESPOND(res, {
    invitation,
    resultCode: 200,
    message: '초대장을 성공적으로 반환하였습니다.',
  });
}
