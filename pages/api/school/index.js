import { RESPOND, ERROR, getUserIdFromToken } from '../../../lib/apiCommon';
import setBaseURL from '../../../lib/pgConn'; // include String.prototype.fQuery

const QTS = {
  // Query TemplateS
  getSBP: 'getSchoolByPhone',
  getIBI: 'getInstitutionById',
  getSBII: 'getSchoolByInstitutionId',
  newSchool: 'newSchool',
  delSchool: 'delSchool',
  newSR: 'newSchoolRole',
  delSR: 'delSchoolRole',
  newMember: 'newMember',
  getPBG: 'getPermissionsByGrade',
  getPS: 'getPostShare',
  newMP: 'newMemberPermissions',
  getSMFG1: 'getSchoolMemberForGrade1',
  getSchoolDetail: 'getSchoolDetailForGrade1',
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

  setBaseURL('sqls/school/school'); // 끝에 슬래시 붙이지 마시오.
  try {
    if (req.method === 'POST') return await post(req, res);
    if (req.method === 'GET') return await get(req, res);
  } catch (e) {
    return ERROR(res, {
      id: 'ERR.school.index.3',
      message: 'server logic error',
      error: e.toString(),
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
    roleName,
    roleDescription,
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
    const qSBII = await QTS.getSBII.fQuery({ institutionsId });
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
  const schoolId = qSchool.message.rows[0].id;

  // #3.2.2. 원장의 롤을 기록하고, id를 얻어온다. school_role
  const qSR = await QTS.newSR.fQuery({
    schoolId,
    grade: 1,
    name: roleName,
    description: roleDescription,
  });
  if (qSR.type === 'error') {
    await QTS.delSchool.fQuery({ schoolId });
    return qSR.onError(res, '3.2.2', 'creating role');
  }
  const schoolRoleId = qSR.message.rows[0].id;
  // #3.2.3. 원장의 프로필을 생성한다. members
  const qNM = await QTS.newMember.fQuery({
    nickname: roleName,
    description: '',
    userId,
    schoolId,
    schoolRoleId,
    relation: '',
    is_active: true,
    is_admin: true,
  });
  if (qNM.type === 'error') {
    // delete 순서가 바뀌면 안 됨(delSR -> delSchool 순).
    await QTS.delSR.fQuery({ schoolRoleId });
    await QTS.delSchool.fQuery({ schoolId });
    return qNM.onError(res, '3.2.3', 'creating member profile');
  }
  const memberId = qNM.message.rows[0].id;

  // #3.3.1 원장의 권한 id를 불러온다.
  // tables related :: permissions, permission_members, school_roles, members
  const qPBG = await QTS.getPBG.fQuery({ grade: 1 });
  if (qPBG.type === 'error')
    return qPBG.onError(res, '3.3.1', 'searching permissions');
  const permissions = qPBG.message.rows[0].ids.split(',');

  // #3.3.2 post share 권한을 부여한다.
  // type :
  // 1. post, 2. album, 3. quickview,
  // 4. announcement, 5. handover, 6. requestdrug, 7. attendance
  // action : 1. create, 2. read, 3. update, 4. delete, 5. share

  // type_1 = post, action_5 = share, grade_2 = teacher
  const qPS = await QTS.getPS.fQuery({ type: 1, action: 5, grade: 2 });
  if (qPS.type === 'error')
    return qPS.onError(res, '3.3.2', 'searching post share');
  const ps = qPS.message.rows[0].id;
  permissions.push(ps);

  // #3.3.3 member_permissions 에 추가한다.
  const qMP = await QTS.newMP.fQuery({
    memberId,
    schoolId,
    grade: 1,
    permissions: ['{', permissions.join(','), '}'].join(''),
  });
  if (qMP.type === 'error')
    return qMP.onError(res, '3.3.3', 'insert member permissions');

  // #3.4.1 프로필 상세정보 조회
  const qSMFG1 = await QTS.getSMFG1.fQuery({ memberId });
  if (qSMFG1.type === 'error')
    return qSMFG1.onError(res, '3.4.1', 'get school member detail');
  const schoolMember = qSMFG1.message.rows[0];

  // #3.4.2 학원 상세정보 조회
  const qSchoolDetail = await QTS.getSchoolDetail.fQuery({ schoolId });
  if (qSchoolDetail.type === 'error')
    return qSchoolDetail.onError(res, '3.4.2', 'get school detail');
  if (qSchoolDetail.message.rows.length === 0)
    return ERROR(res, {
      resultCode: 204,
      id: 'ERR.school.index.3.1.1',
      message: '해당하는 원 정보가 존재하지 않습니다.',
    });
  const school = qSchoolDetail.message.rows[0];

  return RESPOND(res, {
    school,
    schoolMember,
    resultCode: 200,
  });
}
async function get(req, res) {
  // #3.1. 사용자 토큰을 이용해 userId를 추출한다.
  const qUserId = await getUserIdFromToken(req.headers.authorization);
  if (qUserId.type === 'error') return qUserId.onError(res, '3.1.2');
  const userId = qUserId.message;
  return userId;
}
