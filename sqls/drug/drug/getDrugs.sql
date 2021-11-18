select 
    d.id, 
    d.date, 
    d.is_reserved, 
    d.is_published, 
    (select 
        array_to_json(
            array(
                select 
                    row_to_json(item) 
                from
                    (select 
                        r.id, 
                        r.symptom, 
                        r.schedule, 
                        r.storage_method, 
                        r.dosage, 
                        r.is_confirmed, 
                        r.medical_type, 
                        k.name, 
                        f.id signature_id, 
                        f.address signature_image, 
                        r.content,
                        r.times, 
                        r.performer 
                    from 
                        request_drug r 
                    where 
                        r.drug_cabinet_id = d.id ) item
            )
    ) drug) 
from 
    drug_cabinet d
    join members m on m.id = d.member_id 
    join kid k on k.id = m.kid_id
    join schools s on m.school_id = s.id
    left join file f on f.id = d.signature_id
    left join chat c on c.id = d.chat_id
where 
    d.id = '${drugCabinetId}' 
    and d.is_published = true;