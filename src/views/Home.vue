<template>
    <!-- <h1>Welcome Home</h1> -->
    <Login v-if="!loggedIn"></Login>
    <Profile v-if="loggedIn" :user="user"></Profile>
</template>

<script>
    import axios from 'axios';
    import Login from '../components/Login.vue';
    import Profile from '../components/Profile.vue';

    export default {
        data() {
            return {
                user: null
            }
        },
        
        computed: {
            loggedIn(){
                return this.user !== null 
                    && this.user.display_name !== null 
                    && this.user.display_name !== undefined;
            }
        },
        mounted() {
            axios.get('/profile').then(response => {
                this.user = response.data;
            })
            .catch(error => {
                console.log("/profile error: "+ error);
            });
        },

        components: {
            Login,
            Profile
        }
    }
</script>