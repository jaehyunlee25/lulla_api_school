select 
	m.id teacher_id
from 
	members m
	left join school_roles sr on sr.id = m.school_role_id 
where 
	class_id = '${classId}'
	and sr.grade = 3;