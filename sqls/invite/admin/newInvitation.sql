insert into
    invitation(
        id,
        type,
        created_at,
        updated_at,
        school_id,
        phone,
        role_name,
        kid_name
    )
values(
    uuid_generate_v1(),
    ${type},
    now(),
    now(),
    '${schoolId}',
    '${phone}',
    '${roleName}',
    '${kidName}'
) returning id;