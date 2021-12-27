/* eslint-disable no-template-curly-in-string */
import { RESPOND, ERROR, getUserIdFromToken } from '../../../lib/apiCommon'; // include String.prototype.fQuery
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getMIUI: 'getMemberByIdAndUserId',
  setConfirmed: 'setConfirmed',
  getMember: 'getMember',
  newMember: 'newMember',
  getSMFG3: 'getSchoolMemberForGrade3',
  newSchoolRoles: 'newSchoolRoles',
  getPBG: 'getPermissionsByGrade',
  newMP: 'newMemberPermissions',
  checkClass: 'checkClass',
};
const baseUrl = 'sqls/member/addClass'; // 끝에 슬래시 붙이지 마시오.
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
      id: 'ERR.member.addClass.3.2.2',
      message: 'post server logic error',
      error: e.toString(),
      step: EXEC_STEP,
    });
  }
}
async function main(req, res) {
  const {
    member_id: memberId,
    teacher_id: teacherId,
    class_id: userClassId,
  } = req.body;

  EXEC_STEP = '3.1'; // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  EXEC_STEP = '3.2'; // #3.2 member 검색
  const qMIUI = await QTS.getMIUI.fQuery(baseUrl, { userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '3.2.1', 'searching member');

  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.member.addClass.3.2.2',
      message: '토큰의 userId와 일치하는 member를 찾을 수 없습니다.',
    });
  const { grade } = qMIUI.message.rows[0];

  if (grade > 2)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.member.addClass.3.2.3',
      message: '프로필을 추가할 권한이 없습니다.',
    });

  EXEC_STEP = '3.3'; // teacher profile 정보 가져오기
  const qMem = await QTS.getMember.fQuery(baseUrl, { memberId: teacherId });
  if (qMem.type === 'error')
    return qMem.onError(res, '3.2.4', 'searching member');

  if (qMem.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.member.addClass.3.2.5',
      message: '반을 추가할 선생님 프로필이 존재하지 않습니다.',
    });
  const teacher = qMem.message.rows[0];

  const schoolId = teacher.school_id;
  // const classId = teacher.class_id;
  const roleName = teacher.role_name;
  const teacherUserId = teacher.user_id;

  EXEC_STEP = '3.2.6'; // 이미 등록된 반인지 체크
  const qCheck = await QTS.checkClass.fQuery(baseUrl, {
    userId: teacherUserId,
    classId: userClassId,
  });
  if (qCheck.type === 'error')
    return qCheck.onError(res, '3.2.6.1', 'creating school roles');

  if (qCheck.message.rows.length > 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.member.addClass.3.2.6.2',
      message: '이미 해당 선생님의 반으로 등록된 반입니다.',
    });

  EXEC_STEP = '3.4'; // 역할 등록
  const qSR = await QTS.newSchoolRoles.fQuery(baseUrl, { schoolId, roleName });
  if (qSR.type === 'error')
    return qSR.onError(res, '3.4.1', 'creating school roles');
  const schoolRoleId = qSR.message.rows[0].id;

  EXEC_STEP = '3.5'; // 멤버 등록
  const qMember = await QTS.newMember.fQuery(baseUrl, {
    userId: teacherUserId,
    classId: userClassId,
    schoolId,
    schoolRoleId,
  });
  if (qMember.type === 'error')
    return qMember.onError(res, '3.5.1', 'creating member');
  const newClassMemberId = qMember.message.rows[0].id;

  EXEC_STEP = '3.7'; // member_permissions 에 추가한다.
  const qMP = await QTS.newMP.fQuery(baseUrl, {
    memberId: newClassMemberId,
    schoolId,
    grade: 3,
  });
  if (qMP.type === 'error')
    return qMP.onError(res, '3.7.1', 'insert member permissions');

  EXEC_STEP = '3.8'; // #3.8. 리턴할 정보를 가져온다.
  const qSMFG3 = await QTS.getSMFG3.fQuery(baseUrl, {
    memberId: newClassMemberId,
    classId: userClassId,
  });
  if (qSMFG3.type === 'error')
    return qSMFG3.onError(res, '3.8.1', 'searching school member');
  const newTeacher = qSMFG3.message.rows[0];

  // #3.9. 리턴
  return RESPOND(res, {
    teacher: newTeacher,
    resultCode: 200,
    message: '초대장을 수락했습니다.',
  });
}
