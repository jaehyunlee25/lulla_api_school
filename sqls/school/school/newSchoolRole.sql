insert into
    school_roles(
        id, -- uuid primary key,
        school_id, -- uuid REFERENCES schools (id),
        grade, -- integer DEFAULT 5,
        name, -- character varying(255) COLLATE pg_catalog."default",
        description, -- character varying(255) COLLATE pg_catalog."default",
        created_at, -- timestamp with time zone NOT NULL,
        updated_at -- timestamp with time zone NOT NULL
    )
values(
    uuid_generate_v1(), -- uuid primary key,
    '${schoolId}', -- uuid REFERENCES schools (id),
    ${grade}, -- integer DEFAULT 5,
    '${name}', -- character varying(255) COLLATE pg_catalog."default",
    '${description}', -- character varying(255) COLLATE pg_catalog."default",
    now(), -- timestamp with time zone NOT NULL,
    now() -- timestamp with time zone NOT NULL
)
returning id;
