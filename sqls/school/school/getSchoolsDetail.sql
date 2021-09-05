select 
    s.id id, 
    s.name, 
    s.tel tel, 
    s.address address,
    s.description description, 
    s.admin_name admin_name,
    d1.name district_one_name, 
    d1.id district_one_id, 
    d2.name district_two_name, 
    d2.id district_two_id, 
    i.id institutions_id
from 
    schools s 
    left join district_one d1 on d1.id = s.district_one_id
    left join district_two d2 on d2.id = s.district_two_id
    left join institutions i on i.id = s.institutions_id
where 
    s.name like '%${search}%'