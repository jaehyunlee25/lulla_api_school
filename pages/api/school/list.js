import { RESPOND, ERROR, getUserIdFromToken } from '../../../lib/apiCommon';
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getMIUI: 'getMemberByIdAndUserId',
  getList: 'getList',
};
const baseUrl = 'sqls/school/list'; // 끝에 슬래시 붙이지 마시오.
let EXEC_STEP = 0;
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
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.school.index.3',
      message: 'server logic error',
      error: e.toString(),
      step: EXEC_STEP,
    });
  }
}
async function main(req, res) {
  EXEC_STEP = '3.0'; // #3.0. 사용자 토큰을 이용해 유효성을 검증하고, 필요하면 userId를 추출한다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.0');
  // const userId = qUserId.message;

  EXEC_STEP = '3.0.1'; // 원 생성
  const { search } = req.body;

  /* EXEC_STEP = '3.1'; // #3.1. member 검색
  const qMIUI = await QTS.getMIUI.fQuery(baseUrl, { userId, memberId });
  if (qMIUI.type === 'error')
    return qMIUI.onError(res, '3.1.1', 'searching member');
  if (qMIUI.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 400,
      id: 'ERR.school.school.3.1.2',
      message: '토큰의 userId와 일치하는 member를 찾을 수 없습니다.',
    });
  const { grade } = qMIUI.message.rows[0];

  EXEC_STEP = '3.2'; // #3.2. 권한 점검
  if (grade > 4)
    return ERROR(res, {
      resultCode: 204,
      id: 'ERR.school.list.3.2.1',
      message: '등록된 원 목록을 검색할 권한이 없습니다.',
    }); */

  EXEC_STEP = '3.3'; // #3.3. 원 검색
  const qList = await QTS.getList.fQuery(baseUrl, { search });
  if (qList.type === 'error')
    return qList.onError(res, '3.3.1', 'searching school list');

  return RESPOND(res, {
    list: qList.message.rows,
    resultCode: 200,
  });
}
