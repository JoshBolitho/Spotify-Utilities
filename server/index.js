const express = require('express');
var http = require('http');
const url = require('url');
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

//store user session data
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

// Middleware to parse incoming request bodies
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());


function generateRandomString(length) {
    var string = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (var i = 0; i < length; i++) {
        string += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return string;
};



// API routes
app.get('/profile', async (req, res) => {
    // console.log('getting /profile !!!');

    //does the user have a session ID and does the session ID match one stored in users dictionary
    if(req.session.sessionId && req.session.sessionId in users){
        //does the session have access and refresh tokens?
        var userSession = users[req.session.sessionId];
        // console.log(userSession);
        if(userSession.access_token !== null && userSession.refresh_token !== null
            && userSession.access_token !== '' && userSession.refresh_token !== ''
            && userSession.access_token !== undefined && userSession.refresh_token !== undefined
        ){
            //test the tokens by fetching "me" data. If successful, return the data. otherwise, return nothing.
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

    //create a session, store the expected state
    var sessionId = generateRandomString(16);
    var state = generateRandomString(16);

    req.session.sessionId = sessionId;
    users[sessionId] = {state: state};

    res.cookie(stateKey, state);
  
    // Create the authorization URL
    var spotifyApi = new SpotifyWebApi(credentials);
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888');
    // console.log(authorizeURL);
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

            //return to root
            res.redirect('/');
        });
    }
});


app.get('/playlists',async function(req,res){

    if(req.session.sessionId && req.session.sessionId in users){
        //does the session have  access and refresh tokens?
        var userSession = users[req.session.sessionId];
        // console.log(userSession);
        if(userSession.access_token !== null && userSession.refresh_token !== null
            && userSession.access_token !== '' && userSession.refresh_token !== ''
            && userSession.access_token !== undefined && userSession.refresh_token !== undefined
        ){   
            //Start using the tokens
            var spotifyApi = new SpotifyWebApi(credentials);
            spotifyApi.setAccessToken(userSession.access_token);
            spotifyApi.setRefreshToken(userSession.refresh_token);

            //get playlists

            //should only need to fetch user if userId is not defined yet
            var userId = users[req.session.sessionId].userId;
            if(userId === null || userId === undefined || userId === ''){
                var user = await getUserData(spotifyApi);
                userId = user.id;
                //set the session data too
                users[req.session.sessionId].userId = user.id;
            }
            
            var playlistData = await getUserPlaylists(userId, spotifyApi);

            // console.log(playlistData);

            res.send(playlistData);
        }else{
                //return some error -> not logged in
                console.log('playlist error!');
            }
        }
});



async function getUserData(spotifyApi){
    var user = await spotifyApi.getMe();
    return user.body;
}


async function getUserPlaylists(userId, spotifyApi){
    // const userPlaylists = await spotifyApi.getUserPlaylists(userId,{ limit: 5000, offset: 0 });
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


    const userPlaylists = await spotifyApi.getUserPlaylists(userId,{ limit: 50, offset: 0 });

    // //compare user first 2 playlists
    // const playlist1 = userPlaylists.body.items[0];
    // const playlist2 = userPlaylists.body.items[1];
    
    // var playlist1Tracks = await loadPlaylistTracks(playlist1.id, playlist1.tracks.total);
    // var playlist2Tracks = await loadPlaylistTracks(playlist2.id, playlist1.tracks.total);

    // console.log("p1 length: "+playlist1Tracks.length);
    // console.log("p2 length: "+playlist2Tracks.length);

    // console.log("\nSongs in " +playlist1.name+ " that are also in " + playlist2.name);

    // for(const p1_track of playlist1Tracks){
        
    //     for(const p2_track of playlist2Tracks){

    //         if(compareTracks(p1_track, p2_track, {})){
    //             console.log( p1_track.track.id + " : " + p1_track.track.name);
    //             continue;
    //         }

    //     }

    // }

    return userPlaylists.body;
}

//Handles paginated results
async function loadPlaylistTracks(playlistID, trackCount, spotifyApi){
    //The most results we can get in a single page.
    const pagingLimit = 50;
    var tracks = [];

    var index = 0;
    while(index < trackCount){
        console.log("fetching playlist "+playlistID+" from index "+index);
        const pagedTracks = await spotifyApi.getPlaylistTracks(playlistID,{ limit: pagingLimit, offset: index });
        tracks = tracks.concat(pagedTracks.body.items);
        index += pagingLimit;
    }

    return tracks;
}


// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});


open(`http://localhost:${port}/`);