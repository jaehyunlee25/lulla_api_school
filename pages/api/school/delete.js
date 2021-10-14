import { RESPOND, ERROR, getUserIdFromToken } from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getSBI: 'getSchoolById',
  getMIUI: 'getMemberByIdAndUserId',
  delSchool: 'delSchoolById',
  setMember: 'setMember',
};
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

  // #3. 작업
  setBaseURL('sqls/school/delete'); // 끝에 슬래시 붙이지 마시오.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.school.update.3',
      message: 'server logic error',
      error: e.toString(),
    });
  }
}
async function main(req, res) {
  // #3.0.1. 사용자 토큰을 이용해 userId를 추출한다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.0');
  const userId = qUserId.message;
  // #3.0.2. 파라미터 정보
  // #3.1 userId와 memberId가 같은 멤버 조회
  // #3.1.1 memberId 유효성 점검
  const { member_id: memberId } = req.body;
  if (!memberId)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.school.school.3.1.1',
      message: 'member_id의 형식이 올바르지 않습니다.',
    });
  // #3.1.2 member 검색
  const qMIUI = await QTS.getMIUI.fQuery({ userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '3.1.2', 'searching member');
  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.school.school.3.1.2',
      message: '토큰의 userId와 일치하는 member를 찾을 수 없습니다.',
    });
  const { school_id: schoolId, grade } = qMIUI.message.rows[0];
  // #3.2.1
  if (grade !== 1)
    return ERROR(res, {
      resultCode: 401,
      id: 'ERR.school.check.3.2.1',
      message: '해당하는 원에 접근권한이 없습니다.',
    });
  // #3.2.2 해당 원이 있는지 조회
  const qSBI = await QTS.getSBI.fQuery({ schoolId });
  if (qSBI.type === 'error')
    return qSBI.onError(res, '3.2.2.1', 'searching school');
  if (qSBI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 204,
      id: 'ERR.school.check.3.2.2.2',
      message: '해당하는 원 정보가 존재하지 않습니다.',
    });
  // #3.2.3 해당 원의 정보를 삭제
  const qDelS = await QTS.delSchool.fQuery({ schoolId });
  if (qDelS.type === 'error')
    return qDelS.onError(res, '3.2.3.2', 'udpate school');

  // #3.2.4 멤버프로필 변경
  const qMem = await QTS.setMember.fQuery({ memberId });
  if (qMem.type === 'error') return qMem.onError(res, '3.2.4', 'udpate school');

  return RESPOND(res, {
    message: '성공적으로 삭제하였습니다.',
    resultCode: 200,
  });
}
