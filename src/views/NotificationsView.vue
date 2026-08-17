<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Notifications</h1>
        <p class="page-subtitle">{{ unreadCount }} non lue(s)</p>
      </div>
      <button v-if="unreadCount > 0" class="btn btn--ghost" @click="markAll">Tout marquer comme lu</button>
    </div>

    <div class="card card--flush">
      <p v-if="loading" class="state-message"><span class="spinner spinner--dark"></span> Chargement...</p>
      <p v-else-if="errorMessage" class="alert alert--error">{{ errorMessage }}</p>
      <template v-else>
        <div class="item-list">
          <div
            v-for="n in notifications"
            :key="n.id"
            class="item-row"
            :style="!n.isRead ? { borderColor: 'var(--color-primary)' } : {}"
            style="cursor: pointer"
            @click="!n.isRead && markRead(n)"
          >
            <div class="item-row__main">
              <span class="item-row__title">{{ n.title }}</span>
              <span class="item-row__meta">{{ n.message }}</span>
              <span class="item-row__meta">{{ formatDate(n.createdAt) }}</span>
            </div>
            <span v-if="!n.isRead" class="badge badge--confirmed">Nouveau</span>
          </div>
          <p v-if="notifications.length === 0" class="empty">Aucune notification.</p>
        </div>

        <PaginationControl :page="pagination.page" :total-pages="pagination.totalPages" @change="fetchNotifications" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as notificationService from '../services/notification.service';
import PaginationControl from '../components/PaginationControl.vue';

const notifications = ref([]);
const unreadCount = ref(0);
const pagination = ref({ page: 1, totalPages: 1, total: 0, limit: 15 });
const loading = ref(false);
const errorMessage = ref('');

const formatDate = (value) =>
  new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

const fetchNotifications = async (page = 1) => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const result = await notificationService.getMyNotifications({ page, limit: pagination.value.limit });
    notifications.value = result.notifications;
    unreadCount.value = result.unreadCount;
    pagination.value = result.pagination;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Impossible de charger les notifications.';
  } finally {
    loading.value = false;
  }
};

const markRead = async (notification) => {
  await notificationService.markAsRead(notification.id);
  notification.isRead = true;
  unreadCount.value = Math.max(0, unreadCount.value - 1);
};

const markAll = async () => {
  await notificationService.markAllAsRead();
  notifications.value.forEach((n) => (n.isRead = true));
  unreadCount.value = 0;
};

onMounted(() => fetchNotifications());
</script>
