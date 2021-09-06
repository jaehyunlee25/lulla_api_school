select
    * 
from
    schools
where
    activated = true
    and institutions_id = '${institutionId}';