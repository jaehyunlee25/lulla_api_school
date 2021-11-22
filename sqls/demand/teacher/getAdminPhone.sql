select 
	u.phone phone
from 
	members m
	left join users u on m.user_id = u.id
where
	m.school_id = '${schoolId}';