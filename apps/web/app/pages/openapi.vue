<template>
  <div>
    <el-alert
      title="OpenAPI 文档（本地开发）"
      type="info"
      show-icon
      :closable="false"
      style="margin-bottom: 12px"
    />
    <ClientOnly>
      <div id="swagger-ui" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
useHead(() => ({
  title: 'OpenAPI - 非乐鱼导航'
}))

onMounted(async () => {
  const [{ default: SwaggerUI }] = await Promise.all([
    import('swagger-ui-dist/swagger-ui-es-bundle'),
    import('swagger-ui-dist/swagger-ui.css')
  ])

  SwaggerUI({
    dom_id: '#swagger-ui',
    url: '/api/openapi.json'
  })
})
</script>
