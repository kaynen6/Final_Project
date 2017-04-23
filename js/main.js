function initialize(){
    var currentYear, currentMonth, currentDay;
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
        minZoom: 9,
        attribution: '&copy; <a href="http://www.esri.com/">Esri</a>'
    }).addTo(map);
    //show data load affordance spinner
    $('#ajaxloader').show();
    //function to load data from files
    loadData(map);
    
};


//function to load geojson data with ajax
function loadData(map){
    //load the Means data via ajax
    $.ajax("data/UHIDailySummaries/Means12-16.geojson", {
        dataType: "json",
        success: function(response){
            //create attribute array
            var meanAtts = processData(response);
            createPropSymbols(response,map,meanAtts);
            console.log(meanAtts);
            
        }
    });
    //load max data
    $.ajax("data/UHIDailySummaries/Maxes12-16.geojson", {
        dataType: "json",
        success: function(response){
            //create attribute array
            var maxAtts = processData(response)
            console.log(maxAtts);
        }
    });
    //load the min data
    $.ajax("data/UHIDailySummaries/Means12-16.geojson", {
        dataType: "json",
        success: function(response){
            //create attribute array
            var minAtts = processData(response)
            console.log(minAtts);
            //hide loading spinner affordance
            $('#ajaxloader').hide();
        }
    });
};


//create an attributes array from data
function processData(data){
    console.log(data);
    //empty array to hold attribute data
    var attributes = [];
    //properties of the first feature in the dataset
    var properties = data.features[0].properties;
    //push each attribute name into attributes array
    for (var attribute in properties){
        attributes.push(attribute);
    };
    return attributes;
};


//create proportional sybols form geojson data properties
function createPropSymbols(response, map, attributes){   
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(response, {
        //point to layer converts each point feature to layer to use circle marker
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};  


//initial symbolization when map loads for first time
function pointToLayer(feature, latlng, attributes){
    //create marker options w/ defualt styling
    var options = {
        radius: 8,
        fillColor: "#91bfdb",
        color: "#000",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 0.3 //soften the opacity a little to see other points and map through point feature
    };
    //define the attribute to grab //this is the year, must be changed or made dynamic
    var attribute = attributes[0]; 
    //grab the properties of the attribute
    var attValue = Number(feature.properties[attribute]);
    //update current year
    currentYear = year;    
    //define radius via func to calculate based on attribute data
    options.radius = calcPropRadius(attValue);
    //add commas and dollar $ign. 
    var newAttValue = "$" + addCommas(attValue);
    //create circleMarker
    var layer = L.circleMarker(latlng, options);
    //create popup content string
    var popupContent = "";
    //add panel content variable 
    var panelContent = "";
    //add text and year and value to panelcontent
    //bind the popup content to the layer and add an offset radius option
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius),
        closeButton: false
    });
    //add mouseover popup functionality
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        },
        click: function(){
            $("#___WhateverPanelDIV___").html(panelContent);
        }
    });
    return layer;
};



$(document).ready(initialize);
