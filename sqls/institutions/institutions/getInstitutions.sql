select 
    i.id, 
    i.name, 
    i.admin, 
    i.tel, 
    d.id district_one_id ,
    d.name district_one_name,
    dt.id district_two_id ,
    dt.name district_two_name, 
    i.address 
from 
    institutions i 
    join district_one d on d.id = i.district_one_id
    left join district_two dt on dt.id = i.district_two_id
where 
    i.name like '%${search}%';