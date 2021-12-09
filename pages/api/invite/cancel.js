/* eslint-disable no-template-curly-in-string */
import { RESPOND, ERROR, getUserIdFromToken } from '../../../lib/apiCommon'; // include String.prototype.fQuery
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getMIUI: 'getMemberByIdAndUserId',
  getInvitation: 'getInvitation',
  delInvitation: 'delInvitation',
};
const baseUrl = 'sqls/invite/cancel'; // 끝에 슬래시 붙이지 마시오.
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
      id: 'ERR.invite.cancel.3.2.2',
      message: 'post server logic error',
      error: e.toString(),
      step: EXEC_STEP,
    });
  }
}
async function main(req, res) {
  const { invitation_id: invId, member_id: memberId } = req.body;

  EXEC_STEP = '3.1.'; // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  // #3.2. member 검색
  EXEC_STEP = '3.2.1.'; // #3.2.1.
  const qMIUI = await QTS.getMIUI.fQuery(baseUrl, { userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '3.2.2', 'searching member');

  EXEC_STEP = '3.2.2.'; // #3.2.2.
  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.invite.cancel.3.2.3',
      message: 'no such member',
    });
  // const { school_id: schoolId, grade } = qMIUI.message.rows[0];

  EXEC_STEP = '3.3.'; // invitation 정보를 가져온다.
  const qInv = await QTS.getInvitation.fQuery(baseUrl, { invId });
  if (qInv.type === 'error')
    return qInv.onError(res, '3.3.1', 'searching invitation');
  const invitation = qInv.message.rows[0];

  if (invitation.inviter_id !== memberId)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.invite.cancel.3.3.2',
      message: '초대장을 삭제할 권한이 없습니다.',
    });

  if (invitation.confirmed || invitation.is_denied)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.invite.cancel.3.3.3',
      message: '이미 처리된 초대장이므로 삭제할 수 없습니다.',
    });

  EXEC_STEP = '3.4.'; // 초대장을 삭제한다.
  const qDel = await QTS.delInvitation.fQuery(baseUrl, { invId });
  if (qDel.type === 'error')
    return qDel.onError(res, '3.4.1', 'removing invitation');

  // #3.7. 리턴
  return RESPOND(res, {
    resultCode: 200,
    message: '초대장을 성공적으로 삭제하였습니다.',
  });
}
