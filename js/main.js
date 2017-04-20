function initialize(){
	createMap();
};

// Creating a function to instantiate the map with Leaflet
function createMap(){
    var map = L.map('mapid', {
        center: [43.0731,-89.4012],
        zoom: 11
    });

    // Adding the Satellite tilelayer
    L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
		maxZoom: 19,
        attribution: '&copy; <a href="http://www.esri.com/">Esri</a>'
    }).addTo(map);
    
    
};

//function to load geojson data with ajax
function loadData(map){
    //load the data via ajax
    
    
};



$(document).ready(initialize);
