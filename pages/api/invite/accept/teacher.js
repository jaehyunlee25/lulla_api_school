/* eslint-disable no-template-curly-in-string */
import { RESPOND, ERROR, getUserIdFromToken } from '../../../../lib/apiCommon'; // include String.prototype.fQuery
import setBaseURL from '../../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  setConfirmed: 'setConfirmed',
  getInvitation: 'getInvitation',
  newMember: 'newMember',
  getSMFG3: 'getSchoolMemberForGrade3',
  newSchoolRoles: 'newSchoolRoles',
};
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
  setBaseURL('sqls/invite/accept/teacher'); // 끝에 슬래시 붙이지 마시오.

  // #3.2.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.invite.accept.teacher.3.2.2',
      message: 'post server logic error',
      error: e.toString(),
    });
  }
}
async function main(req, res) {
  const { invitation_id: invitationId } = req.body;

  // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  // #3.2. invitiation 정보 가져오기
  const qInv = await QTS.getInvitation.fQuery({ invitationId });
  if (qInv.type === 'error')
    return qInv.onError(res, '3.2.1', 'searching invitation');

  if (qInv.message.rows.length === 0)
    return ERROR(res, {
      id: 'ERR.invite.accept.teacher.3.2.2',
      message: '사용자를 위한 초대장이 존재하지 않습니다.',
    });

  const inv = qInv.message.rows[0];

  if (userId !== inv.user_id)
    return ERROR(res, {
      id: 'ERR.invite.accept.teacher.3.2.3',
      message: '사용자와 초대장의 id가 일치하지 않습니다.',
    });

  const schoolId = inv.school_id;
  const classId = inv.class_id;
  const roleName = inv.role_name;

  // #3.3. 역할 등록
  const qSR = await QTS.newSchoolRoles.fQuery({ schoolId, roleName });
  if (qSR.type === 'error')
    return qSR.onError(res, '3.3.1', 'creating school roles');
  const schoolRoleId = qSR.message.rows[0].id;

  // #3.4. 멤버 등록
  const qMember = await QTS.newMember.fQuery({
    userId,
    classId,
    schoolId,
    schoolRoleId,
  });
  if (qMember.type === 'error')
    return qMember.onError(res, '3.4.1', 'creating member');
  const memberId = qMember.message.rows[0].id;

  // #3.5. invitation table의 confirmed를 true로
  const qConfirmed = await QTS.setConfirmed.fQuery({ invitationId });
  if (qConfirmed.type === 'error')
    return qConfirmed.onError(res, '3.5.1', 'updating invitation');

  // #3.6. 리턴할 정보를 가져온다.
  const qSMFG3 = await QTS.getSMFG3.fQuery({ memberId, classId });
  if (qSMFG3.type === 'error')
    return qSMFG3.onError(res, '3.6.1', 'searching school member');
  const data = qSMFG3.message.rows;

  // #3.7. 리턴
  return RESPOND(res, {
    data,
    resultCode: 200,
    message: '초대장을 수락했습니다.',
  });
}