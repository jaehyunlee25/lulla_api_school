insert into
    request_drug(
        id,
        symptom,
        schedule,
        storage_method,
        dosage,
        medical_type,
        times,
        created_at,
        updated_at,
        drug_cabinet_id,
        content
    )
values
    ${sqlDrugs};
