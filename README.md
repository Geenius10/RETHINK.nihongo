# RETHINK. Nihongo — Build 18

Performance-focused PWA build.

## What changed
- Lesson start and Vocabulary start no longer trigger network work.
- Only the active JLPT level loads in the background; N5–N1 are no longer parsed all at once.
- Large legacy remote-course storage is retired.
- Progress writes are deferred instead of synchronously serializing data after every tap.
- Read-only checks no longer create thousands of empty SRS records.
- Home is not fully recalculated after every answer.
- Dynamic sentence candidates are capped to a useful working set rather than scanning the whole JLPT database repeatedly.
- Multiple-choice answers are unique and level-local.

## Files
All deployable files are in this one folder. Upload them directly to the site root.
