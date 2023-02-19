var http = require('http');
const url = require('url');
const open = require('open');
var SpotifyWebApi = require('spotify-web-api-node');

const Secrets = require('./Secrets');

var credentials = {
    redirectUri: Secrets.redirectUri,
    clientId: Secrets.clientId,
    clientSecret: Secrets.clientSecret
};

var scopes = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-library-read',
    'user-library-modify'];

var state = 'some-state-of-my-choice';// should be randomised and verified in oauth2 process.

// Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
var spotifyApi = new SpotifyWebApi(credentials);

// Create the authorization URL
var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
// console.log(authorizeURL);
open(authorizeURL);

function getAuthCode(){
    return new Promise(function (resolve, reject){
        var server = http.createServer(function (req, res) {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.write('Authentication successful! You can close this page.');
            res.end();

            const urlParts = url.parse(req.url, true);
            const queryObject = urlParts.query;

            // Check if the callback URL was called with an authorization code
            if (queryObject.code && urlParts.pathname === '/callback') {
                const authorizationCode = queryObject.code;
                // console.log(authorizationCode);
                server.close();
                resolve(authorizationCode);
            }

        }).listen(8888);
    });
}

async function getUserData(){
    const user = await spotifyApi.getMe();
    // console.log(user.body);
    console.log();
    getUserPlaylists(user.body.id);
}

async function getUserPlaylists(userID){
    // const userPlaylists = await spotifyApi.getUserPlaylists(userID,{ limit: 5000, offset: 0 });
    const userPlaylists = await spotifyApi.getUserPlaylists(userID,{ limit: 2, offset: 0 });
    // console.log(userPlaylists.body);
    // console.log("-----------------------------------")
    // for(const playlist of userPlaylists.body.items){
    //     console.log("playlist id: " + playlist.id);
    //     const playlistTracks = await spotifyApi.getPlaylistTracks(playlist.id);
    //     // console.log(playlistTracks.body.items);
    //     for(const track of playlistTracks.body.items){
    //         console.log("##############");
    //         console.log(track.track.name);
    //         console.log(track.track.id);
    //         console.log(track.track.duration_ms);
    //     }
    //     console.log("-----------------------------------")
    // }
    // console.log();
    // console.log();

    //compare user first 2 playlists
    const playlist1 = userPlaylists.body.items[0];
    const playlist2 = userPlaylists.body.items[1];

    console.log(playlist1.tracks.total);
    
    playlist1Tracks = await spotifyApi.getPlaylistTracks(playlist1.id,{ limit: 50, offset: 0 });
    playlist2Tracks = await spotifyApi.getPlaylistTracks(playlist2.id,{ limit: 50, offset: 0 });

    console.log("Songs in " +playlist1.name+ " that are also in " + playlist2.name);

    for(const p1_track of playlist1Tracks.body.items){
        
        for(const p2_track of playlist2Tracks.body.items){

            if(compareTracks(p1_track, p2_track, {checkTime: true})){
                console.log("###############################");
                console.log(p1_track.track.name);
                console.log(p1_track.track.id);
                continue;
            }

        }

    }
    

}

//Handles paginated results
async function loadPlaylistTracks(playlistID){
    var tracks = [];


    return tracks;
}


//returns true if both track are identical
function compareTracks(track1, track2, options){
    //check names are identical
    if( track1.track.name != track2.track.name){ return false;}
    //check artist lists are identical
    if(!compareArtistLists(track1.track.artists, track2.track.artists)){ return false;}

    //check the track durations are identical, if that option is set
    if( options.checkTime && track1.track.duration_ms != track2.track.duration_ms){ return false;}
    //check the track ids are identical, if that option is set
    if( options.checkID && track1.track.id != track2.track.id){ return false;}

    //otherwise, return true
    return true;
}

//returns true if both artist lists are identical
function compareArtistLists(list1, list2){
    for(const list1artist of list1){
        var list1ArtistExistsInList2;

        for(const list2artist of list2){
            if(list1artist.id = list2artist.id){
                list1ArtistExistsInList2 = true;
                continue;
            }
        }
        if (!list1ArtistExistsInList2){
            return false;
        }
    }
    return true;
}




getAuthCode()// Get authorisation code
.then( (code) => {
        spotifyApi.authorizationCodeGrant(code)
        .then(
            function(data) {
                console.log('The token expires in ' + data.body['expires_in']);
                console.log('The access token is ' + data.body['access_token']);
                console.log('The refresh token is ' + data.body['refresh_token']);
                console.log();

                // Set the access token on the API object to use it in later calls
                spotifyApi.setAccessToken(data.body['access_token']);
                spotifyApi.setRefreshToken(data.body['refresh_token']);
            },
            function(err) {
            console.log('Something went wrong!', err);
            }
        )
        .then( 
            () => {
                getUserData();
            }
        );
    }
);