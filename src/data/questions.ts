export type Question = {
  id: string;
  prompt: string;
  choices: string[];
  answer: string;
  tip: string;
};
export const schoolQuestions: Question[] = [
  {
    id: 'school-hello',
    prompt: 'You meet your teacher in the morning. What do you say?',
    choices: ['Good morning!', 'Good night!', 'See you yesterday!'],
    answer: 'Good morning!',
    tip: 'Use “Good morning” before noon.',
  },
  {
    id: 'school-pencil',
    prompt: 'Choose the correct sentence.',
    choices: ['This is a pencil.', 'These is a pencil.', 'This are pencils.'],
    answer: 'This is a pencil.',
    tip: 'Use “this is” for one nearby object.',
  },
  {
    id: 'school-library',
    prompt: 'Complete: “Where ___ the library?”',
    choices: ['is', 'are', 'am'],
    answer: 'is',
    tip: '“The library” is singular, so it takes “is.”',
  },
];
export const questionById = (id: string) => schoolQuestions.find((question) => question.id === id);
