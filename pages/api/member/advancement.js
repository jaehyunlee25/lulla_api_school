/* eslint-disable no-template-curly-in-string */
import { RESPOND, ERROR, getUserIdFromToken } from '../../../lib/apiCommon'; // include String.prototype.fQuery
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getProfile: 'getProfile',
  newMember: 'newMember',
  getSMFG1: 'getSchoolMemberForGrade1',
  newSchoolRoles: 'newSchoolRoles',
  newMP: 'newMemberPermissions',
  getMIUI: 'getMemberByIdAndUserId',
};
const baseUrl = 'sqls/member/advancement'; // 끝에 슬래시 붙이지 마시오.
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
      id: 'ERR.member.advancement.3.2.2',
      message: 'post server logic error',
      error: e.toString(),
      step: EXEC_STEP,
    });
  }
}
async function main(req, res) {
  const {
    member_id: memberId,
    teacher_member_id: teacherMemberId,
    role_name: roleName,
  } = req.body;

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
  // #3.2.2.
  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.member.advancement.3.2.3',
      message: 'no such member',
    });
  const { school_id: schoolId, grade } = qMIUI.message.rows[0];

  EXEC_STEP = '3.3.'; // #3.3. 요청 승인은 1. 원장, 2. 관리자만이 가능하다.
  if (grade > 2)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.member.advancement.3.3.1',
      message: '관리자 승급을 시행할 권한이 없습니다.',
    });

  EXEC_STEP = '3.4.'; // #3.4. profile 정보 가져오기
  const qProfile = await QTS.getProfile.fQuery(baseUrl, { teacherMemberId });
  if (qProfile.type === 'error')
    return qProfile.onError(res, '3.2.1', 'searching profile');

  if (qProfile.message.rows.length === 0)
    return ERROR(res, {
      id: 'ERR.member.advancement.3.2.2',
      message: '해당하는 선생님 프로필이 존재하지 않습니다.',
    });

  const teacherProfile = qProfile.message.rows[0];

  // #3.3. 역할 등록
  const qSR = await QTS.newSchoolRoles.fQuery(baseUrl, { schoolId, roleName });
  if (qSR.type === 'error')
    return qSR.onError(res, '3.3.1', 'creating school roles');
  const schoolRoleId = qSR.message.rows[0].id;

  // #3.4. 멤버 등록
  const qMember = await QTS.newMember.fQuery(baseUrl, {
    nickname: teacherProfile.nickname,
    userId: teacherProfile.user_id,
    schoolId: teacherProfile.school_id,
    schoolRoleId,
    imageId: teacherProfile.image_id,
    backgroundImageId: teacherProfile.background_image_id,
  });
  if (qMember.type === 'error')
    return qMember.onError(res, '3.4.1', 'creating member');
  const adminMemberId = qMember.message.rows[0].id;

  // #3.7 member_permissions 에 추가한다.
  const qMP = await QTS.newMP.fQuery(baseUrl, {
    memberId: adminMemberId,
    schoolId,
    grade: 2,
  });
  if (qMP.type === 'error')
    return qMP.onError(res, '3.7.1', 'insert member permissions');

  // #3.8. 리턴할 정보를 가져온다.
  const qSMFG3 = await QTS.getSMFG1.fQuery(baseUrl, {
    memberId: adminMemberId,
  });
  if (qSMFG3.type === 'error')
    return qSMFG3.onError(res, '3.8.1', 'searching school member');
  const data = qSMFG3.message.rows;

  // #3.9. 리턴
  return RESPOND(res, {
    data,
    resultCode: 200,
    message: '선생님에 대한 관리자 승급이 성공했습니다.',
  });
}
