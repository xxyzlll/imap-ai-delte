export interface MailItem {
  messageId: string; // 唯一标识
  subject: string; // 邮件主题
  content: string; // 预览文本
  date: string; // 发送时间
  selected?: boolean; // 选择状态
} 