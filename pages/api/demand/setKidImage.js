/* eslint-disable no-template-curly-in-string */
import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  // POST,
} from '../../../lib/apiCommon'; // include String.prototype.fQuery
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  checkDemand: 'checkDemand',
  getDemand: 'getDemand',
  setKidImage: 'setKidImage',
};
const baseUrl = 'sqls/demand/setKidImage'; // 끝에 슬래시 붙이지 마시오.
let EXEC_STEP = '0';
export default async function handler(req, res) {
  // 회원가입
  // 기능: : 탈퇴회원 활성화,  혹은 신규멤버 등록 및 보안토큰 발행,  관련멤버명단 추출
  // 리턴: : USER,  token,  schoolMember
  // #1. cors 해제
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*', // for same origin policy
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': ['Content-Type', 'Authorization'], // for application/json
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  // #2. preflight 처리
  if (req.method === 'OPTIONS') return RESPOND(res, {});
  // #3. 데이터 처리
  // #3.1. 작업

  // #3.2.
  try {
    return await main(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.demand.carer.3.2.2',
      message: 'post server logic error',
      error: e.toString(),
      step: EXEC_STEP,
    });
  }
}
async function main(req, res) {
  const { kid_id: kidId, kid_image_id: kidImageId } = req.body;

  EXEC_STEP = '3.1.'; // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  EXEC_STEP = '3.2.'; // userId가 kidId의 권한이 있는지 demand에서 확인한다.
  const qCheck = await QTS.checkDemand.fQuery(baseUrl, {
    userId,
    kidId,
  });
  if (qCheck.type === 'error')
    return qCheck.onError(res, '3.2.1', 'searching demand');
  if (qCheck.message.rows.length === 0)
    return ERROR(res, {
      id: 'ERR.demand.setKidImage.3.2.2',
      message: '해당 kid의 정보를 수정할 권한이 없습니다.',
      step: EXEC_STEP,
    });

  // #3.3. kid 정보를 수정한다.
  const qNewKid = await QTS.setKidImage.fQuery(baseUrl, {
    kidId,
    kidImageId,
  });
  if (qNewKid.type === 'error')
    return qNewKid.onError(res, '3.3.1', 'creating demand');

  // #3.7. 리턴
  return RESPOND(res, {
    resultCode: 200,
    message: '해당 kid의 이미지를 성공적으로 수정하였습니다.',
  });
}
