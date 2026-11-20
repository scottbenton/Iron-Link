-- Where an entry's image sits in its square icon (#271), stored like a
-- character portrait's: the centre of the visible part as a fraction of the
-- image's width and height, and a zoom of 1 or more. Null means centred at 1,
-- which is how every image was shown before. The file itself is never
-- cropped, so opening the image full size still shows the whole upload.

alter table public.world_entries
  add column image_position_x numeric null,
  add column image_position_y numeric null,
  add column image_scale numeric null;
