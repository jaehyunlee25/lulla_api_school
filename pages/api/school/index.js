import { RESPOND, ERROR, getUserIdFromToken } from '../../../lib/apiCommon';

const QTS = {
  // Query TemplateS
  getSBP: 'getSchoolByPhone',
  getIBI: 'getInstitutionById',
  getSBII: 'getSchoolByInstitutionId',
  newSchool: 'newSchool',
};
export default async function handler(req, res) {
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  });
  // #2. preflight 처리
  if (req.method === 'OPTIONS') return RESPOND(res, {});

  try {
    if (req.method === 'POST') return await post(req, res);
    if (req.method === 'GET') return await get(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.school.index.3',
      message: 'server logic error',
    });
  }
  return true;
}
async function post(req, res) {
  // 원 생성
  let { tel } = req.body;
  const {
    address,
    name,
    districtOneId,
    districtTwoId,
    adminName,
    institutionsId,
    userId,
    description,
  } = req.body;
  // #3.1.1. 전화번호를 이용해 이미 등록된 원인지 파악한다.
  tel = tel.replace(/-/g, '');
  const qSBP = await QTS.getSBP.fQuery({ tel });
  if (qSBP.type === 'error')
    return qSBP.onError(res, '3.1.1', 'getting school');
  if (qSBP.message.rows.length > 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.school.index.3.1.1',
      message: '이미 등록되어진 전화번호입니다. 관리자에게 문의바랍니다.',
    });
  // #3.1.2.
  let institution;
  if (institutionsId) {
    const qIBI = await QTS.getIBI.fQuery({ id: institutionsId });
    if (qIBI.type === 'error')
      return qIBI.onError(res, '3.1.2', 'getting institution');
    if (qIBI.message.rows.length === 0)
      return ERROR(res, {
        resultCode: 400,
        id: 'ERR.school.index.3.1.2',
        message: '존재하지 않는 기관 id입니다.',
      });
    [institution] = qIBI.message.rows;
  }
  // #3.1.3.
  if (institution) {
    const qSBII = await QTS.getSBII.fQuery({ institutions_id: institutionsId });
    if (qSBII.type === 'error')
      return qSBII.onError(res, '3.1.3', 'getting school');
    if (qSBII.message.rows.length > 0)
      return ERROR(res, {
        resultCode: 404,
        id: 'ERR.school.index.3.1.3',
        message: '해당 기관id로 존재하는 원이 이미 존재합니다.',
      });
  }
  // #3.2.1. 권한이 있으면 원을 등록한다.
  const qSchool = await QTS.newSchool.fQuery({
    name,
    address,
    description,
    tel,
    adminName,
    districtOneId,
    districtTwoId,
    institutionsId,
  });
  if (qSchool.type === 'error')
    return qSchool.onError(res, '3.2.1', 'creating school');





  // #4.
  return RESPOND(res, {
    userId,
    resultCode: 200,
  });
}
async function get() {
  // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1.2');
  const userId = qUserId.message;
  return true;
}
