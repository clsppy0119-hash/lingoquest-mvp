export type Question = {
  id: string;
  prompt: string;
  guide: string;
  choices: string[];
  answer: string;
  tip: string;
};
export const schoolQuestions: Question[] = [
  {
    id: 'school-hello',
    prompt: 'You meet your teacher in the morning. What do you say?',
    guide: '情境：早上遇到老師。請選出最合適的英文問候。',
    choices: ['Good morning!', 'Good night!', 'See you yesterday!'],
    answer: 'Good morning!',
    tip: '中午以前向人問候時，使用 “Good morning”。',
  },
  {
    id: 'school-pencil',
    prompt: 'Choose the correct sentence.',
    guide: '請選出文法正確、表示「這是一枝鉛筆」的英文句子。',
    choices: ['This is a pencil.', 'These is a pencil.', 'This are pencils.'],
    answer: 'This is a pencil.',
    tip: '指一個靠近自己的單數物品時，使用 “This is”。',
  },
  {
    id: 'school-library',
    prompt: 'Complete: “Where ___ the library?”',
    guide: '請選出適合填入空格的 be 動詞，完成詢問圖書館位置的句子。',
    choices: ['is', 'are', 'am'],
    answer: 'is',
    tip: '“The library” 是單數，因此搭配 “is”。',
  },
];
export const questionById = (id: string) => schoolQuestions.find((question) => question.id === id);
