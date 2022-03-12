let SpotifyWebApi = require('spotify-web-api-node');
let express = require("express");
let axios = require('axios');
let cors = require('cors');
let cookieParser = require('cookie-parser');
const pg = require("pg");
const bcrypt = require("bcrypt");
let app = express();

let port = 3000;
let hostname = "localhost";

const salts = 10;

const env = require("./env.json");
const Pool = pg.Pool;
const pool = new Pool(env);
pool.connect().then(function () {
    console.log(`Connected to database ${env.database}`);
});

app.use(express.json()); 
app.use(express.static("public_html"))
    .use(cors())
    .use(cookieParser());

let clientId = '';
let secretId = '';

let spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    secretId: secretId
});

axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token?grant_type=client_credentials',
    headers: { 'Authorization': 'Basic ' + (new Buffer.from(clientId + ':' + secretId).toString('base64')) },
    json: true
})
    .then(function (response) {
        spotifyApi.setAccessToken(response.data.access_token);
    })
    .catch(function(err) {
        console.log('Something went wrong when retrieving an access token', err);
    });

app.get('/search_tracks', function (req,res) {
    spotifyApi.searchTracks(req.query.title, { limit: 10, offset: 0 })
        .then(function(tracks) {
            res.status(200).json(tracks.body.tracks.items);
        })
        .catch(function(err) {
            res.status(400).json({'error': err});
        });
});

app.get('/create_playlist', function (req,res) {
    let artistId = req.query.id;
    
    Promise.all([spotifyApi.getArtistRelatedArtists(artistId)]) //'4O15NlyKLIASxsJ0PrXPfz'
    .then(function topTracks(data) {
        let promises = [];
        for (let i=0;i<7;i++) {
            promises.push(spotifyApi.getArtistTopTracks(data[0].body.artists[i].id, 'US').then((data) => (data.body.tracks)[0]));
        }
        
        Promise.all(promises)
            .then(function(trackList) {
                res.status(200).json(trackList);
            })
            .catch(function(err) {
                res.status(400).json({'error': err});
            });
    })
    .catch((err) => res.status(400).json({'error': err}));
});

app.post("/create", function (req, res) {
    if (!req.body.hasOwnProperty("username") || !req.body.hasOwnProperty("textPassword")){
        res.status(400).send();
    }else{
        let username = req.body.username;
        let textPassword = req.body.textPassword;
        
        if ((username.length < 1 || username.length > 20) || (textPassword.length < 5 || textPassword.length > 36)){
            res.status(401).send();
        }else{
            // check if username already exists
            pool.query("SELECT username FROM users WHERE username = $1", [
                username,
                ]).then(function (response){
                    if (response.rows.length === 0){
                        // username does not exist in database
                        bcrypt
                            .hash(textPassword, salts)
                            .then(function (hashedPassword) {
                                pool.query(
                                    "INSERT INTO users (username, hashed_password) VALUES ($1, $2)",
                                    [username, hashedPassword]
                                )
                                    .then(function (response) {
                                        // account successfully created
                                        res.status(200).send();
                                    })
                                    .catch(function (error) {
                                        // server error
                                        console.log(error);
                                        res.status(500).send();
                                    });
                            })
                            .catch(function (error) {
                                // server error
                                console.log(error);
                                res.status(500).send();
                            });
                    }else{
                        res.status(406).send();
                    }
                })
            }
        }
});

app.post("/login", function (req, res) {
    if (!req.body.hasOwnProperty("username") || !req.body.hasOwnProperty("textPassword")){
        res.status(400).send();
    }
    let username = req.body.username;
    let textPassword = req.body.textPassword;
    pool.query("SELECT hashed_password FROM users WHERE username = $1", [
        username,
    ])
        .then(function (response) {
            if (response.rows.length === 0) {
                // username doesn't exist
                return res.status(400).send();
            }
            let hashedPassword = response.rows[0].hashed_password;
            bcrypt
                .compare(textPassword, hashedPassword)
                .then(function (isSame) {
                    if (isSame) {
                        // password matched
                        res.status(200).send();
                    } else {
                        // password didn't match
                        res.status(401).send();
                    }
                })
                .catch(function (error) {
                    // server error
                    console.log(error);
                    res.status(500).send();
                });
        })
        .catch(function (error) {
            // server error
            console.log(error);
            res.status(500).send();
        });
});

