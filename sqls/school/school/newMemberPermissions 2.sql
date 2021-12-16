insert into
    member_permissions(
        -- id, -- integer 
        member_id, -- uuid,
        school_id, -- uuid,
        grade, -- integer,
        permissions, -- integer[],
        created_at, -- timestamp with time zone NOT NULL,
        updated_at -- timestamp with time zone NOT NULL,
    )
values(
    '${memberId}', -- uuid,
    '${schoolId}', -- uuid,
    ${grade}, -- integer,
    '${permissions}', -- integer[],
    now(), -- timestamp with time zone NOT NULL,
    now() -- timestamp with time zone NOT NULL,
);
