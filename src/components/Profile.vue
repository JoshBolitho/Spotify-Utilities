<template>
    <div>
        <div>
            <h1>Welcome, {{ this.user.display_name }}</h1>
            <img :src="user.images[0].url">
        </div>

        <ol class="leftPane">
            
            <div v-if="playlistLoaded">
                <h2>Playlists</h2>
                <li v-for="playlist of playlists">
                    <!-- <p>{{ playlist.name }} {{ playlist.id }} {{ playlist.images }}</p> -->
                    <Playlist :data="playlist" @update:selected="handleUpdateSelected"/>
                </li>
            </div>
    
            <div v-if="!playlistLoaded">
                <p>Playlists loading</p>
            </div>
            
        </ol>

        <div class="rightPane">
            <OptionsPane :playlists="this.selectedPlaylists"/>
        </div>
    </div>
</template>


<script>
    import axios from 'axios';
    import Playlist from './Playlist.vue';
    import OptionsPane from './OptionsPane.vue';

    export default {
        data() {
            return {
                playlists: [],
                playlistLoaded: false,
                selectedPlaylists: []

            };
        },

        methods:{
            handleUpdateSelected(event){
                //clear all instances of id from the array
                this.selectedPlaylists = this.selectedPlaylists.filter(item => item.id!==event.id);
                
                // add id to array if the event specifies to add it.
                if(event.selected){
                    this.selectedPlaylists.push({id: event.id, name: event.name});
                }
            }
        },

        props: ["user"],

        components: { Playlist, OptionsPane },

        async mounted() {
            axios.get('/playlists').then(response => {
                console.log
                this.playlists = response.data;
                this.playlistLoaded = true;
            })
            .catch(error => {
                console.log("/playlists error: "+ error);
            });
        }
    }
</script>


<style>
    .leftPane {
    float: left;
    width: 50%;
    }
    .RightPane {
    float: right;
    width: 50%;
    }

    ol {
        list-style-type: none;
        padding: 0;
        margin: 0;
    }
</style>
