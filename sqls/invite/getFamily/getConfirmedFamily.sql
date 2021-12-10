select 
	m.id member_id,
	m.nickname member_name,
	sr.name relation,
	m.kid_id,
	m.image_id member_image_id,
	to_char(m.created_at, 'YYYY.MM.DD') accept_date
from 
	members m
	left join school_roles sr on sr.id = m.school_role_id 
where 
	m.kid_id = '${kidId}'
	and m.school_id = '${schoolId}'
	and sr.grade = 6
	and m.is_active = true;