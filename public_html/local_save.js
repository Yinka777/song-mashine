function createPlaylist(playlist){
	let playlist_name = playlist;
	let playlist_values = {username, playlist_name};
	console.log(JSON.stringify(playlist_values));

	fetch("/createPlaylist", {
		method: "POST",
		body: JSON.stringify(playlist_values),
		headers: { 
        	"Content-type": "application/json"
    	}
	}).then(function(response){
		if (response.status==200){
			//success - playlist added
			//return
			console.log("success - playlist added");
		}else if (response.status==401) {
			//fail - playlist_name already exists for user 
			//return
			console.log("fail - playlist_name already exists for user");
		}else{
			//fail - Bad request
			//return
			console.log("fail - Bad request");
		}
	}).catch(function (error) {
   		console.log(error);
	});
}

function addSong(playlist, uri, href=""){
	//defaults to uri
	//will work with either uri, href, or both
	let playlist_name = playlist;
	if (href===""){
		let track_uri = link;
		song_values = {username, playlist_name, track_uri};
	}else{
		let track_uri = uri;
		let track_href = href;
		song_values = {username, playlist_name, track_uri, track_href};
	}
	//console.log(JSON.stringify(song_values));

	fetch("/addSong", {
		method: "POST",
		body: JSON.stringify(song_values),
		headers: { 
        	"Content-type": "application/json"
    	}
	}).then(function(response){
		if (response.status==200){
			//success - song added to playlist
			//return
			console.log("success - song added to playlist");
		}else if (response.status==401) {
			//fail - song already exists in user's playlist
			//return
			console.log("fail - song already exists in user's playlist");
		}else{
			//fail - Bad request
			//return
			console.log("fail - Bad request");
		}
	}).catch(function (error) {
   		console.log(error);
	});
}

function getPlaylists(){
	fetch(`/getPlaylists?username=${username}`).then(function(response){
		response.json().then(function(data){
			if (data.rows.length > 0){
				console.log("success - playlist(s) found");
				//add playlists to dropdown selection
				for (let x = 0; x < data.rows.length; x++){
					if (x == 0){
						getSongs(data.rows[x].playlist_name);
					}
					var dropDown = document.getElementById("playlistDropdown")

					var option = document.createElement("option");
					option.text = data.rows[x].playlist_name;
					dropDown.add(option);
				}
			}else{
				console.log("fail - no playlists exist for user");
			}
		});
	}).catch(function (error) {
   		console.log(error);
	});
}

function getSongs(playlist_name){
	fetch(`/getSongs?username=${username}&playlist_name=${playlist_name}`).then(function(response){
		response.json().then(function(data){
			//console.log(data.rows);
			//track_uri/track_href can be accessed like: data.rows[x].track_uri or data.rows[x].track_href
			if (data.rows.length > 0){
				document.getElementById('rightPlaylist').innerHTML = "";
				for (let x = 0; x < data.rows.length; x++){
					populate_href_info(data.rows[x].track_href);
				}
				console.log("success - song(s) found");
			}else{
				document.getElementById('rightPlaylist').innerHTML = "";
				document.getElementById('rightPlaylist').innerHTML += ('<span>NO SONGS</span>');
				console.log("fail - no song(s) exist in playlist yet");
			}
		});
	}).catch(function (error) {
   		console.log(error);
	});
}

function populate_href_info(href){
	fetch(`/href?href=${href}`).then(function(response){
		response.json().then(function(data){
			// //can uncomment to see format of response, if any other track/album/artist info is required
			// //console.log(data)
			// let album = data.album.name;
			let artist = data.album.artists[0].name;
			// let imgArray = data.album.images;
			let track_name = data.name;
			// let href_values = {artist, album, imgArray, track_name};
			// //need to use values here, inside the .then(), to populate react components
			// artists.push(artist);
			// songTitles.push(track_name);
			// albumns.push(album);
			// covers.push(imgArray[1]);
			// i = i + 1;

			document.getElementById('rightPlaylist').innerHTML += ('<li>'+track_name+" by "+artist+'</li>');
		});
	}).catch(function (error) {
   		console.log(error);
	});
}
