insert into
    kid(
        id,
        name,
        birth,
        gender,
        created_at,
        updated_at
    )
values(
    uuid_generate_v1(),
    '${kidName}',
    '${kidBirth}',
    ${kidGender},
    now(),
    now()
) returning id;