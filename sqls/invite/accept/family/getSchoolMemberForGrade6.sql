select 
    u.email email, 
    u.phone, 
    m.id member_id, 
    m.nickname nickname, 
    m.description member_description,
    c.name class_name, 
    s.name school_name,
    f.address member_image, 
    f.id member_image_id, 
    bg.address member_background_image, 
    bg.id background_image_id,
    sr.name member_type, 
    sr.grade member_grade, 
    m.user_id, 
    m.school_id, 
    m.class_id,
    m.school_role_id, 
    m.is_admin,
    CASE 
        WHEN sr.grade = 1 THEN concat(s.name) 
        WHEN sr.grade < 3 THEN concat(u.name,' ',sr.name) 
        WHEN sr.grade < 5 THEN concat(c.name,' ',u.name,' ','선생님') 
        WHEN sr.grade = 5 THEN concat(c.name,' ',k.name,'(',m.nickname,')') 
    END member_nickname, 
    k.id kid_id,
    k.name kid_name 
from 
    members m 
    left join file f on m.image_id = f.id 
    left join file bg on m.background_image_id = bg.id 
    left join class c on m.class_id = c.id
    left join schools s on m.school_id = s.id 
    left join school_roles sr on m.school_role_id = sr.id 
    left join users u on u.id = m.user_id
    left join kid k on m.kid_id = k.id
where 
    s.activated = true
    and m.id = '${memberId}' 
    and m.is_active is true;