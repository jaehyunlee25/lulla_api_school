import { RESPOND, ERROR, getUserIdFromToken } from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getSBI: 'getSchoolByInstitutionId',
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
  setBaseURL('sqls/school/check'); // 끝에 슬래시 붙이지 마시오.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.school.check.3',
      message: 'server logic error',
      error: e.toString(),
    });
  }
}
async function main(req, res) {
  // #3.0. 사용자 토큰을 이용해 userId를 추출한다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.0');

  // #3.1. 원등록 정보에 institution_id와 일치하는 원이 있는지 조회한다.
  const { institutions_id: institutionId } = req.body.school;
  const qSBI = await QTS.getSBI.fQuery({ institutionId });
  if (qSBI.type === 'error')
    return qSBI.onError(res, '3.1.1', 'searching school');
  if (qSBI.message.rows.length > 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.school.check.3.1',
      message: '이미 등록된 원입니다. 원정보를 다시 확인해주세요.',
    });
  return RESPOND(res, {
    message: '사용 가능한 원입니다.',
    resultCode: 200,
  });
}
