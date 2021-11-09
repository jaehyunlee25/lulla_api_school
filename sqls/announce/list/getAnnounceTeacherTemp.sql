select 
    a.id, 
    a.date, 
    a.content, 
    a.meal, 
    a.temperature, 
    a.is_record,
    a.sleep, 
    a.defecation, 
    a.is_confirmed, 
    c.name class_name, 
    fm.id member_id, 
    tm.id to_member_id, 
    c.name class_name, 
    c.id class_id, 
    s.name school_name, 
    s.id school_id, 
    a.is_published,
    CASE 
        WHEN sr.grade < 5 THEN 0 
        WHEN sr.grade = 5 THEN 1 
    END sender,
    (
        select 
            array_to_json(
                array(
                    select 
                        row_to_json(tmp) 
                    from
                        (select 
                            f.id, 
                            f.address, 
                            f.size, 
                            f.thumbnail_address, 
                            f.type, 
                            f.name, 
                            f.width, 
                            f.height, 
                            f.index, 
                            f.duration 
                        from 
                            file f 
                                join announce_file af on af.file_id = f.id
                            where 
                                af.announce_id = a.id 
                                and (f.type='image' or f.type='video') 
                        order by f.index
                        ) tmp
                )
            ) images
    )
from announcement a
    left join member fm on fm.id = a.member_id
    left join member tm on tm.id = a.to_member_id
    left join kid fk on fk.id = fm.kid_id
    left join kid tk on tk.id = tm.kid_id
    left join schools s on s.id = fm.school_id
    left join class c on c.id = fm.class_id
    left join school_role sr on sr.id = tm.school_role_id
where 
    (
        (
            a.to_member_id = '${memberId}' 
            and a.member_id = '${toMemberId}'
        ) 
        or 
        (
            a.member_id ='${memberId}' 
            and a.to_member_id='${toMemberId}'
        )
    )
    and a.is_published = false
    and cast(a.date as varchar) like '${date}%';