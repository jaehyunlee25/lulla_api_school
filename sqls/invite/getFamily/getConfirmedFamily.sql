select 
	m.id member_id,
	m.nickname member_name,
	sr.name role_name,
	sr.grade member_grade,
	m.kid_id,
	m.image_id member_image_id,
	to_char(m.created_at, 'YYYY.MM.DD') accept_date,
	concat(c.name,' ',k.name,'(',sr.name,')') member_nickname 
from 
	members m
	left join school_roles sr on sr.id = m.school_role_id 
	left join kid k on m.kid_id = k.id
	left join class c on m.class_id = c.id
where 
	m.kid_id = '${kidId}'
	and m.school_id = '${schoolId}'
	and sr.grade = 6
	and m.is_active = true;