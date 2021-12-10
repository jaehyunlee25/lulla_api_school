select 
    i.id id, 
    i.confirmed confirmed, 
    i.type, 
    s.id school_id,
    s.name school_name, 
    s.description school_description, 
    s.address school_address, 
    s.tel school_tel,
    c.id class_id, 
    c.name class_name, 
    c.description class_description,
    i.phone phone
from invitation i
    -- join users u on u.id = i.user_id 
    -- left join kid k on k.id = i.kid_id
    left join class c on c.id = i.class_id 
    join schools s on s.id = i.school_id 
    -- left join school_role sr on sr.id = i.role_id
where 
    i.id = '${invId}';