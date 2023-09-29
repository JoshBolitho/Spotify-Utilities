<template>
    <h1>Options</h1>
    <h2>{{ playlists.length }} {{ playlists.length == 1 ? "playlist" : "playlists" }} selected.</h2>
    <h3 v-if="playlists.length == 0" > Select a playlist to get started.</h3>
    <h3 v-if="playlists.length == 1" @click="backup">Backup {{ playlists[0].toString() }}</h3>
    <h3 v-if="playlists.length > 1"  @click="backup">Backup {{ playlists[0].toString() }} and {{ playlists.length - 1 }} other playlist(s)</h3>
    <h3 v-if="playlists.length == 1" @click="getDuplicates">Detect duplicates in {{ playlists[0] }}</h3>
    <h3 v-if="playlists.length == 2" @click="getIntersection">Calculate intersection of {{ playlists[0] }} and {{ playlists[1] }}</h3>
</template>
  
<script>

    export default {
        props: ["playlists"],

        computed: {
        },

        methods: {
            getDuplicates() {
                console.log('getting duplicates');
            },

            getIntersection() {
                console.log('getting intersection');
            },

            backup() {
                console.log('backing up');
                this.$store.commit('setDataToPass', this.playlists)
                this.$router.push({path: 'Backup'})
            }
        }
    }
</script>