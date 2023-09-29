<template>
    <h1>Welcome to the backup page</h1>
    <p>{{ this.playlistData.toString() }}</p>
</template>

<script>
    import { mapState } from 'vuex'
    import axios from 'axios';
    

    export default {

        
        data() {
            return {
                playlistData: []
            }
        },
        
        computed: {
            ...mapState({
                playlists: 'dataToPass'
            })
        },

        mounted() {
            for (const playlistID of this.playlists){
                axios.get('/Playlist', { params: {playlist: playlistID}}).then(response => {
                    this.playlistData.push(response)
                    console.log('loaded a new playlist:'+response);
                })
                .catch(error => {
                    console.log("/profile error: "+ error);
                });
            }
        },

        components: {
        }
    }
</script>