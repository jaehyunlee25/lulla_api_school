select 
	m.id member_id,
	m.nickname member_name,
	m.image_id member_image_id,
	u.phone,
	sr.grade member_grade,
	sr.name member_relation
from 
	members m
	left join school_roles sr on sr.id = m.school_role_id
	left join users u on u.id = m.user_id
where
    m.school_id = '${schoolId}'
    and m.id = '${memberId}';