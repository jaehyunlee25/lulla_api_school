insert into
    invitation(
        id,
        type,
        created_at,
        updated_at,
        class_id,
        school_id,
        phone,
        role_name,
        kid_name,
        inviter_id
    )
values(
    uuid_generate_v1(),
    ${type},
    now(),
    now(),
    '${classId}',
    '${schoolId}',
    '${phone}',
    '${roleName}',
    '${kidName}',
    '${memberId}'
) returning id;