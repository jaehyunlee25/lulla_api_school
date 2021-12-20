select 
	m.class_id kid_class_id
from 
	members m
	left join school_roles sr on sr.id = m.school_role_id
where
	m.kid_id = '${kidId}'
	and sr.grade = 5;