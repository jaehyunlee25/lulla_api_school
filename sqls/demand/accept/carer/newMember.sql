insert into 
    members(
        id,
        nickname,
        created_at,
        updated_at,
        user_id,
        kid_id,
        class_id,
        school_id,
        school_role_id,
        is_active,
        is_admin
    )
values(
    uuid_generate_v1(),
    '보호자',
    now(),
    now(),
    '${userId}',
    '${kidId}',
    '${classId}',
    '${schoolId}',
    '${schoolRoleId}',
    true,
    false
) returning id;