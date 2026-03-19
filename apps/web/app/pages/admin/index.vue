<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['admin-auth'] })

if (import.meta.server) {
  await navigateTo('/admin/nav')
} else {
  navigateTo('/admin/nav')
}
</script>

