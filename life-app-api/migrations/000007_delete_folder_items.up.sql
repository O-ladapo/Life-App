ALTER TABLE items
DROP CONSTRAINT IF EXISTS items_folder_id_fkey;

ALTER TABLE items
ADD CONSTRAINT items_folder_id_fkey
FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE;
