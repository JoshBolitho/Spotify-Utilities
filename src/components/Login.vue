<template>
    <h1>Login page</h1>
    <button @click="login">Login</button>
</template>
  
<script>
    import axios from 'axios';

    export default {

        methods: {
            async login() {
                const response = await axios.get('/login');
                // this.$router.push(response.data.authorizeURL);
                window.location.href = response.data.authorizeURL;
            }
        }
    }
</script>
