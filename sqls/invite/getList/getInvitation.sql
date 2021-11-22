select 
    i.id,
	u.name user_name,
	s.name school_name,
	i.role_name role_name,
	i.kid_name kid_name,
    i.type invite_type,
	to_char(i.created_at, 'YYYY.MM.DD') date
from 
    invitation i
	left join schools s on s.id = i.school_id
    left join users u on u.id = i.user_id
where
    user_id = '${userId}'
    and confirmed = false
    and is_denied = false;