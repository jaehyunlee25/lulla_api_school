select 
	m.id member_id,
	m.nickname member_name,
	m.image_id member_image_id,
	sr.grade member_grade
from 
	members m
	left join school_roles sr on sr.id = m.school_role_id
where
    m.school_id = '${schoolId}'
    and sr.grade = ${grade};