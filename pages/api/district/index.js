import { RESPOND, ERROR } from '../../../lib/apiCommon';
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getDO: 'getDistrictOne',
  getDT: 'getDistrictTwo',
};
const baseUrl = 'sqls/district/district'; // 끝에 슬래시 붙이지 마시오.
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
  // #3.1. 대지역 정보 id 추출
  const districtOneId = req.query.id;
  // #3.2. 대지역 정보 id 가 없을 시, 대지역 정보 전부 출력
  if (!districtOneId) {
    const qDO = await QTS.getDO.fQuery(baseUrl, {});
    if (qDO.type === 'error')
      return qDO.onError(res, '3.2.1', 'searching districtOne');

    return RESPOND(res, {
      datas: qDO.message.rows,
      message: '지역 정보를 성공적으로 반환하였습니다.',
      resultCode: 200,
    });
  }
  // #3.3. 대지역 정보 id 가 있을 시, 중지역 정보 전부 출력
  const qDT = await QTS.getDT.fQuery(baseUrl, { districtOneId });
  if (qDT.type === 'error')
    return qDT.onError(res, '3.3.1', 'searching districtTwo');

  return RESPOND(res, {
    datas: qDT.message.rows,
    message: '지역 정보 데이터를 반환하였습니다.',
    resultCode: 200,
  });
}
