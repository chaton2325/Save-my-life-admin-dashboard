<template>
  <section class="auth-brand">
    <div class="auth-brand__decor">
      <span class="blob blob--1"></span>
      <span class="blob blob--2"></span>
    </div>

    <svg
      class="auth-curve auth-curve--vertical"
      viewBox="0 0 100 800"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M50,0 Q100,200 50,400 Q0,600 50,800 L100,800 L100,0 Z" />
    </svg>
    <svg
      class="auth-curve auth-curve--horizontal"
      viewBox="0 0 400 60"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M0,30 Q100,60 200,30 Q300,0 400,30 L400,60 L0,60 Z" />
    </svg>

    <div class="auth-brand__content">
      <div class="auth-brand__logo">
        <img :src="logo" alt="Save My Life" />
      </div>
      <h1>Save My Life</h1>
      <p>{{ tagline }}</p>
    </div>
  </section>
</template>

<script setup>
import logo from '../assets/logo.jpeg';

defineProps({
  tagline: {
    type: String,
    default: 'Votre santé, notre priorité.',
  },
});
</script>
