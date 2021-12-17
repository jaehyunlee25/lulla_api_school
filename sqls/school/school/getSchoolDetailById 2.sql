select 
    s.id id, 
    s.name , 
    s.tel tel,
    s.address address,
    s.description description, 
    s.admin_name admin_name,
    d1.name district_one_name, 
    d1.id district_one_id, 
    d2.name district_two_name, 
    d2.id district_two_id,
    i.id institutions_id,
    (select 
        array_to_json(
            array(select 
                row_to_json(tmp) 
            from
                (select 
                    c.name, 
                    c.id, 
                    c.start_date, 
                    c.end_date, 
                    c.description
                from 
                    class c 
                where 
                    c.school_id=s.id) tmp
            )
        ) class_data
    )
from 
    schools s 
    left join members m on m.school_id = s.id 
    left join school_roles sr on sr.id = m.school_role_id
    left join district_one d1 on d1.id = s.district_one_id
    left join district_two d2 on d2.id = s.district_two_id
    left join institutions i on i.id = s.institutions_id
    left join users u on m.user_id = u.id 
where 
    s.activated = true
    and s.id= '${schoolId}' 
    and sr.grade = 1;