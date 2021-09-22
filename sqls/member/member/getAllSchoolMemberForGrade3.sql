select 
    u.email email, 
    u.phone phone, 
    m.id member_id, 
    m.nickname nickname, 
    m.description member_description,
    c.name class_name, 
    c.start_date class_start_date, 
    c.end_date class_end_date,
    s.name school_name,
    f.address member_image, 
    f.id member_image_id, 
    bg.address member_background_image, 
    bg.id background_image_id,
    sr.name member_type, 
    sr.grade member_grade, 
    m.school_id, m.class_id,
    m.school_role_id, 
    m.is_admin, 
    CASE WHEN 
        sr.grade = 1 THEN concat(s.name) 
        WHEN sr.grade < 3 THEN concat(u.name,' ',sr.name) 
        WHEN sr.grade < 5 THEN concat(c.name,' ',u.name,' ','선생님') 
        WHEN sr.grade = 5 THEN concat(c.name,' ',k.name,'(',m.nickname,')') 
    END member_nickname,
    k.name kid_name, 
    k.id kid_id
from members m 
    left join file f on m.image_id = f.id 
    left join file bg on m.background_image_id = bg.id 
    left join class c on m.class_id = c.id
    join schools s on m.school_id = s.id 
    join school_roles sr on m.school_role_id = sr.id 
    join users u on u.id = m.user_id
    left join kid k on m.kid_id = k.id 
where 
    (
        (
            m.class_id = '${classId}' 
            and sr.grade = 5
        )
        or
        (
            m.school_id = '${schoolId}'
            and sr.grade > 5
        )
    )
    and 
        m.is_active is true;