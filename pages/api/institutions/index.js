import { RESPOND, ERROR } from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getITT: 'getInstitutions',
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

  setBaseURL('sqls/institutions/institutions'); // 끝에 슬래시 붙이지 마시오.
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
  // #3.1. 검색어 추출
  const { search } = req.query;

  if (!search)
    return ERROR(res, {
      resultCode: 200,
      id: 'ERR.school.index.3.1.1',
      message: '검색어를 입력해주세요',
    });

  // #3.2. 검색어에 맞는 학원 정보 출력
  const qITT = await QTS.getITT.fQuery({ search });
  if (qITT.type === 'error')
    return qITT.onError(res, '3.2.1', 'searching institutions');

  return RESPOND(res, {
    datas: qITT.message.rows,
    message: '지역 정보 데이터를 반환하였습니다.',
    resultCode: 200,
  });
}
