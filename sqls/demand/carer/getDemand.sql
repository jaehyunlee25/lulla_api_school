select 
    d.id id, 
    d.confirmed confirmed, 
    d.role_type, 
    s.id school_id,
    s.name school_name, 
    s.description school_description, 
    s.address school_address, 
    s.tel school_tel,
    c.id class_id, 
    c.name class_name, 
    c.description class_description
    k.name kid_name,
	k.birth kid_birth,
	k.gender kid_gender
from demand d
    left join kid k on k.id = d.kid_id
    left join class c on c.id = d.class_id 
    join schools s on s.id = d.school_id 
where 
    d.id = '${demandId}';