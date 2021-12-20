select
    id kid_id,
    name,
    gender,
    birth,
    image_id,
    (select 
	 	sr.name 
	 from 
	 	members m
	 	left join school_roles sr on sr.id = m.school_role_id
	 where 
	 	m.kid_id = '${kidId}') relation
from
    kid
where
    id = '${kidId}';