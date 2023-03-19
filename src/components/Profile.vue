<template>
    <div>
        <h1>Profile page</h1>
        <h1>Welcome, {{ this.user.display_name }}</h1>
        <img :src="user.images[0].url">
        <h2>Playlists</h2>
        <ol>
            <li v-for="playlist in playlists.items">
                <Playlist :data="playlist"/>
            </li>
        </ol>
        
    </div>
</template>
  
<script>
    import Playlist from './Playlist.vue';
    import axios from 'axios';

    export default {
        data() {
            return {
                playlists: null
            };
        },

        props: ["user"],

        components: { Playlist },

        mounted() {
            axios.get('/playlists').then(response => {
                console.log('playlist response: ' +  JSON.stringify(response.data) );
                this.playlists = response.data;
            })
            .catch(error => {
                console.log("/playlists error: "+ error);
            });
        },

    }
</script>


<style>
    ol {
        list-style-type: none;
        padding: 0;
        margin: 0;
    }
</style>
