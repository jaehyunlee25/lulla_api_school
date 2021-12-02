select
	m.id member_id,
	m.nickname,
	m.image_id
from
	invitation i
    left join members m on i.member_id = m.id
where
	i.confirmed = true
	and i.school_id = '${schoolId}'
	and i.class_id = '${classId}'
	and i.role_name = '${roleName}';