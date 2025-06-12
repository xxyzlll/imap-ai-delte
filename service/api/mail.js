import express from 'express';
import imaps from 'imap-simple';
import dayjs from 'dayjs';
import OpenAI from 'openai';
import { AIConfig } from '../config/index.js';

const router = express.Router();
const selectAI = AIConfig.DeepSeek;
const openai = new OpenAI({
    baseURL: selectAI.baseURL,
    apiKey: selectAI.apiKey
});
const ModelName = selectAI.model;

function createImapConfig(user, password, host) {
    return {
        imap: {
            user: user,
            password: password,
            host: host,
            port: 993,
            tls: true,
            authTimeout: 10000,
            tlsOptions: {
                rejectUnauthorized: false
            }
        }
    };
}

async function fetchEmails(imapConfig, subjectFilter, count) {
    const connection = await imaps.connect(imapConfig);
    await connection.openBox('INBOX', true);

    const conditions = [
        ['SINCE', new Date(Date.now() - 24 * 3600 * 1000 * 365 * 5).toISOString()]
    ];
    if (subjectFilter) {
        conditions.push(['SUBJECT', subjectFilter])
    }

    console.log(conditions);

    const results = await connection.search(conditions, {
        bodies: ['HEADER'], markSeen: false
    });

    if (results.length === 0) {
        connection.end();
        return [];
    }

    const emails = results.map(msg => {
        const data = msg.parts[0].body;
        return {
            subject: data.subject[0],
            messageId: msg.attributes.uid,
            date: new Date(data.date)
        };
    });

    emails.sort((a, b) => b.date - a.date);

    console.log('count', count);

    return emails.map(email => ({
        ...email,
        date: dayjs(email.date).format('YYYY-MM-DD HH:mm:ss')
    })).slice(0, count || emails.length);
}

router.post('/mail-list', async (req, res) => {
    const { user, password, host, subject, count } = req.body;
    const imapConfig = createImapConfig(user, password, host);

    try {
        const dataList = await fetchEmails(imapConfig, subject, count);

        res.json({
            status: 'success',
            message: 'Emails retrieved successfully',
            data: dataList
        });
    } catch (err) {
        console.log('err', err);

        res.status(500).json({
            status: 'error',
            message: 'Failed to process request',
            error: err.toString()
        });
    }
});

async function connectDeepSeek(dataList, conditions = '') {
    try {
        console.log('conditions', conditions);
        const messages = [
            {
                role: 'system',
                content: `你是一个邮件分析专家，请根据以下邮件内容的subject字段进行分析，判断是否为如下特征的邮件:
                    - 广告类：促销/赌博/贷款关键词 + 无收件人姓名（例："限时折扣!"）、标题包含明显的广告标识
                    - 欺诈类：恐吓话术 + 索取隐私（例："账号异常! 点此验证")
                    - AI生成特征：句式重复率高 + 不自然符号（例："Hi [Name], see our $$$ offer!"）
                    - 低质无效：空主题/乱码
                    - 验证类通知（如"[GitHub] Verify your device"）
                另外附加条件如下：${conditions}

                判断完毕后将所有的符合特征的邮件原始数据格式组合成一个新的数组给我，并在每一项的subject字段最前面拼接：'符合筛选特征：'这部分文字，你只能输出 JSON 格式数据，
                输出规范如下：
                {
                    spamEmails:[{
                        subject: '符合筛选特征：[GitHub] Please verify your device',
                        messageId: '<64ab67b0347b2_3ebbd07053677@lowworker-5989bdd6fb-4g42c.mail>',
                        date: '2023-07-10 10:06:40'
                    }]
                }`
            },
            {
                role: 'user',
                content: `邮件列表如下：` + JSON.stringify(dataList)
            },
        ];

        const completion = await openai.chat.completions.create({
            messages: messages,
            model: ModelName,
            response_format: { "type": "json_object" }
        });

        console.log('completion', completion);

        const data = JSON.parse(completion.choices[0].message.content)
        console.log('data----', data);
        return data.spamEmails
    } catch (error) {
        console.error('Error connecting to DeepSeek API:', error);
        return [];
    }
}

router.post('/ai-delete', async (req, res) => {
    const { user, password, host, subject, conditions, count } = req.body;
    const imapConfig = createImapConfig(user, password, host);

    try {
        const dataList = await fetchEmails(imapConfig, subject, count);
        const filteredDataList = await connectDeepSeek(dataList, conditions);

        res.json({
            status: 'success',
            message: 'Filtered data retrieved successfully',
            data: filteredDataList
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to process request',
            error: err.toString()
        });
    }
});

router.post('/delete-emails', async (req, res) => {
    const { user, password, host, emailToDeleteData = [] } = req.body;
    const imapConfig = createImapConfig(user, password, host);

    try {
        const connection = await imaps.connect(imapConfig);
        await connection.openBox('INBOX', false);

        if (emailToDeleteData.length === 0) {
            res.json({
                status: 'success',
                message: 'No emails to delete',
                data: []
            });
            return connection.end();
        }

        console.log('emailToDeleteData', emailToDeleteData);

        await connection.deleteMessage(emailToDeleteData);
        connection.end();

        res.json({
            status: 'success',
            message: 'Emails deleted successfully',
            data: emailToDeleteData
        });

        // Clear the stored message IDs
        emailToDeleteData.length = 0;
    } catch (err) {
        console.log('err', err);

        res.status(500).json({
            status: 'error',
            message: 'Failed to delete emails',
            error: err.toString()
        });
    }
});

export default router; 