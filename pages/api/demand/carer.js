/* eslint-disable no-template-curly-in-string */
import {
  RESPOND,
  ERROR,
  getUserIdFromToken,
  POST,
} from '../../../lib/apiCommon'; // include String.prototype.fQuery
import '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getDemand: 'getDemand',
  newDemand: 'newDemand',
  newKid: 'newKid',
  getAdminPhone: 'getAdminPhone',
};
const baseUrl = 'sqls/demand/carer'; // 끝에 슬래시 붙이지 마시오.
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
    });
  }
}
async function main(req, res) {
  const { school_id: schoolId, class_id: classId, kid } = req.body;
  const { name: kidName, birth: kidBirth, gender: kidGender, relation } = kid;

  // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  // 이 getUserIdFromToken 함수는 user의 활성화 여부까지 판단한다.
  // userId가 정상적으로 리턴되면, 활성화된 사용자이다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1');
  const userId = qUserId.message;

  // #3.3. kid를 등록한다.
  const qNewKid = await QTS.newKid.fQuery(baseUrl, {
    kidName,
    kidBirth,
    kidGender, // 0: 남자, 1: 여자
  });
  if (qNewKid.type === 'error')
    return qNewKid.onError(res, '3.4.1', 'creating demand');
  const kidId = qNewKid.message.rows[0].id;

  // #3.4. 요청장을 생성한다.
  const roleType = 5;
  const qNew = await QTS.newDemand.fQuery(baseUrl, {
    roleType,
    userId,
    classId,
    schoolId,
    kidId,
    relation,
  });
  if (qNew.type === 'error')
    return qNew.onError(res, '3.4.1', 'creating demand');
  const demandId = qNew.message.rows[0].id;

  // #3.5. 요청장 정보를 가져온다.
  const qGet = await QTS.getDemand.fQuery(baseUrl, { demandId });
  if (qGet.type === 'error')
    return qGet.onError(res, '3.5.1', 'searching demand');
  const demand = qGet.message.rows[0];

  // #3.5.2. 학원 원장선생님의 전화번호를 가져온다.
  const qPhone = await QTS.getAdminPhone.fQuery(baseUrl, { schoolId });
  if (qPhone.type === 'error')
    return qPhone.onError(res, '3.5.1', 'searching demand');
  const { phone } = qPhone.message.rows[0];

  // #3.6. 문자 메시지를 전송한다.
  const qMember = await POST(
    'send',
    '/sms',
    {
      'Content-Type': req.headers['Content-Type'],
      authorization: req.headers.authorization,
    },
    {
      message: `'${demand.school_name}'에서 보호자 요청장을 보냈습니다. [랄라]`,
      phone,
    },
  );
  if (qMember.type === 'error')
    return qMember.onError(res, '3.2', 'fatal error while searching member');

  // #3.7. 리턴
  return RESPOND(res, {
    demand,
    resultCode: 200,
    message: '초대장을 성공적으로 반환하였습니다.',
  });
}
