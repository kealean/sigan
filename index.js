import { Client, Events, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, MessageFlags, ChannelType, Partials } from "discord.js";
import { readFileSync } from 'fs';

// --- 기본 설정 ---
const { token } = JSON.parse(readFileSync('./config.json', 'utf-8'));
const OWNER_ID = '682792713485418497';
import Timetable from 'comcigan-parser';
const timetable = new Timetable();

var r;
var link;

// --- 클라이언트 생성 ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});

// --- Dokdo 핸들러 ---
import Dokdo from 'dokdo';
const DokdoHandler = new Dokdo.Client(client, {
    aliases: ['dokdo', 'dok'],
    prefix: '!',
    owners: [OWNER_ID, '1238153842806362253']
});

client.on('messageCreate', async message => {
    if (message.content === 'ping') return message.channel.send('Pong') // handle commands first
    await DokdoHandler.run(message) // try !dokdo
})

// --- 이벤트 핸들러 ---

// 봇 준비 완료
client.on(Events.ClientReady, () => {
    console.log(`로그인 완료: ${client.user.tag}`);
});

// 슬래시 커맨드
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === '시간표') {
        // [필수] 서버 환경에서 3초 타임아웃 방지를 위해 무조건 첫 줄에 배치
        await interaction.deferReply();

        var dd;
        r = random();

        if(r>0.5){
            link = "https://i.imgur.com/ixYYyAh.png";
        }else{
            link="https://i.imgur.com/QcvNpvR.png"
        }

        const gr = interaction.options.getInteger('학년')
        const cl = interaction.options.getInteger('반')
        const day = interaction.options.getInteger('요일');
        switch(day){
            case 0:
                dd = "월요일";
                break;
            case 1:
                dd = "화요일"
                break;
            case 2:
                dd = "수요일"
                break;
            case 3:
                dd = "목요일"
                break;
            case 4:
                dd = "금요일"
                break;
        }

        try {
            const result = await test(interaction);

            if (!result || result.trim() === "") {
                return await interaction.editReply('해당 날짜의 시간표 데이터가 없습니다.');
            }
            const embed = new EmbedBuilder().setColor(0xa2bffe).setTitle(`${dd}`).setAuthor({name: `${gr}학년 ${cl}반`}).setImage(`${link}`).setDescription(`${result}`);

            // deferReply 이후에는 editReply를 사용해야 함
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('시간표 처리 중 에러:', error);
            // 에러 발생 시에도 응답을 마무리지어줘야 함
            await interaction.editReply('시간표를 가져오는 중에 오류가 발생했습니다.');
        }
    }
    else if(interaction.commandName === '오늘시간표'){
        await interaction.deferReply();

        const gr = interaction.options.getInteger('학년')
        const cl = interaction.options.getInteger('반')
        r = random();

        if(r>0.5){
            link = "https://i.imgur.com/ixYYyAh.png";
        }else{
            link="https://i.imgur.com/QcvNpvR.png"
        }

        const now = new Date();

        const year = now.getFullYear();
        const month = now.getMonth() + 1;    // 3 (0이 1월이라 +1 필수!)
        const date = now.getDate();          // 19
        try {
            const result = await test(interaction);

            if (!result || result.trim() === "") {
                return await interaction.editReply('해당 날짜의 시간표 데이터가 없습니다.');
            }

            const embed = new EmbedBuilder().setColor(0xa2bffe).setTitle(`${month}/${date}`).setAuthor({name: `${gr}학년 ${cl}반`}).setDescription(`${result}`).setImage(`${link}`).setFooter({text: `${year}년 ${month}월 ${date}일`});

            // deferReply 이후에는 editReply를 사용해야 함
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('시간표 처리 중 에러:', error);
            // 에러 발생 시에도 응답을 마무리지어줘야 함
            await interaction.editReply('시간표를 가져오는 중에 오류가 발생했습니다.');
        }
    }
});

const test = async (interaction) => {
    // 매번 초기화하지 않고 전역 변수로 관리하는 게 빠르지만,
    // 현재 구조를 유지하며 에러를 방지합니다.
    await timetable.init();
    const school = await timetable.search('경기게임마이스터고등학교');
    timetable.setSchool(school[0].code);

    const result = await timetable.getTimetable()

    const now = new Date();

    // 사용자가 입력한 값 (Integer 확인!)
    const g = interaction.options.getInteger('학년');
    const c = interaction.options.getInteger('반');
    const d = interaction.options.getInteger('요일') ?? now.getDay()-1; // Integer로 명확히 처리

    // 서버 환경에서 undefined 에러 방지를 위한 체이닝 확인
    if (!result[g] || !result[g][c] || !result[g][c][d]) {
        return "";
    }

    const dayData = result[g][c][d];

    if (!Array.isArray(dayData) || dayData.length === 0) return "";

    return dayData
        .filter(item => item && item.subject && item.subject !== "")
        .map(item => `${item.classTime}교시: ${item.subject}(${item.teacher || '미상'})`)
        .join('\n');
};

function random(){
    return Math.random();
}


// --- 봇 로그인 ---
client.login(token);

// --- 오류 처리 ---
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});