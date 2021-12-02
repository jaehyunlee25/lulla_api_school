select
	m.id member_id,
	m.nickname,
	m.image_id
from
	demand d
    left join members m on d.member_id = m.id
where
	d.confirmed = true
	and d.school_id = '${schoolId}'
	and d.class_id = '${classId}'
	and d.role_type = '${roleType}';