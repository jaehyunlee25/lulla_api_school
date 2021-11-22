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
from demand d
    left join class c on c.id = i.class_id 
    join schools s on s.id = i.school_id 
where 
    i.id = '${demandId}';