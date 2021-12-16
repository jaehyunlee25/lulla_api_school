import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon';
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getMIUI: 'getMemberByIdAndUserId',
  getMember: 'getMember',
  delSchoolRoles: 'delSchoolRoles',
  delMember: 'delMember',
  delMemberPermissions: 'delMemberPermissions',
};
const baseUrl = 'sqls/member/adminRemove'; // 끝에 슬래시 붙이지 마시오.
let EXEC_STEP = 0;
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
      id: 'ERR.member.adminRemove.3',
      message: 'server logic error',
      error: e.toString(),
      step: EXEC_STEP,
    });
  }
}
async function main(req, res) {
  EXEC_STEP = '3.1'; // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  const { member_id: memberId, admin_id: adminId } = req.body;

  // #3.2
  EXEC_STEP = '3.2.1'; // #3.2.1 memberId 유효성 점검
  const qMIUI = await QTS.getMIUI.fQuery(baseUrl, { userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '3.2.1', 'searching member');
  const { grade } = qMIUI.message.rows[0];

  if (grade > 2)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.member.adminRemove.3.2.2',
      message: '관리자 삭제를 시행할 권한이 없습니다.',
    });

  EXEC_STEP = '3.2'; // #3.2 member 검색
  const qMember = await QTS.getMember.fQuery(baseUrl, { adminId });
  if (qMember.type === 'error')
    return qMember.onError(res, '3.2.1', 'searching member');
  if (qMember.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.member.adminRemove.3.2.2',
      message: '해당하는 데이터를 찾을 수 없습니다.',
    });
  
  const adminGrade = qMember.message.rows[0].grade;
  if (adminGrade !== 2)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.member.adminRemove.3.2.3',
      message: '삭제하고자 하는 프로필이 관리자가 아닙니다.',
    });

  EXEC_STEP = '3.4'; // school_role 삭제
  const schoolRoleId = qMember.message.rows[0].school_role_id;
  const qSR = await QTS.delSchoolRoles.fQuery(baseUrl, { schoolRoleId });
  if (qSR.type === 'error')
    return qSR.onError(res, '3.4.1', 'searching member');

  EXEC_STEP = '3.5'; // image 삭제
  const imageId = qMember.message.rows[0].image_id;
  if (imageId) {
    const qDel = await POST(
      'file',
      '/delete',
      {
        'Content-Type': 'application/json',
        authorization: req.headers.authorization,
      },
      { file: { id: [imageId] } },
    );
    if (qDel.type === 'error')
      return qDel.onError(res, EXEC_STEP, 'fatal error while deleting file');
  }

  EXEC_STEP = '3.5'; // image 삭제
  const backgroundImageId = qMember.message.rows[0].background_image_id;
  if (backgroundImageId) {
    const qDel = await POST(
      'file',
      '/delete',
      {
        'Content-Type': 'application/json',
        authorization: req.headers.authorization,
      },
      { file: { id: [backgroundImageId] } },
    );
    if (qDel.type === 'error')
      return qDel.onError(res, EXEC_STEP, 'fatal error while deleting file');
  }

  EXEC_STEP = '3.6'; // #3.3 member_permissions 삭제
  const qMP = await QTS.delMemberPermissions.fQuery(baseUrl, { adminId });
  if (qMP.type === 'error')
    return qMP.onError(res, '3.6.1', 'deleting member_permissions');

  EXEC_STEP = '3.7'; // #3.3 member 삭제
  const qSM = await QTS.delMember.fQuery(baseUrl, { adminId });
  if (qSM.type === 'error') return qSM.onError(res, '3.7.1', 'deleting member');

  return RESPOND(res, {
    message: '관리자 프로필을 테이블에서 영구 삭제했습니다.',
    resultCode: 200,
  });
}
