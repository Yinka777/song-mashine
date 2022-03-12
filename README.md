# CS375
CS375 Final Project

-Must have express, axios, pg, and bcrypt installed in root directory -Must update env.json file with postgres password -Must run the following command to create database tables:

CREATE TABLE users ( id SERIAL PRIMARY KEY, username VARCHAR(20), hashed_password CHAR(60));

CREATE TABLE user_playlists ( id SERIAL PRIMARY KEY, created_by VARCHAR(20), playlist_name VARCHAR(30));

CREATE TABLE songs (id SERIAL PRIMARY KEY, playlist_name VARCHAR(20), username VARCHAR(30), track_uri VARCHAR(80), track_href VARCHAR(80));

*was not sure how long a uri or href could be, might need more than "80" in the VARCHAR data type for track_uri/track_href*

-To run app.js 
  -install Spotify API module with $ npm install spotify-web-api-node --save
  -must have express, axios, cors, cookie-parser
