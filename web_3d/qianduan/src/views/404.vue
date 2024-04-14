<script setup>

</script>

<template>
   <el-result
        icon="warning"
        title="404提示"
        sub-title="你找的页面不存在"
      >
        <template #extra>
          <el-button type="primary" @click="$router.push('/')">回到登录页面</el-button>
          <el-button type="primary" @click="$router.push('/index')">回到首页</el-button>
        </template>
      </el-result>
</template>

<style scoped>

</style>