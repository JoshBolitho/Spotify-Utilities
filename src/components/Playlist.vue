<template>
    <div class="playlist-row">
        <img :src="image" class="playlist-image" @error="imageError">
        <span class="playlist-title">{{ title }}</span>
    </div>
</template>
  
  
<script>
    export default {
        props: ["data"],

        computed: {
            title(){
                return this.data.name;
            },

            image(){
                return this.data.images[0].url;
            }

        },

        methods: {
            imageError(event){
                event.target.src = '../assets/logo.png';
            }
        }
    };
</script>


<style>
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