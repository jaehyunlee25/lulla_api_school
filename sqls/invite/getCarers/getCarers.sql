select 
	i.id, 
	s.name school_name, 
	c.name class_name,
	m.nickname inviter,
	i.role_name, 
	i.phone, 
	to_char(i.created_at, 'YYYY.MM.DD') date 
from 
	invitation i
	left join schools s on i.school_id = s.id
	left join class c on i.class_id = c.id
	left join members m on i.inviter_id = m.id
where
	i.school_id = '${schoolId}'
	and i.class_id = '${classId}'
	and i.role_name = '${roleName}'
	and confirmed = ${confirmed};