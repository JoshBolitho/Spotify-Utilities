<template>
    <div class="playlist-row">
        <label>
            <input type="checkbox" :value="data.id" :checked="selected" @click="updateSelected">
            <img :src="image" class="playlist-image" @error="imageError">
            <span class="playlist-title">{{ title }}</span>
        </label>
    </div>
</template>
  

<script>
    import defaultPlaylistImage from '../assets/defaultPlaylist.png';

    export default {
        data() {
            return {
                selected: false
            }
        },

        props: ['data'],

        computed: {
            title() {
                return this.data.name;
            },

            image() {
                const myImages = this.data?.images;
                if (myImages === undefined || myImages === null) {
                    return defaultPlaylistImage;
                }

                const myURL = myImages[0]?.url;
                if (myURL === undefined || myURL === null || myURL === '') {
                    return defaultPlaylistImage;
                }

                return myURL;
            }
        },

        methods: {        
            updateSelected() {
                this.selected = !this.selected;
                this.$emit('update:selected', {id: this.data.id, name: this.data.name, selected: this.selected} );
            },

            imageError(event) {
                event.target.src = defaultPlaylistImage;
            }
        }
    };
</script>


<style>
    label input[type="checkbox"] {
        margin-right: 16px;
        transform: scale(3);
    }
    
    .playlist-row {
    display: flex;
    align-items: center;
    padding: 8px;
    }

    .playlist-image {
    width: 64px;
    height: 64px;
    object-fit: cover;
    margin-right: 16px;
    }

    .playlist-title {
    font-size: 1.2rem;
    font-weight: bold;
    }
</style>