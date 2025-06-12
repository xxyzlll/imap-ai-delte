export const config = {
    imap: {
        user: '', 
        password: '',  // ⚠️ 需替换成QQ邮箱授权码（非QQ密码）[2][7]
        host: 'imap.qq.com',    // ✅ 服务器地址改为QQ专属地址 [3][6]
        port: 993,              // 保持默认（QQ强制SSL端口）
        tls: true,              // 必须启用TLS加密 [3][8]
        authTimeout: 10000,     // 建议延长至10秒（防止网络波动超时）
        tlsOptions: {           // ⚠️ 新增：解决证书校验问题
            rejectUnauthorized: false  // 部分网络需跳过证书验证（测试后建议开启）
        }
    }
};

export const AIConfig = {
    DeepSeek: {
        baseURL: 'https://api.deepseek.com',
        apiKey: '',
        model: "deepseek-chat",
    },
    kiMi: {
        baseURL: "https://api.moonshot.cn/v1",
        apiKey: '',
        model: "moonshot-v1-8k",
    }
}
