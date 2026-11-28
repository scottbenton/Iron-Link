-- In a solo game with one character, the Theme dialog shows no character
-- row: the game holds the theme. Where that character still has a theme of
-- its own, move it onto the game, so the character looks the same and the
-- dialog can change it.
update public.games
set color_scheme = characters.color_scheme
from public.characters
where characters.game_id = games.id
  and games.game_type = 'solo'
  and characters.color_scheme is not null
  and (
    select count(*) from public.characters siblings
    where siblings.game_id = games.id
  ) = 1;

update public.characters
set color_scheme = null
from public.games
where games.id = characters.game_id
  and games.game_type = 'solo'
  and characters.color_scheme is not null
  and (
    select count(*) from public.characters siblings
    where siblings.game_id = characters.game_id
  ) = 1;
