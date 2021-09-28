import { RESPOND, ERROR, getUserIdFromToken } from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getSMFG1: 'getSchoolMemberForGrade1',
  getSMFG3: 'getSchoolMemberForGrade3',
  getSMFG5: 'getSchoolMemberForGrade5',

  getASMFG1: 'getAllSchoolMemberForGrade1',
  getASMFG3: 'getAllSchoolMemberForGrade3',
  getASMFG5: 'getAllSchoolMemberForGrade5',
  getASMFT: 'getAllSchoolMemberForTeacher',
  getASMFG: 'getAllSchoolMemberForGuardian',
  getASM: 'getAllSchoolMember',

  getMIUI: 'getMemberByIdAndUserId',
};
export default async function handler(req, res) {
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'GET',
  });
  // #2. preflight 처리
  // if (req.method === 'OPTIONS') return RESPOND(res, {});

  setBaseURL('sqls/member/member'); // 끝에 슬래시 붙이지 마시오.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.school.index.3',
      message: 'server logic error',
      error: e.toString(),
    });
  }
}
async function main(req, res) {
  // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  // #3.2 userId와 memberId가 같은 멤버 조회
  // #3.2.1 memberId 유효성 점검
  const { member_id: memberId, id: searchMemberId, type } = req.query;

  if (!memberId) {
    const qSMFG = await QTS.getASM.fQuery({ userId });
    if (qSMFG.type === 'error')
      return qSMFG.onError(res, '3.4.1', 'searching member');

    return RESPOND(res, {
      data: qSMFG.message.rows,
      message: '해당하는 데이터를 성공적으로 반환하였습니다.',
      resultCode: 200,
    });
  }

  // #3.2.2 member 검색
  const qMIUI = await QTS.getMIUI.fQuery({ userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '3.2.2', 'searching member');
  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.school.school.3.2.2',
      message: '토큰의 userId와 일치하는 member를 찾을 수 없습니다.',
    });
  const {
    school_id: schoolId,
    class_id: classId,
    grade,
  } = qMIUI.message.rows[0];

  // #3.3 검색하고자 하는 memberId가 있을 경우
  if (searchMemberId !== undefined) {
    const obQuery = {
      1: 'getSMFG1',
      2: 'getSMFG1',
      3: 'getSMFG3',
      4: 'getSMFG3',
      5: 'getSMFG5',
    };
    const qtsName = obQuery[grade];
    const qSMFG = await QTS[qtsName].fQuery({
      memberId: searchMemberId,
      classId,
    });
    if (qSMFG.type === 'error')
      return qSMFG.onError(res, '3.3.1', 'searching member');

    if (qSMFG.message.rows.length === 0)
      return ERROR(res, {
        resultCode: 204,
        id: 'ERR.school.index.3.3.2',
        message: '해당하는 원 정보가 존재하지 않습니다.',
      });

    return RESPOND(res, {
      data: qSMFG.message.rows[0],
      message: '해당하는 데이터를 성공적으로 반환하였습니다.',
      resultCode: 200,
    });
  }
  // #3.4 검색하고자 하는 memberId가 없을 경우
  let key;
  if (type === 'teacher' || type === 'guardian') {
    key = type;
  } else {
    key = grade;
  }
  const obQuery = {
    1: 'getASMFG1',
    2: 'getASMFG1',
    3: 'getASMFG3',
    4: 'getASMFG3',
    5: 'getASMFG5',
    teacher: 'getASMFT',
    guardian: 'getASMFG',
  };
  const qtsName = obQuery[key];

  const qSMFG = await QTS[qtsName].fQuery({
    schoolId,
    classId,
    userId,
  });
  if (qSMFG.type === 'error')
    return qSMFG.onError(res, '3.4.1', 'searching member');

  if (qSMFG.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 204,
      id: 'ERR.school.index.3.4.2',
      message: '해당하는 원 정보가 존재하지 않습니다.',
    });

  return RESPOND(res, {
    data: qSMFG.message.rows,
    message: '해당하는 데이터를 성공적으로 반환하였습니다.',
    resultCode: 200,
  });
}
