/** @typedef {{ id: string; num: string; title: string; desc: string; instructions: string; type: 'learn' | 'practice' }} LessonDef */

/** @type {Record<string, { label: string; lessons: LessonDef[] }>} */
export const lessonChapters = {
  intro: {
    label: 'Introduction',
    lessons: [
      {
        id: 'intro-1',
        num: 'Intro · Lesson 1',
        title: 'Introduction to your SENSO device',
        desc: 'Get to know your SENSO braille learning device — its buttons, layout, and how it works.',
        instructions:
          'When you are ready to begin, press the square button on your SENSO and follow along with the audio. It will take you through what each button does.',
        type: 'learn',
      },
      {
        id: 'intro-2',
        num: 'Intro · Lesson 2',
        title: 'Number labeling of the 6-cell grid',
        desc: 'Learn how each of the 6 positions on the braille cell grid is numbered and what they represent.',
        instructions:
          'When you are ready to begin, press the square on your SENSO and follow along with the audio. After the lesson finishes, click the complete button and it will update your accuracy. Keep trying the lesson until your accuracy is 100!',
        type: 'learn',
      },
    ],
  },
  ch1: {
    label: 'Chapter 1 — The Alphabet and Numbers',
    lessons: [
      {
        id: 'ch1-1',
        num: 'Chapter 1 · Lesson 1',
        title: 'The Alphabet: Letters A–J',
        desc: 'In this lesson, we will go through the alphabet, starting with letters A–J.',
        instructions:
          'When you are ready to begin the lesson, press the square on your SENSO and follow along with the lesson audio. After the lesson finishes, click the complete button and it will update your accuracy. Keep trying the lesson until your accuracy is 100!',
        type: 'learn',
      },
      {
        id: 'ch1-2',
        num: 'Chapter 1 · Lesson 2',
        title: 'The Alphabet: Letters K–T',
        desc: 'In this lesson, we will continue to go through the alphabet, starting with letters K–T.',
        instructions:
          'When you are ready to begin the lesson, press the square on your SENSO and follow along with the lesson audio. After the lesson finishes, click the complete button and it will update your accuracy. Keep trying the lesson until your accuracy is 100!',
        type: 'learn',
      },
      {
        id: 'ch1-3',
        num: 'Chapter 1 · Lesson 3',
        title: 'The Alphabet: Letters U–Z',
        desc: 'In this lesson, we will finish learning the last set of letters in the alphabet, starting with letters U–Z.',
        instructions:
          'When you are ready to begin the lesson, press the square on your SENSO and follow along with the lesson audio. After the lesson finishes, click the complete button and it will update your accuracy. Keep trying the lesson until your accuracy is 100!',
        type: 'learn',
      },
      {
        id: 'ch1-4',
        num: 'Chapter 1 · Lesson 4',
        title: 'Practice — The Alphabet',
        desc: 'In this lesson, we will practice the letters of the alphabet that were taught to you in lessons 1–3.',
        instructions:
          'When you are ready to begin the lesson, press the square on your SENSO and follow along with the lesson audio. After the lesson finishes, click the complete button and it will update your accuracy. Keep trying the lesson until your accuracy is 100!',
        type: 'practice',
      },
      {
        id: 'ch1-5',
        num: 'Chapter 1 · Lesson 5',
        title: 'Learn — Numbers 0–4',
        desc: 'In this lesson, we will go through numbers 0–4.',
        instructions:
          'When you are ready to begin the lesson, press the square on your SENSO and follow along with the lesson audio. After the lesson finishes, click the complete button and it will update your accuracy. Keep trying the lesson until your accuracy is 100!',
        type: 'learn',
      },
      {
        id: 'ch1-6',
        num: 'Chapter 1 · Lesson 6',
        title: 'Learn — Numbers 5-9',
        desc: 'In this lesson, we will go through numbers 5-9.',
        instructions:
          'When you are ready to begin the lesson, press the square on your SENSO and follow along with the lesson audio. After the lesson finishes, click the complete button and it will update your accuracy. Keep trying the lesson until your accuracy is 100!',
        type: 'learn',
      },
      {
        id: 'ch1-7',
        num: 'Chapter 1 · Lesson 7',
        title: 'Practice — Numbers 0–9',
        desc: 'In this lesson, we will practice the numbers that were taught to you in lesson 5.',
        instructions:
          'When you are ready to begin the lesson, press the square on your SENSO and follow along with the lesson audio. After the lesson finishes, click the complete button and it will update your accuracy. Keep trying the lesson until your accuracy is 100!',
        type: 'practice',
      },
    ],
  },
  ch2: {
    label: 'Chapter 2 — Grade 2 Braille',
    lessons: [
      {
        id: 'ch2-1',
        num: 'Chapter 2 · Lesson 1',
        title: 'Learn — but, can, do, every, from',
        desc: 'Introduction to one-cell whole word contractions: but, can, do, every, from.',
        instructions:
          'When you are ready to begin the lesson, press the square on your SENSO and follow along with the audio. After the lesson finishes, click the complete button and it will update your accuracy. Keep trying the lesson until your accuracy is 100!',
        type: 'learn',
      },
      {
        id: 'ch2-2',
        num: 'Chapter 2 · Lesson 2',
        title: 'Learn — go, have, just, knowledge, like',
        desc: 'Continue learning one-cell whole word contractions: go, have, just, knowledge, like.',
        instructions:
          'When you are ready to begin the lesson, press the square on your SENSO and follow along with the audio. After the lesson finishes, click the complete button and it will update your accuracy. Keep trying the lesson until your accuracy is 100!',
        type: 'learn',
      },
      {
        id: 'ch2-3',
        num: 'Chapter 2 · Lesson 3',
        title: 'Learn — more, not, people, quite, rather',
        desc: 'Continue learning one-cell whole word contractions: more, not, people, quite, rather.',
        instructions:
          'When you are ready to begin the lesson, press the square on your SENSO and follow along with the audio. After the lesson finishes, click the complete button and it will update your accuracy. Keep trying the lesson until your accuracy is 100!',
        type: 'learn',
      },
      {
        id: 'ch2-4',
        num: 'Chapter 2 · Lesson 4',
        title: 'Practice — One-cell Whole Word Contractions',
        desc: 'Practice all one-cell whole word contractions learned in lessons 1–3.',
        instructions:
          'When you are ready to begin the lesson, press the square on your SENSO and follow along with the audio. After the lesson finishes, click the complete button and it will update your accuracy. Keep trying the lesson until your accuracy is 100!',
        type: 'practice',
      },
      {
        id: 'ch2-5',
        num: 'Chapter 2 · Lesson 5',
        title: 'Learn — and, for, of, the, with',
        desc: 'Learn strong contraction words: and, for, of, the, with.',
        instructions:
          'When you are ready to begin the lesson, press the square on your SENSO and follow along with the audio. After the lesson finishes, click the complete button and it will update your accuracy. Keep trying the lesson until your accuracy is 100!',
        type: 'learn',
      },
      {
        id: 'ch2-6',
        num: 'Chapter 2 · Lesson 6',
        title: 'Practice — Strong Contraction Words',
        desc: 'Practice the strong contraction words learned in lesson 5.',
        instructions:
          'When you are ready to begin the lesson, press the square on your SENSO and follow along with the audio. After the lesson finishes, click the complete button and it will update your accuracy. Keep trying the lesson until your accuracy is 100!',
        type: 'practice',
      },
      {
        id: 'ch2-7',
        num: 'Chapter 2 · Lesson 7',
        title: 'Learn — Grade 2 Mixed Practice',
        desc: 'Mixed practice covering all grade 2 braille content learned so far.',
        instructions:
          'When you are ready to begin the lesson, press the square on your SENSO and follow along with the audio After the lesson finishes, click the complete button and it will update your accuracy. Keep trying the lesson until your accuracy is 100!',
        type: 'learn',
      },
      {
        id: 'ch2-8',
        num: 'Chapter 2 · Lesson 8',
        title: 'Practice — Final Review',
        desc: 'A comprehensive final review of all grade 2 braille content.',
        instructions:
          'When you are ready to begin the lesson, press the square on your SENSO and follow along with the audio. After the lesson finishes, click the complete button and it will update your accuracy. Keep trying the lesson until your accuracy is 100!',
        type: 'practice',
      },
    ],
  },
}
