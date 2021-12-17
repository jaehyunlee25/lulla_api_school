import { RESPOND, ERROR, getUserIdFromToken } from '../../../lib/apiCommon';
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getSBI: 'getSchoolById',
  setSBI: 'setSchoolById',
  getSDBI: 'getSchoolDetailById',
  getMIUI: 'getMemberByIdAndUserId',
};
const baseUrl = 'sqls/school/update'; // 끝에 슬래시 붙이지 마시오.
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
  const { id: schoolId } = req.body.school;
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
  const qMIUI = await QTS.getMIUI.fQuery(baseUrl, { userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '3.1.2', 'searching member');
  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.school.school.3.1.2',
      message: '토큰의 userId와 일치하는 member를 찾을 수 없습니다.',
    });
  const { school_id: memberSchoolId, grade } = qMIUI.message.rows[0];
  // #3.2.1
  if (schoolId !== memberSchoolId || grade !== 1)
    return ERROR(res, {
      resultCode: 204,
      id: 'ERR.school.check.3.2.1',
      message: '해당하는 원에 접근권한이 없습니다.',
    });
  // #3.2.2 해당 원이 있는지 조회
  const qSBI = await QTS.getSBI.fQuery(baseUrl, { schoolId });
  if (qSBI.type === 'error')
    return qSBI.onError(res, '3.2.2.1', 'searching school');
  if (qSBI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 204,
      id: 'ERR.school.check.3.2.2.2',
      message: '해당하는 원 정보가 존재하지 않습니다.',
    });
  // #3.2.3 해당 원의 정보를 수정
  // updateColumnList = { parameter : column_name }
  const updateColumnList = {
    admin_name: 'admin_name',
    address: 'address',
    tel: 'tel',
    name: 'name',
    district_one_id: 'district_one_id',
    district_two_id: 'district_two_id',
  };
  // #3.2.3.1. 쿼리에 쓸 sets 정보를 취합한다.
  const sets = [];
  const keys = Object.keys(req.body.school);
  keys.forEach((key) => {
    if (!updateColumnList[key]) return;
    const val = req.body.school[key];
    if (val) {
      const str = [updateColumnList[key], '=', "'", val, "'"].join('');
      sets.push(str);
    }
  });
  // #3.2.3.2. 원의 정보를 수정한다.
  const strSets = sets.join(',\r\n    ');
  const qSetS = await QTS.setSBI.fQuery(baseUrl, { strSets, schoolId });
  if (qSetS.type === 'error')
    return qSetS.onError(res, '3.2.3.2', 'udpate school');
  // #3.2.3.3. 수정한 원의 정보를 수집한다.
  const qSDBI = await QTS.getSDBI.fQuery(baseUrl, { schoolId });
  if (qSDBI.type === 'error')
    return qSDBI.onError(res, '3.2.3.3.1', 'searching school');
  if (qSDBI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 204,
      id: 'ERR.school.school.3.2.3.3.2',
      message: '해당하는 어린이집 데이터가 존재하지 않습니다.',
    });
  const data = qSDBI.message.rows[0];

  return RESPOND(res, {
    data,
    message: '해당 어린이집 수정에 성공하였습니다.',
    resultCode: 200,
  });
}
