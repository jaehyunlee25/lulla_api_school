insert into file(
    id,
    name,
    type,
    key,
    address,
    size,
    is_active,
    thumbnail_address,
    width,
    height,
    index,
    created_at,
    updated_at
) values (
    uuid_generate_v1(),
    '${fileName}',
    '${type}',
    '${key}',
    '${address}',
    ${size},
    true,
    '${thumbnail_address}',
    ${width},
    ${height},
    0,
    now(),
    now()
) 
returning id;