app.post("/createPlaylist", function (req, res) {
    if (!req.body.hasOwnProperty("username") || !req.body.hasOwnProperty("playlist_name")){
        return res.status(400).send();
    }
    let username = req.body.username;
    let playlist_name = req.body.playlist_name;
    pool.query(`SELECT * FROM user_playlists WHERE created_by=$1 AND playlist_name=$2`, [
            username, playlist_name
        ]).then(function (response) {
            if (response.rows.length === 0){
                pool.query(`INSERT INTO user_playlists (created_by, playlist_name) VALUES ($1, $2)`, [
                            username, playlist_name
                        ])
                        .catch(function (error) {
                            // server error
                            console.log(error);
                            res.status(500).send();
                        });
                        return res.status(200).send()
            }else{
                //playlist_name already exists for that user
                return res.status(401).send();
            }
        }).catch(function (error) {
            //server error
            console.log(error);
            return res.status(500).send();
        })
});

app.post("/addSong", function (req, res) {
    if (!req.body.hasOwnProperty("username") || !req.body.hasOwnProperty("playlist_name") || (!req.body.hasOwnProperty("track_uri") && !req.body.hasOwnProperty("track_href"))){
        return res.status(400).send();
    }
    let username = req.body.username;
    let playlist_name = req.body.playlist_name;

    let track_uri = '';
    let track_href = '';
    if (req.body.hasOwnProperty("track_uri")){
        track_uri = req.body.track_uri;
    }
    if (req.body.hasOwnProperty("track_href")){
        track_href = req.body.track_href;
    }

    pool.query(`SELECT * FROM songs WHERE username=$1 AND playlist_name=$2 AND (track_uri=$3 OR track_href=$4)`, [
            username, playlist_name, track_uri, track_href
        ]).then(function (response) {
            if (response.rows.length === 0){
                pool.query(`INSERT INTO songs (playlist_name, username, track_uri, track_href) VALUES ($1, $2, NULLIF($3,''), NULLIF($4,''))`, [
                            playlist_name, username, track_uri, track_href
                        ])
                        .catch(function (error) {
                            // server error
                            console.log(error);
                            res.status(500).send();
                        });
                        return res.status(200).send();  
            }else{
                //song already exists in that user's playlist
                return res.status(401).send();
            }
        }).catch(function (error) {
            //server error
            console.log(error);
            return res.status(500).send();
        })
});

app.get("/getPlaylists", function (req, res) {
    let username = req.query.username;

    pool.query(
        'SELECT playlist_name FROM user_playlists WHERE created_by=$1',
        [username]
    ).then(function (result){
        //console.log({rows: result.rows});
        res.status(200).json({rows: result.rows});
    }).catch(function (error) {
       console.log(error);
    });
});

app.get("/getSongs", function (req, res) {
    let username = req.query.username;
    let playlist_name = req.query.playlist_name;

    pool.query(
        'SELECT track_uri, track_href FROM songs WHERE username=$1 AND playlist_name=$2',
        [username, playlist_name]
    ).then(function (result){
        //console.log({rows: result.rows});
        res.status(200).json({rows: result.rows});
    }).catch(function (error) {
       console.log(error);
    });
});

app.get('/href', function(req, res) {
    let href = req.query.href
    axios({
        method: 'get',
        url: href,
        headers: { 'Authorization': 'Bearer ' + spotifyApi.getAccessToken() },
        json: true
    })
    .then(function (response) {
            res.status(200).json(response.data);
        }).catch(function (error) {
            console.log(error);
        });
});

app.listen(port, hostname, () => {
    console.log(`Listening at: http://${hostname}:${port}`);
});
