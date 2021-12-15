insert into 
    members(
        id,
        nickname,
        created_at,
        updated_at,
        user_id,
        school_id,
        school_role_id,
        is_active,
        is_admin,
        image_id,
        background_image_id
    )
values(
    uuid_generate_v1(),
    '${nickname}',
    now(),
    now(),
    '${userId}',
    '${schoolId}',
    '${schoolRoleId}',
    true,
    true,
    '${imageId}',
    '${backgroundImageId}'
) returning id;
