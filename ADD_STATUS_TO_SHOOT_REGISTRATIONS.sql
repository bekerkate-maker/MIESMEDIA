-- Add status column to shoot_registrations if it doesn't exist
alter table shoot_registrations 
add column if not exists status text default 'pending';

-- Add check constraint to ensure valid status values
alter table shoot_registrations 
drop constraint if exists shoot_registrations_status_check;

alter table shoot_registrations 
add constraint shoot_registrations_status_check 
check (status in ('pending', 'accepted', 'rejected'));
