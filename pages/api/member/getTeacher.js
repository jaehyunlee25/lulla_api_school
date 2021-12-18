import { RESPOND, ERROR, getUserIdFromToken } from '../../../lib/apiCommon';
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getMIUI: 'getMemberByIdAndUserId',
  getTeacher: 'getTeacher',
  getProfile: 'getProfile',
  getClasses: 'getClasses',
};
const baseUrl = 'sqls/member/getTeacher'; // 끝에 슬래시 붙이지 마시오.
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
      id: 'ERR.member.getTeacher.3',
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
  const { member_id: memberId, teacher_id: teacherId } = req.body;

  EXEC_STEP = '3.2'; // #3.2 member 검색
  const qMIUI = await QTS.getMIUI.fQuery(baseUrl, { userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '3.1.2.1', 'searching member');
  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.member.getTeacher.3.2.2',
      message: '토큰의 userId와 일치하는 member를 찾을 수 없습니다.',
    });
  const { grade } = qMIUI.message.rows[0];

  if (grade > 4)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.member.getTeacher.3.2.3',
      message: '멤버 목록을 조회할 권한이 없습니다.',
    });

  EXEC_STEP = '3.3';
  const qProfile = await QTS.getProfile.fQuery(baseUrl, {
    memberId: teacherId,
  });
  if (qProfile.type === 'error')
    return qProfile.onError(res, '3.3.1', 'searching member');

  if (qProfile.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.member.getTeacher.3.3.2',
      message: '조회할 선생님의 프로필이 존재하지 않습니다.',
    });
  const tInfo = qProfile.message.rows[0];

  EXEC_STEP = '3.4';
  const qMems = await QTS.getTeacher.fQuery(baseUrl, {
    schoolId: tInfo.school_id,
    memberId: tInfo.id,
  });
  if (qMems.type === 'error')
    return qMems.onError(res, '3.4.1', 'searching member');

  const teacher = qMems.message.rows[0];

  EXEC_STEP = '3.5';
  const qClasses = await QTS.getClasses.fQuery(baseUrl, {
    userId: tInfo.user_id,
    schoolId: tInfo.school_id,
  });
  if (qClasses.type === 'error')
    return qClasses.onError(res, '3.4.1', 'searching member');

  const classes = qClasses.message.rows;

  return RESPOND(res, {
    teacher,
    classes,
    message: '멤버 목록을 성공적으로 반환했습니다.',
    resultCode: 200,
  });
}
