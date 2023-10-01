<template> 
    <div>
        <h1>Backup</h1>
        <h3 @click="home">Return home</h3>

        <div v-if="!playlistsloaded">
            <p>{{ totalPlaylistsLoaded }} / {{ totalPlaylistsToLoad }} Playlists loaded.</p>
        </div>

        <div v-if="playlistsloaded">
            <p>{{ totalPlaylistsLoaded }} playlist(s) loaded.</p>
            <button @click="downloadFile">Backup {{ totalPlaylistsLoaded }} playlist(s) to CSV</button>
        </div>
    
    </div>    
</template>

<script>
    import { mapState } from 'vuex'
    import axios from 'axios';
    import JSZip from 'jszip';

    export default {

        data() {
            return {
                playlists: [],
                playlistsloaded: false
            }
        },
        
        computed: {
            ...mapState({
                playlistIDs: 'dataToPass'
            }),

            totalPlaylistsToLoad(){
                return this.playlistIDs.length;
            },

            totalPlaylistsLoaded(){
                return this.playlists.length;
            }
            
        },

        async mounted() {
            // Load the playlist data to be backed up
            for (const playlistID of this.playlistIDs){
                await axios.get('/Playlist', { params: {playlist: playlistID}}).then(response => {
                    this.playlists.push(response.data);
                    console.log('loaded a new playlist:'+response);
                    console.log(response.data);
                })
                .catch(error => {
                    console.log("/profile error: "+ error);
                });
            }
            this.playlistsloaded = true;
        },

        methods: {

            home() {

                this.$router.push({path: '/'});
            },

            convertStringToValidFilename(string) {
                // Replace spaces with underscores
                var result = string.replaceAll(" ", "_");
                // Remove invalid characters
                result = string.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "");
                // Max length of 100 chars
                return result.slice(-100);
            },

            artistArrayToCSVEntry(artists){

                var result = '';

                for(const artist in artists){

                    const artistName = artists[artist].name;

                    // Escape double-quote chars with an extra double-quote.
                    result += artistName.replaceAll('"','""');

                    // Add a comma inbetween each artist name, unless it is the last one.
                    if( artist + 1 < artists.length ){
                        result += ', ';
                    }
                }

                // Surround the string in double-quotes.
                return '"' + result + '"';
            },

            makeCSVEntry(value){

                // Default for empty value.
                if(value === undefined || value === null){ 
                    console.log('undef or null')
                    return '';
                }else{console.log(value)}

                var string = `${value}`;
                
                // Escape double-quote chars with an extra double-quote.
                string = string.replaceAll('"','""');

                // Surround the string in double-quotes.
                return '"' + string + '"';
            },

            createCSVTrackEntry(track) {
                
                if(!track) {
                    return '';
                }

                console.log(JSON.stringify(track));
                console.log(Object.keys(track));
                console.log(track.name);

                const name                  = this.makeCSVEntry(track.track?.name);
                const artists               = this.artistArrayToCSVEntry(track.track?.artists);
                const id                    = this.makeCSVEntry(track.track?.id);

                const added_at              = this.makeCSVEntry(track.added_at);
                const added_by              = this.makeCSVEntry(track.added_by?.id);
                const duration_ms           = this.makeCSVEntry(track.track?.duration_ms);

                const album_name            = this.makeCSVEntry(track.track?.album?.name);
                const album_artists         = this.artistArrayToCSVEntry(track.track?.album?.artists);
                const album_release_date    = this.makeCSVEntry(track.track?.album?.release_date);
                const album_id              = this.makeCSVEntry(track.track?.album?.id);

                const isrc                  = this.makeCSVEntry(track.track?.external_ids?.isrc);
                const ean                   = this.makeCSVEntry(track.track?.external_ids?.ean);
                const upc                   = this.makeCSVEntry(track.track?.external_ids?.upc);
                console.log(`${name},${artists},${id},${added_at},${added_by},${duration_ms},${album_name},${album_artists},${album_release_date},${album_id},${isrc},${ean},${upc}\n`);
                return `${name},${artists},${id},${added_at},${added_by},${duration_ms},${album_name},${album_artists},${album_release_date},${album_id},${isrc},${ean},${upc}\n`;
            },

            createCSVFiles() {
                
                const files = []

                for(const playlist of this.playlists){

                    const name = playlist.playlistData?.name;
                    const id = playlist.playlistData?.id;
                    const tracks = playlist.tracks || [];

                    const fileName = this.convertStringToValidFilename(`${name}_${id}.csv`);
                    
                    var fileString = 'name,artists,id,added_at,added_by,duration_ms,album_name,album_artists,album_release_date,album_id,isrc,ean,upc\n';

                    for(const track of tracks){
                        fileString += this.createCSVTrackEntry(track);
                    }

                    files.push({name: fileName, content: fileString});
                }

                return files;
            },

            async downloadFile() {

                if(!this.playlistsloaded){
                    return;
                }

                const files = this.createCSVFiles();
                var blob;
                var fileName;

                if(files.length < 1) {
                    return;
                }

                if(files.length === 1) {
                    // If there's only one file, don't zip it
                    blob = new Blob([files[0].content], { type: 'text/plain' });
                    fileName = files[0].name;
                }
                else {
                    // More than one file, so return them as a .zip file.
                    const zip = new JSZip();
                    for(const file of files){
                        zip.file(file.name, file.content);
                    }

                    blob = await zip.generateAsync({ type: 'blob' });
                    fileName = 'playlist_backup.zip';
                }

                // Create a download link element
                const downloadLink = document.createElement('a');

                // Set the download attribute to specify the file name
                downloadLink.download = fileName;

                // Create a URL for the Blob and set it as the href attribute
                downloadLink.href = window.URL.createObjectURL(blob);

                // Append the download link to the body
                document.body.appendChild(downloadLink);

                // Programmatically trigger a click event on the download link
                downloadLink.click();

                // Remove the download link from the DOM
                document.body.removeChild(downloadLink);
            }
        },

        components: {
        }
    }
</script>