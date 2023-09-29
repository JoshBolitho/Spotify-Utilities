<template>
    <div>
        <!-- <h1>Profile page</h1> -->
        <div>
            <h1>Welcome, {{ this.user.display_name }}</h1>
            <img :src="user.images[0].url">
        </div>
        <!-- <h3>Selected playlists: {{ selectedPlaylists.toString() }}</h3> -->

        <ol class="leftPane">
            <h2>Playlists</h2>
            <li v-for="playlist in playlists.items">
                <Playlist :data="playlist" @update:selected="handleUpdateSelected"/>
            </li>
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
                selectedPlaylists: []
            };
        },

        methods:{
            handleUpdateSelected(event){
                //clear all instances of id from the array
                this.selectedPlaylists = this.selectedPlaylists.filter(item => item!==event.id);
                
                // add id to array if the event specifies to add it.
                if(event.selected){
                    this.selectedPlaylists.push(event.id);
                }
            }
        },

        props: ["user"],

        components: { Playlist, OptionsPane },

        mounted() {
            axios.get('/playlists').then(response => {
                // console.log('playlist response: ' +  JSON.stringify(response.data) );
                this.playlists = response.data;
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
