<template>
  <div class="page page--chat">
    <div class="page-header">
      <div>
        <h1>Messagerie</h1>
        <p class="page-subtitle">Conversations avec les patients et médecins</p>
      </div>
      <button v-if="selectedUserId" class="btn btn--ghost" @click="closeThread">
        <AppIcon name="arrowLeft" size="sm" /> Retour aux conversations
      </button>
    </div>

    <template v-if="!selectedUserId">
      <p v-if="loadingThreads" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <div v-else class="item-list">
        <div v-for="thread in threads" :key="thread.user.id" class="item-row" style="cursor: pointer" @click="openThread(thread.user.id)">
          <div class="item-row__main">
            <span class="item-row__title">{{ thread.user.firstName }} {{ thread.user.lastName }}</span>
            <span class="item-row__meta">{{ thread.user.phoneNumber }} · {{ roleLabel(thread.user.role) }}</span>
            <span class="item-row__meta">{{ thread.lastMessage.body }}</span>
          </div>
          <span v-if="thread.unreadCount > 0" class="badge badge--confirmed">{{ thread.unreadCount }}</span>
        </div>
        <p v-if="threads.length === 0" class="empty">Aucune conversation pour le moment.</p>
      </div>
    </template>

    <div v-else class="card card--flush chat-card">
      <p class="chat-owner">{{ owner?.firstName }} {{ owner?.lastName }} — {{ owner?.phoneNumber }}</p>
      <div ref="listEl" class="chat-list">
        <p v-if="loadingThread" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
        <template v-else>
          <div
            v-for="message in messages"
            :key="message.id"
            class="chat-bubble"
            :class="message.senderRole === 'admin' ? 'chat-bubble--out' : 'chat-bubble--in'"
          >
            <p class="chat-bubble__body">{{ message.body }}</p>
            <span class="chat-bubble__time">{{ formatTime(message.createdAt) }}</span>
          </div>
          <p v-if="messages.length === 0" class="empty">Aucun message dans cette conversation.</p>
        </template>
      </div>
      <form class="chat-composer" @submit.prevent="send">
        <input v-model="draft" type="text" placeholder="Votre réponse..." :disabled="sending" />
        <button type="submit" class="btn btn--primary btn--icon" :disabled="!draft.trim() || sending">
          <span v-if="sending" class="spinner"></span>
          <AppIcon v-else name="send" size="sm" />
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import * as messageService from '../services/message.service';
import AppIcon from '../components/AppIcon.vue';

const threads = ref([]);
const loadingThreads = ref(false);

const selectedUserId = ref(null);
const owner = ref(null);
const messages = ref([]);
const loadingThread = ref(false);
const draft = ref('');
const sending = ref(false);
const listEl = ref(null);

const roleLabel = (role) => ({ patient: 'Patient', medecin: 'Médecin' }[role] || role);
const formatTime = (value) => new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

const scrollToBottom = () => {
  nextTick(() => {
    if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight;
  });
};

const fetchThreads = async () => {
  loadingThreads.value = true;
  try {
    threads.value = await messageService.getThreads();
  } finally {
    loadingThreads.value = false;
  }
};

const openThread = async (userId) => {
  selectedUserId.value = userId;
  loadingThread.value = true;
  try {
    const result = await messageService.getThread(userId);
    owner.value = result.owner;
    messages.value = result.messages;
    scrollToBottom();
  } finally {
    loadingThread.value = false;
  }
};

const closeThread = () => {
  selectedUserId.value = null;
  fetchThreads();
};

const send = async () => {
  const body = draft.value.trim();
  if (!body) return;
  sending.value = true;
  try {
    const message = await messageService.replyToThread(selectedUserId.value, body);
    messages.value.push(message);
    draft.value = '';
    scrollToBottom();
  } finally {
    sending.value = false;
  }
};

onMounted(fetchThreads);
</script>

<style scoped>
.chat-card {
  display: flex;
  flex-direction: column;
  height: min(70vh, 640px);
}
.chat-owner {
  padding: var(--space-3) var(--space-4);
  margin: 0;
  font-weight: 700;
  border-bottom: 1px solid var(--color-border);
}
.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.chat-bubble {
  max-width: 75%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius);
}
.chat-bubble--in {
  align-self: flex-start;
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
}
.chat-bubble--out {
  align-self: flex-end;
  background: var(--color-primary);
  color: #fff;
}
.chat-bubble__body {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}
.chat-bubble__time {
  display: block;
  margin-top: var(--space-1);
  font-size: 0.72rem;
  opacity: 0.7;
}
.chat-composer {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3);
  border-top: 1px solid var(--color-border);
}
.chat-composer input {
  flex: 1;
}
</style>
