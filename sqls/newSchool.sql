insert into
    schools(
        id, -- uuid NOT NULL,
        name, -- character varying(255) COLLATE pg_catalog."default",
        address, -- character varying(255) COLLATE pg_catalog."default",
        description, -- character varying(255) COLLATE pg_catalog."default",
        created_at, -- timestamp with time zone NOT NULL,
        updated_at, -- timestamp with time zone NOT NULL,
        tel, -- character varying(255) COLLATE pg_catalog."default",
        admin_name, -- character varying(255) COLLATE pg_catalog."default",
        district_one_id, -- uuid,
        district_two_id, -- uuid,
        institutions_id -- uuid
    )
values(
    uuid_generate_v1(), -- uuid NOT NULL,
    ${name}, -- character varying(255) COLLATE pg_catalog."default",
    ${address}, -- character varying(255) COLLATE pg_catalog."default",
    ${description}, -- character varying(255) COLLATE pg_catalog."default",
    now(), -- timestamp with time zone NOT NULL,
    now(), -- timestamp with time zone NOT NULL,
    ${tel}, -- character varying(255) COLLATE pg_catalog."default",
    ${adminName}, -- character varying(255) COLLATE pg_catalog."default",
    ${districtOneId}, -- uuid,
    ${districtTwoId}, -- uuid,
    ${institutionsId} -- uuid
)
