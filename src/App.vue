<script setup lang="ts">
import { computed, ref } from 'vue';
import type { MailItem } from './types';
import axios from './plugins/axios';
import { Delete } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const isDeleteModalVisible = ref(false);
const emails = ref<MailItem[]>([]);
const totalEmails = ref(0);
const emailsToDelete = ref<MailItem[]>([]);
const filterText = ref('Platforms State of the Union');
const filteredEmails = ref<MailItem[]>([]);

// New input fields
const user = ref('2582325957@qq.com');
const password = ref('jwspwnykbgameabi');
const host = ref('imap.qq.com');
const conditions = ref('')
const count = ref(10)

const formData = computed(() => {
  return {
    subject: filterText.value,
    user: user.value,
    password: password.value,
    host: host.value,
    conditions: conditions.value,
    count: count.value
  }
})

function showDeleteModal() {
  axios.post('/api/ai-delete', formData.value).then(response => {
    emailsToDelete.value = response.data;
    isDeleteModalVisible.value = true;
  });
}

function handleSelectionChange(selected: MailItem[]) {
  emailsToDelete.value = selected;

}

function cancel() {
  isDeleteModalVisible.value = false;
}

function confirm() {
  if (!emailsToDelete.value.length) {
    isDeleteModalVisible.value = false;
    return
  }
  axios.post('/api/delete-emails', {
    emailToDeleteData: emailsToDelete.value.map(email => email.messageId),
    ...formData.value
  }).then(_response => {
    ElMessage('删除成功')
    isDeleteModalVisible.value = false;
    getEmails()
  });
}

function getPassword() {
  console.log('getPassword');
  window.open('https://wx.mail.qq.com/account/index?sid=zcUxbowqMFIu62htAJkyQgAA#/verify/gac')
}

function getEmails() {
  axios.post('/api/mail-list', formData.value).then(response => {
    console.log('response.data', response.data);
    emails.value = response.data;
    totalEmails.value = response.data.length;
    filteredEmails.value = response.data; // Initialize filtered emails
  });
}

function removeEmail(emailId: string) {
  emailsToDelete.value = emailsToDelete.value.filter((email: MailItem) => email.messageId !== emailId);
}

getEmails();
</script>

<template>
  <div id="app">
    <div style="text-align: right;margin-top: 20px;">
      <div class="top-search">
        <label for="subject" style="margin-right: 5px;min-width: 50px;">主题:</label>
        <el-input id="subject" v-model="filterText" placeholder="筛选主题" style="margin-right: 10px;" />
        <label for="user" style="margin-right: 5px;min-width: 50px;">用户:</label>
        <el-input id="user" v-model="user" placeholder="User" style="margin-right: 10px;" />
      </div>
      <div class="top-search">
        <label for="password" style="margin-right: 5px;min-width: 50px;">密码:</label>
        <el-input id="password" v-model="password" placeholder="去开启POP3/IMAP/SMTP/Exchange/CardDAV服务"
          style="margin-right: 10px;">
          <template #append>
            <el-button type="primary" @click="getPassword">去获取</el-button>
          </template>
        </el-input>
        <label for="host" style="margin-right: 5px;min-width: 50px;">主机:</label>
        <el-input id="host" v-model="host" placeholder="Host" style="margin-right: 10px;" />
      </div>

      <div class="top-search">
        <label for="password" style="margin-right: 5px;min-width: 80px;">过滤条件:</label>
        <el-input id="password" v-model="conditions" placeholder="新增自定义AI识别过滤条件" style="margin-right: 10px;" />
        <label for="password" style="margin-right: 5px;min-width: 80px;">查询条数:</label>
        <el-input id="password" v-model="count" placeholder="查询条数" style="margin-right: 10px;" />
      </div>

      <div style="margin-top: 20px;padding-right: 10px;">
        <el-button @click="getEmails">查询（{{ filteredEmails.length }}条）</el-button>
        <el-button type="primary" @click="showDeleteModal">AI 删除</el-button>
      </div>
    </div>
    <el-main>
      <el-table :data="filteredEmails" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="subject" label="主题">
          <template #default="scope">
            <span>{{ scope.row.subject }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="时间" width="180"></el-table-column>
      </el-table>
    </el-main>
    <el-dialog v-model="isDeleteModalVisible" width="60vw" :close-on-click-modal="false" align-center>
      <h3 style="margin-top: 0;">您将删除以下邮件({{ emailsToDelete.length }}条)：</h3>
      <el-scrollbar style="overflow: auto;max-height: 60vh;">
        <div v-for="email in emailsToDelete" :key="email.messageId"
          style="display: flex; justify-content: space-between; align-items: center;padding: 5px 10px;gap: 15px;">
          <span style="text-align: left;">{{ email.subject }}</span>
          <el-icon color="red" @click="removeEmail(email.messageId)">
            <Delete />
          </el-icon>
        </div>
      </el-scrollbar>
      <template #footer>
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" @click="confirm">确认删除所有AI识别的无效邮件</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style>
#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 90vw;
}

el-header {
  background-color: #3f51b5;
  color: white;
}

el-main {
  flex: 1;
  background-color: #f5f5f5;
}

.top-search {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.el-table {
  width: 90vw;
  display: flex;
}

.el-table-column {
  flex: 0 0 auto;
}

.el-table-column[prop="content"] {
  flex: 1 1 auto;
}
</style>
