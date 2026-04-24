import { REST, Routes, ApplicationCommandOptionType } from 'discord.js';

const configRaw = await Deno.readTextFile("./config.json");
const config = JSON.parse(configRaw)
const token = config.token;
const clientID = config.clientID;

const commands = [
  {
    name: '시간표',
    description: '오늘의 시간표를 불러옵니다',
    options: [
      {
        name: '학년',
        description: '학년을 입력(1, 2, 3)',
        required: true,
        type: ApplicationCommandOptionType.Integer,
        choices: [
          { name: '1', value: '1' },
          { name: '2', value: '2' },
          { name: '3', value: '3' },
        ]
      },
      {
        name: '반',
        description: '반 입력(1, 2, 3, 4)',
        required: true,
        type: ApplicationCommandOptionType.Integer,
        choices: [
            { name: '1', value: '1' },
            { name: '2', value: '2' },
            { name: '3', value: '3' },
            { name: '4', value: '4' },
        ]
      }
    ]
  },
  {
    name: '시간표검색',
    description: '시간표를 불러옵니다.',
    options: [
      {
        name: '학년',
        description: '학년을 입력(1, 2, 3)',
        type: ApplicationCommandOptionType.Integer,
        choices: [
          { name: '1', value: '1' },
          { name: '2', value: '2' },
          { name: '3', value: '3' },
        ],
        required: true,
      },
      {
        name: '반',
        description: '반 입력(1, 2, 3, 4)',
        type: ApplicationCommandOptionType.Integer,
        choices: [
          { name: '1', value: '1' },
          { name: '2', value: '2' },
          { name: '3', value: '3' },
          { name: '4', value: '4' },
        ],
        required: true,
      },
      {
        name: '요일',
        description: '날짜 입력(월, 화, 수, 목, 금)',
        type: ApplicationCommandOptionType.Integer,
        choices: [
          { name: '월요일', value: '0' },
          { name: '화요일', value: '1' },
          { name: '수요일', value: '2' },
          { name: '목요일', value: '3' },
          { name: '금요일', value: '4' },
        ],
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(token);

try {
  console.log('등록중');

  await rest.put(Routes.applicationCommands(clientID), { body: commands });

  console.log('성공');
} catch (error) {
  console.error(error);
}