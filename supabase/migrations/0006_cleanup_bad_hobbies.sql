-- Remove existing custom hobbies that fail the app's moderation checks.
-- Related user_hobbies rows are removed by the existing on delete cascade.
with normalized_hobbies as (
  select
    id,
    name,
    lower(name) as lower_name,
    trim(
      regexp_replace(
        regexp_replace(
          translate(lower(name), '0!|134@$57', 'oiieaassst'),
          '[^a-z0-9]+',
          ' ',
          'g'
        ),
        '[[:space:]]+',
        ' ',
        'g'
      )
    ) as spaced
  from public.hobbies
),
moderated_hobbies as (
  select
    id,
    name,
    lower_name,
    spaced,
    regexp_replace(spaced, '[[:space:]]+', '', 'g') as compact,
    case
      when spaced = '' then array[]::text[]
      else regexp_split_to_array(spaced, '[[:space:]]+')
    end as terms
  from normalized_hobbies
),
blocked_hobbies as (
  select id
  from moderated_hobbies
  where
    char_length(trim(name)) < 2
    or char_length(trim(name)) > 40
    or lower_name ~* '(https?://|(^|[^a-z0-9])www\.|[a-z0-9.-]+\.(com|net|org|io|gg|xyz|app|dev)([^a-z0-9]|$)|@[a-z0-9_.-]{2,})'
    or spaced !~ '[a-z]'
    or exists (
      select 1
      from unnest(terms) as term(value)
      where term.value = any (array[
        'adult',
        'boobs',
        'cocaine',
        'drugs',
        'erotic',
        'fetish',
        'gambling',
        'gore',
        'heroin',
        'hookup',
        'meth',
        'nude',
        'nudes',
        'nsfw',
        'porn',
        'porno',
        'sex',
        'sexy',
        'suicide',
        'terrorism',
        'weed',
        'ahole',
        'anus',
        'ashole',
        'asholes',
        'ass',
        'asses',
        'assface',
        'asshole',
        'assholes',
        'asswipe',
        'azzhole',
        'bastard',
        'bastards',
        'biatch',
        'bitch',
        'bitches',
        'bollock',
        'boner',
        'bullshit',
        'clit',
        'cock',
        'crap',
        'cunt',
        'dick',
        'dildo',
        'douche',
        'dyke',
        'fag',
        'faggot',
        'felch',
        'fellatio',
        'fook',
        'foreskin',
        'fvck',
        'goddamn',
        'homo',
        'jackass',
        'jizz',
        'knob',
        'kunt',
        'muff',
        'nigger',
        'piss',
        'prick',
        'pube',
        'queer',
        'shit',
        'skank',
        'slut',
        'smeg',
        'spunk',
        'twat',
        'vagina',
        'viagra',
        'vulva',
        'wank',
        'whore'
      ])
    )
    or compact like any (array[
      '%anal%',
      '%blowjob%',
      '%camgirl%',
      '%camsex%',
      '%childporn%',
      '%cocksuck%',
      '%deepfakeporn%',
      '%escort%',
      '%fack%',
      '%fentanyl%',
      '%fck%',
      '%fuck%',
      '%fuk%',
      '%genital%',
      '%handjob%',
      '%hentai%',
      '%intercourse%',
      '%masturbat%',
      '%murder%',
      '%naked%',
      '%onlyfans%',
      '%orgasm%',
      '%phuck%',
      '%prostitut%',
      '%selfharm%',
      '%sexting%',
      '%stripclub%',
      '%xxx%'
    ])
)
delete from public.hobbies
using blocked_hobbies
where public.hobbies.id = blocked_hobbies.id;
