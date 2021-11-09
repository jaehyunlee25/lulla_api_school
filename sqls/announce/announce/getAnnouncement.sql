select 
  a.id, 
  a.date, 
  a.content, 
  a.meal, 
  a.temperature, 
  a.is_record,
  a.sleep, 
  a.defecation, 
  a.is_confirmed, 
  a.is_reserved, 
  a.is_published,
  CASE 
      WHEN fsr.grade = 0 THEN concat(s.name) 
      WHEN fsr.grade = 2 THEN concat(fu.name, ' ', fsr.name) 
      WHEN fsr.grade = 3 or fsr.grade = 4 THEN concat(c.name,' ',fu.name,' ',fsr.name) 
      WHEN fsr.grade = 5 THEN concat(c.name,' ',k.name,'(',fm.nickname,')') 
  END member_nickname, 
  fm.id member_id, 
  CASE 
      WHEN tsr.grade = 0 THEN concat(ts.name) 
      WHEN tsr.grade = 2 THEN concat(tu.name, ' ', tsr.name) 
      WHEN tsr.grade = 3 or tsr.grade = 4 THEN concat(tc.name,' ',tu.name,' ',tsr.name) 
      WHEN tsr.grade = 5 THEN concat(tc.name,' ',tk.name,'(',tm.nickname,')') 
  END to_member_nickname, 
  tm.id to_member_id,
  s.id school_id, 
  c.id class_id,
  CASE 
      WHEN tsr.grade < 5 THEN 0 
      WHEN tsr.grade = 5 THEN 1 
  END sender,
  s.name school_name, 
  c.name class_name, 
  (
      select array_to_json(
          array(
              select 
                  row_to_json(tmp) 
              from (
                      select 
                          f.id, 
                          f.address, 
                          f.size, 
                          f.thumbnail_address, 
                          f.type, 
                          f.name, 
                          f.width, 
                          f.height, 
                          f.index, 
                          f.duration 
                      from 
                          file f 
                              left join announce_file af on af.file_id = f.id
                      where 
                          af.announce_id = '${annId}' 
                          and (f.type='image' or f.type='video')
                      order by f.index
                  ) tmp
          )
      ) images
  )
from announcement a
  left join members fm on fm.id = a.member_id
  left join users fu on fu.id = fm.user_id
  left join kid k on k.id = fm.kid_id
  left join school_roles fsr on fsr.id = fm.school_role_id
  left join members tm on tm.id = a.to_member_id
  left join school_roles tsr on tsr.id = tm.school_role_id
  left join users tu on tu.id = tm.user_id
  left join kid tk on tk.id = tm.kid_id
  left join schools ts on ts.id = tm.school_id
  left join class tc on tc.id = tm.class_id
  left join schools s on s.id = fm.school_id
  left join class c on c.id = fm.class_id
where a.id = '${annId}';
