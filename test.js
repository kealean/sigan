import { Client, Events, GatewayIntentBits, ChannelType, Partials, EmbedBuilder } from "discord.js";
import { readFileSync } from 'fs';

// --- 설정 파일 읽기 ---
const { token } = JSON.parse(readFileSync('./config.json', 'utf-8'));
const OWNER_ID = '682792713485418497'; // 님의 디스코드 ID

console.log('테스트 파일을 실행합니다...');

// --- 클라이언트 생성 ---
const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,  // DM 수신
        GatewayIntentBits.MessageContent   // DM 내용 읽기
    ],
    partials: [Partials.Channel] // DM 채널 이벤트 처리에 필수
});

// --- 봇 준비 완료 이벤트 ---
client.on(Events.ClientReady, () => {
    console.log(`[테스트] 봇이 로그인했습니다: ${client.user.tag}`);
    console.log('[테스트] 봇에게 DM을 보내거나, 전달된 DM에 답장하여 기능을 확인해주세요.');
});

// --- 메시지 수신 이벤트 ---
client.on(Events.MessageCreate, async message => {
    // 봇 메시지는 무시
    if (message.author.bot) return;

    // DM 채널에서 온 메시지인지 확인
    if (message.channel.type === ChannelType.DM) {
        console.log(`[테스트] DM 수신: ${message.author.tag}로부터 "${message.content}"`);

        // 봇 소유자(OWNER_ID)가 봇이 전달한 메시지에 답장하는 경우
        if (message.author.id === OWNER_ID && message.reference) {
            try {
                const repliedToMessage = await message.channel.messages.fetch(message.reference.messageId);
                // 답장한 메시지가 봇이 보낸 것이고, 임베드가 있으며, 임베드에 원본 사용자 ID가 포함되어 있는지 확인
                if (repliedToMessage.author.id === client.user.id && repliedToMessage.embeds.length > 0) {
                    const originalEmbed = repliedToMessage.embeds[0];
                    const originalUserId = originalEmbed.footer?.text.replace('User ID: ', '');

                    if (originalUserId) {
                        const originalUser = await client.users.fetch(originalUserId);
                        await originalUser.send(`**[관리자 답장]**\n${message.content}`);
                        await message.reply('✅ 답장을 성공적으로 보냈습니다.');
                        console.log(`[테스트] ${originalUser.tag}에게 답장 전송 완료.`);
                    } else {
                        await message.reply('❌ 답장할 원본 사용자 ID를 찾을 수 없습니다.');
                        console.log(`[테스트] 답장 실패: 원본 사용자 ID 없음.`);
                    }
                }
            } catch (error) {
                console.error(`[테스트] 답장 처리 중 오류 발생:`, error);
                await message.reply('❌ 답장을 보내는 중 오류가 발생했습니다.');
            }
        // 다른 유저가 봇에게 DM을 보낸 경우 (소유자에게 전달)
        } else if (message.author.id !== OWNER_ID) {
            const owner = await client.users.fetch(OWNER_ID).catch(() => null);

            if (owner) {
                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('새로운 DM 도착')
                    .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                    .setDescription(message.content)
                    .setFooter({ text: `User ID: ${message.author.id}` }) // 원본 사용자 ID를 푸터에 저장
                    .setTimestamp();

                await owner.send({ embeds: [embed] });
                await message.author.send('메시지가 서버 관리자에게 성공적으로 전달되었습니다.');
                console.log(`[테스트] ${message.author.tag}의 DM을 소유자에게 전달 완료.`);
            } else {
                console.error(`[테스트] 오류: 봇 소유자(${OWNER_ID})를 찾을 수 없습니다. ID를 확인해주세요.`);
            }
        }
    }
});

// --- 봇 로그인 ---
console.log('봇 로그인을 시도합니다...');
client.login(token);