<template>
  <div class="page page--chat">
    <div class="page-header">
      <div>
        <h1>Messagerie</h1>
        <p class="page-subtitle">Échangez directement avec l'équipe Save My Life</p>
      </div>
    </div>

    <div class="card card--flush chat-card">
      <div ref="listEl" class="chat-list">
        <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
        <template v-else>
          <div
            v-for="message in messages"
            :key="message.id"
            class="chat-bubble"
            :class="message.senderRole === 'admin' ? 'chat-bubble--in' : 'chat-bubble--out'"
          >
            <p class="chat-bubble__body">{{ message.body }}</p>
            <span class="chat-bubble__time">{{ formatTime(message.createdAt) }}</span>
          </div>
          <p v-if="messages.length === 0" class="empty">
            Aucun message pour le moment. Écrivez à l'équipe Save My Life ci-dessous.
          </p>
        </template>
      </div>

      <form class="chat-composer" @submit.prevent="send">
        <input v-model="draft" type="text" placeholder="Votre message..." :disabled="sending" />
        <button type="submit" class="btn btn--primary btn--icon" :disabled="!draft.trim() || sending">
          <span v-if="sending" class="spinner"></span>
          <AppIcon v-else name="send" size="sm" />
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue';
import * as messageService from '../services/message.service';
import AppIcon from '../components/AppIcon.vue';

const messages = ref([]);
const draft = ref('');
const loading = ref(false);
const sending = ref(false);
const listEl = ref(null);
let pollTimer = null;

const formatTime = (value) => new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

const scrollToBottom = () => {
  nextTick(() => {
    if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight;
  });
};

const fetchMessages = async ({ silent = false } = {}) => {
  if (!silent) loading.value = true;
  try {
    const result = await messageService.getMyMessages();
    const grew = result.length > messages.value.length;
    messages.value = result;
    if (grew) scrollToBottom();
  } finally {
    loading.value = false;
  }
};

const send = async () => {
  const body = draft.value.trim();
  if (!body) return;
  sending.value = true;
  try {
    const message = await messageService.sendMyMessage(body);
    messages.value.push(message);
    draft.value = '';
    scrollToBottom();
  } finally {
    sending.value = false;
  }
};

onMounted(async () => {
  await fetchMessages();
  scrollToBottom();
  pollTimer = setInterval(() => fetchMessages({ silent: true }), 15000);
});

onBeforeUnmount(() => clearInterval(pollTimer));
</script>

<style scoped>
.chat-card {
  display: flex;
  flex-direction: column;
  height: min(70vh, 640px);
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
