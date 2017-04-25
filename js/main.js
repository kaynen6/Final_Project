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
            //display symbols for a default date
            
            console.log(meanAtts);
            createPropSymbols(response,map,meanAtts);
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
    $.ajax("data/UHIDailySummaries/Mins12-16.geojson", {
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
        },
        //hopefully filtering the data for default date
        filter: function(feature, layer){
            if (feature.properties.year == 2016 && feature.properties.month == 01 && feature.properties.day == 01) {
                return true
            }
        }
          
    }).addTo(map);
};  


//initial symbolization when map loads for first time
function pointToLayer(feature, latlng, attributes, tempType, year, month, day){
    //create marker options w/ defualt styling
    var options = {
        radius: 8,
        fillColor: "#91bfdb",
        color: "#000",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 0.3 //soften the opacity a little to see other points and map through point feature
    };
    //define the attribute to grab year, month, day
    //var year = attributes[7]; 
    //var month = attributes[8];
    //var day = attributes[9];
    //grab the properties of the attribute
    var attValue = feature.properties["HI"];
    console.log(attValue);
    //define radius via func to calculate based on attribute data
    options.radius = calcPropRadius(attValue);
    console.log(options.radius);
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


//calculate radius for proportional symbols
function calcPropRadius(attValue) {
    //scale factor for even symbol size adjustments
    var scaleFactor = 100;
    //area based on attribute value and scale factor
    var area = Math.abs(attValue) * scaleFactor;
    //radius is calc based on area
    var radius = Math.sqrt(area/Math.PI);
    return radius;
};






$(document).ready(initialize);
