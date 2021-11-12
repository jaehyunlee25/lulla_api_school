import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon';
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getMember: 'getMember',
  delKid: 'delKid',
  delSchoolRoles: 'delSchoolRoles',
  delMember: 'delMember',
};
const baseUrl = 'sqls/member/remove'; // 끝에 슬래시 붙이지 마시오.
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
      id: 'ERR.member.remove.3',
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

  // #3.2 userId와 memberId가 같은 멤버 조회
  EXEC_STEP = '3.2.1'; // #3.2.1 memberId 유효성 점검
  const { member_id: memberId } = req.body;

  EXEC_STEP = '3.2'; // #3.2 member 검색
  const qMember = await QTS.getMember.fQuery(baseUrl, { memberId });
  if (qMember.type === 'error')
    return qMember.onError(res, '3.2.1', 'searching member');
  if (qMember.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.school.school.3.2.2',
      message: '해당하는 데이터를 찾을 수 없습니다.',
    });

  const memberUserId = qMember.message.rows[0].user_id;
  if (userId !== memberUserId)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.school.school.3.2.3',
      message: 'member profile 정보의 수정 권한이 없습니다.',
    });

  EXEC_STEP = '3.3'; // kid 삭제
  const kidId = qMember.message.rows[0].kid_id;
  if (kidId) {
    const qKid = await QTS.delKid.fQuery(baseUrl, { kidId });
    if (qKid.type === 'error')
      return qKid.onError(res, '3.3.1', 'searching member');
  }

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

  EXEC_STEP = '3.6'; // #3.3 member 삭제
  const qSM = await QTS.delMember.fQuery(baseUrl, { memberId });
  if (qSM.type === 'error')
    return qSM.onError(res, '3.3.1', 'searching member');

  return RESPOND(res, {
    message: '프로필을 테이블에서 영구 삭제했습니다.',
    resultCode: 200,
  });
}
