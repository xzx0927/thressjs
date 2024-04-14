<script setup>

</script>

<template>
    <body>
        <div id="longin">
            <h2>登录</h2>
            <form  action="/index" method="get">
                <label>
                <input type="text" placeholder="用户名"  name="username"/><br>
                <input type="password" placeholder="密码"  name="password"/><br>
                </label>
                <input type="submit" value="登录">
                <input type="button" value="注册">
            </form>
        </div>
    </body>
</template>

<style scoped>
#longin{
  display: block;
  position: fixed;
  right: 0;
  top: 0;
  width: 40vw;
  height: 100vh;
}
h2 {
   text-align: center; 
}

</style>