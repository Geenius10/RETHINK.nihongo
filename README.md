# RETHINK. Nihongo — Final

A responsive, installable Japanese-learning PWA for phone, tablet and desktop.

## Core flow
Open the app → press **Continue** → complete the session. The app prioritizes due reviews, then introduces new material automatically across kana, vocabulary, kanji, grammar and sentences.

## Adaptive learning
Japanese→English and English→Japanese are tracked independently. Productive recall (English→Japanese) uses shorter intervals by default and adapts further to Again/Hard/Good/Easy ratings. Sentence tasks are explicitly labeled as SENTENCE.

## Vocabulary / dictionary
The offline app contains the curated course data bundled with this project. When online, Dictionary uses Jisho's word search endpoint, which is based on JMdict/JMnedict data. Search results can be added directly to the learner's personal SRS. The guided course also caches JLPT vocabulary online over time so the learning pool grows without forcing the user to browse or manage decks.

JMdict is maintained by the Electronic Dictionary Research and Development Group (EDRDG): https://www.edrdg.org/jmdict/j_jmdict.html
Jisho: https://jisho.org/

## Install
Serve this folder over HTTPS (or localhost), open it in the browser, and use the platform's Add to Home Screen / Install App command. Full dictionary search requires an internet connection; installed course content and saved learning data continue to work offline.


## Guided progression update
The course now uses prerequisite-based progression instead of exposing every exercise direction immediately. Beginner flow is: vocabulary recognition → grammar lesson → grammar practice → sentence reading → word production → sentence production. Sentence tasks unlock only after their required core vocabulary and grammar have been introduced. English → Japanese word production unlocks only after the easier Japanese → English direction is stable.
