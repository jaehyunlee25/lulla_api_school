/* eslint-disable no-template-curly-in-string */
import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon'; // include String.prototype.fQuery
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getMIUI: 'getMemberByIdAndUserId',
  getInvitation: 'getInvitation',
  newInvitation: 'newInvitation',
};
const baseUrl = 'sqls/invite/admin'; // 끝에 슬래시 붙이지 마시오.
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
      id: 'ERR.invite.admin.3.2.2',
      message: 'post server logic error',
      error: e.toString(),
    });
  }
}
async function main(req, res) {
  const { invitation, member_id: memberId } = req.body;
  const { phone, role_name: roleName, type } = invitation;

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
      id: 'ERR.invite.admin.3.2.3',
      message: 'no such member',
    });
  const { school_id: schoolId, grade } = qMIUI.message.rows[0];

  // #3.3. 관리자 초대는 1. 원장, 2. 관리자만이 가능하다.
  if (grade > 2)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.invite.admin.3.3.1',
      message: '관리자 초대장을 생성할 권한이 없습니다.',
    });

  // #3.4. 초대장을 생성한다.
  const qNew = await QTS.newInvitation.fQuery(baseUrl, {
    type,
    schoolId,
    phone,
    roleName,
    memberId,
  });
  if (qNew.type === 'error')
    return qNew.onError(res, '3.4.1', 'creating invitation');
  const invId = qNew.message.rows[0].id;

  // #3.5. 초대장 정보를 가져온다.
  const qGet = await QTS.getInvitation.fQuery(baseUrl, { invId });
  if (qGet.type === 'error')
    return qGet.onError(res, '3.4.1', 'searching invitation');
  const inv = qGet.message.rows[0];

  // #3.6. 문자 메시지를 전송한다.
  const qMember = await POST(
    'send',
    '/sms',
    {
      'Content-Type': req.headers['Content-Type'],
      authorization: req.headers.authorization,
    },
    {
      message: `'${inv.school_name}'에서 초대장을 보냈습니다. [랄라]`,
      phone,
    },
  );
  if (qMember.type === 'error')
    return qMember.onError(res, '3.2', 'fatal error while searching member');

  // #3.7. 리턴
  return RESPOND(res, {
    invitation: inv,
    resultCode: 200,
    message: '초대장을 성공적으로 반환하였습니다.',
  });
}
