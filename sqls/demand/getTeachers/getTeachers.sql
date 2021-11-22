select 
	d.id, 
	u.name user_name,
	s.name school_name, 
	c.name class_name,
	case d.role_type
		when 3 then '선생님'
		when 5 then '보호자'
	end role_name, 
	u.phone phone,
	to_char(d.created_at, 'YYYY.MM.DD') date 
from 
	demand d
	left join schools s on d.school_id = s.id
	left join class c on d.class_id = c.id
	left join users u on u.id = d.user_id
where
	d.school_id = '${schoolId}'
	and d.class_id = '${classId}'
	and d.role_type = '${roleType}'
	and confirmed = ${confirmed}
	and is_denied = false;