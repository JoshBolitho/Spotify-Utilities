const express = require('express');
var path = require('path');
const open = require('open');
var cors = require('cors');
const session = require('express-session');
var cookieParser = require('cookie-parser');
var SpotifyWebApi = require('spotify-web-api-node');

const Secrets = require('../Secrets');

var credentials = {
    redirectUri: Secrets.redirectUri,
    clientId: Secrets.clientId,
    clientSecret: Secrets.clientSecret
};

var sessionSecret = Secrets.sessionSecret;

// Store user session data
// TODO: Work out a better solution for this.
var users = {};

var scopes = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-library-read',
    'user-library-modify'];

const stateKey = 'spotify_auth_state';

const app = express();
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false
}));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.resolve(__dirname+'/../dist/')));

const port = process.env.PORT || 8888;

function generateRandomString(length) {
    var string = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (var i = 0; i < length; i++) {
        string += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return string;
};


app.get('/profile', async (req, res) => {
    // Does the user have a session ID and does the session ID match one stored in users dictionary
    if(req.session.sessionId && req.session.sessionId in users){
        // Does the session have access and refresh tokens?
        var userSession = users[req.session.sessionId];
        // console.log(userSession);
        if(userSession.access_token !== null && userSession.refresh_token !== null
            && userSession.access_token !== '' && userSession.refresh_token !== ''
            && userSession.access_token !== undefined && userSession.refresh_token !== undefined
        ){
            // Test the tokens by fetching "me" data. If successful, return the data. otherwise, return nothing.
            var spotifyApi = new SpotifyWebApi(credentials);
            spotifyApi.setAccessToken(userSession.access_token);
            spotifyApi.setRefreshToken(userSession.refresh_token);

            var user = await getUserData(spotifyApi);
            // console.log(user);
            users[req.session.sessionId].userId = user.id;
            res.send(user);
            return;
        }
    }
    res.send({});
    return;
});


app.get('/login', function(req, res) {

    // Create a session, store the expected state
    var sessionId = generateRandomString(16);
    var state = generateRandomString(16);

    req.session.sessionId = sessionId;
    users[sessionId] = {state: state};

    res.cookie(stateKey, state);
  
    // Create the authorization URL
    var spotifyApi = new SpotifyWebApi(credentials);
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

    res.send({authorizeURL: authorizeURL});

});


app.get('/callback', function(req, res){

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        
        var spotifyApi = new SpotifyWebApi(credentials);
        spotifyApi.authorizationCodeGrant(code).then(async function(data){
            // console.log(data);

            if(req.session.sessionId && req.session.sessionId in users){
                // If session ID exists, add the tokens
                users[req.session.sessionId]['access_token'] = data.body.access_token;
                users[req.session.sessionId]['refresh_token'] = data.body.refresh_token;
            }else{
                // Otherwise, create new session ID and add the tokens
                var sessionId = generateRandomString(16);

                users[sessionId] = {
                    access_token: data.body.access_token,
                    refresh_token: data.body.refresh_token
                };
            }

            // Return to root
            res.redirect('/');
        });
    }
});


app.get('/playlists',async function(req,res){

    if(req.session.sessionId && req.session.sessionId in users){
        // Does the session have access and refresh tokens?
        var userSession = users[req.session.sessionId];
        // console.log(userSession);
        if(userSession.access_token !== null && userSession.refresh_token !== null
            && userSession.access_token !== '' && userSession.refresh_token !== ''
            && userSession.access_token !== undefined && userSession.refresh_token !== undefined
        ){   
            // Start using the tokens
            var spotifyApi = new SpotifyWebApi(credentials);
            spotifyApi.setAccessToken(userSession.access_token);
            spotifyApi.setRefreshToken(userSession.refresh_token);

            // Get playlists.
            // Should only need to fetch user if userId is not defined yet
            var userId = users[req.session.sessionId].userId;
            if(userId === null || userId === undefined || userId === ''){
                var user = await getUserData(spotifyApi);
                userId = user.id;
                // Set the session data too
                users[req.session.sessionId].userId = user.id;
            }
            
            var playlistData = await getUserPlaylists(userId, spotifyApi);

            // console.log(playlistData);

            res.send(playlistData);
        }else{
                // Return some error -> not logged in
                console.log('playlist error!');
            }
        }
});


app.get('/playlist',async function(req,res){

    if(req.session.sessionId && req.session.sessionId in users){
        // Does the session have access and refresh tokens?
        var userSession = users[req.session.sessionId];
        // console.log(userSession);
        if(userSession.access_token !== null && userSession.refresh_token !== null
            && userSession.access_token !== '' && userSession.refresh_token !== ''
            && userSession.access_token !== undefined && userSession.refresh_token !== undefined
        ){   
            // Start using the tokens
            var spotifyApi = new SpotifyWebApi(credentials);
            spotifyApi.setAccessToken(userSession.access_token);
            spotifyApi.setRefreshToken(userSession.refresh_token);

            const playlist = await getPlaylistTracks(req.query.playlist, spotifyApi)
            
            res.send(playlist);
        }else{
                // Return some error -> not logged in
                console.log('playlist error!');
            }
        }
});


async function getUserData(spotifyApi){
    var user = await spotifyApi.getMe();
    return user.body;
}


async function getUserPlaylists(userId, spotifyApi){

    var playlists = [];

    var nextPageURL = '';
    var offset = 0;

    while(nextPageURL !== null && nextPageURL !== undefined && offset < 100) {//TODO remove the limit
        const response = await spotifyApi.getUserPlaylists(userId, { limit: 50, offset: offset });
        const responseItems = response.body?.items || [];

        // Reduce the size of the returned object by only pulling out the needed fields.
        const responsePlaylists = responseItems.map( (playlist) => {
            return {
                name : playlist.name,
                id : playlist.id,
                images : playlist.images
            };
        });

        playlists = playlists.concat(responsePlaylists);
        console.log(playlists.length)

        // Fetch the link to the next page
        nextPageURL = response.body?.next;
        console.log(nextPageURL)
        offset += 50;
    }
    
    return playlists;
}

// Handles paginated results
async function getPlaylistTracks(playlistID, spotifyApi){
    // Query the number of tracks in this playlist
    const playlistData = await spotifyApi.getPlaylist(playlistID);
    const trackCount = playlistData.body.tracks.total;
    console.log(`playlist has ${trackCount} tracks`);

    // The most results we can get in a single page.
    const pagingLimit = 50;
    var tracks = [];

    var index = 0;
    while(index < trackCount){
        console.log("fetching playlist "+playlistID+" from index "+index);
        const pagedTracks = await spotifyApi.getPlaylistTracks(playlistID,{ limit: pagingLimit, offset: index });
        tracks = tracks.concat(pagedTracks.body.items);
        index += pagingLimit;
    }

    const response = {
        playlistData : playlistData.body,
        tracks : tracks
    }

    return response;
}


// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});


open(`http://localhost:${port}/`);