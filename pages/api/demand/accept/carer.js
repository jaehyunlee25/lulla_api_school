/* eslint-disable no-template-curly-in-string */
import { RESPOND, ERROR, getUserIdFromToken } from '../../../../lib/apiCommon'; // include String.prototype.fQuery
import '../../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  setConfirmed: 'setConfirmed',
  getDemand: 'getDemand',
  newMember: 'newMember',
  getSMFG5: 'getSchoolMemberForGrade5',
  newSchoolRoles: 'newSchoolRoles',
  getPBG: 'getPermissionsByGrade',
  getMIUI: 'getMemberByIdAndUserId',
};
const baseUrl = 'sqls/demand/accept/carer'; // 끝에 슬래시 붙이지 마시오.
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
      id: 'ERR.demand.accept.carer.3.2.2',
      message: 'post server logic error',
      error: e.toString(),
    });
  }
}
async function main(req, res) {
  const {
    member_id: memberId,
    demand_id: demandId,
    role_name: roleName,
  } = req.body;

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
  const { school_id: schoolId, grade } = qMIUI.message.rows[0];

  // #3.3. 요청 승인은 1. 원장, 2. 관리자만이 가능하다.
  if (grade > 2)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.demand.accept.getCarers.3.3.1',
      message: '선생님 요청을 수락할 권한이 없습니다.',
    });

  // #3.2. demand 정보 가져오기
  const qDemand = await QTS.getDemand.fQuery(baseUrl, { demandId });
  if (qDemand.type === 'error')
    return qDemand.onError(res, '3.2.1', 'searching demand');

  if (qDemand.message.rows.length === 0)
    return ERROR(res, {
      id: 'ERR.demand.accept.carer.3.2.2',
      message: '해당하는 요청장이 존재하지 않습니다.',
    });

  const demand = qDemand.message.rows[0];

  if (schoolId !== demand.school_id)
    return ERROR(res, {
      id: 'ERR.demand.accept.carer.3.2.3',
      message: '해당 요청을 승인할 권한이 없습니다.',
    });

  const classId = demand.class_id;

  // #3.3. 역할 등록
  const qSR = await QTS.newSchoolRoles.fQuery(baseUrl, { schoolId, roleName });
  if (qSR.type === 'error')
    return qSR.onError(res, '3.3.1', 'creating school roles');
  const schoolRoleId = qSR.message.rows[0].id;

  // #3.4. 멤버 등록
  const qMember = await QTS.newMember.fQuery(baseUrl, {
    userId,
    kidId: demand.kid_id,
    classId,
    schoolId,
    schoolRoleId,
  });
  if (qMember.type === 'error')
    return qMember.onError(res, '3.4.1', 'creating member');
  const demandMemberId = qMember.message.rows[0].id;

  // #3.5. demand table의 confirmed를 true로
  const qConfirmed = await QTS.setConfirmed.fQuery(baseUrl, {
    demandId,
    memberId: demandMemberId,
  });
  if (qConfirmed.type === 'error')
    return qConfirmed.onError(res, '3.5.1', 'updating demand');

  // #3.8. 리턴할 정보를 가져온다.
  const qSMFG5 = await QTS.getSMFG5.fQuery(baseUrl, {
    memberId: demandMemberId,
    classId,
  });
  if (qSMFG5.type === 'error')
    return qSMFG5.onError(res, '3.8.1', 'searching school member');
  const data = qSMFG5.message.rows;

  // #3.9. 리턴
  return RESPOND(res, {
    data,
    resultCode: 200,
    message: '보호자 요청장을 수락했습니다.',
  });
}
