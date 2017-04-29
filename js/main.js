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
            //console.log(meanAtts);
            //find min max for the data to color with
            findMinMax(response);
            //find average baseline temp of 4 points furtherest away (max,min lat long?)
            
            createPropSymbols(response,map,meanAtts);
        }
    });
    //load max data
    $.ajax("data/UHIDailySummaries/Maxes12-16.geojson", {
        dataType: "json",
        success: function(response){
            //create attribute array
            var maxAtts = processData(response)
            //console.log(maxAtts);
        }
    });
    //load the min data
    $.ajax("data/UHIDailySummaries/Mins12-16.geojson", {
        dataType: "json",
        success: function(response){
            //create attribute array
            var minAtts = processData(response)
            //console.log(minAtts);
            //hide loading spinner affordance
            $('#ajaxloader').hide();
        }
    });
};


//create an attributes array from data
function processData(data){
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
        //filtering the data for default date - make this interactive at some point
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
        fillOpacity: 0.8
    };
    //define the attribute to grab year, month, day
    //var year = attributes[7]; 
    //var month = attributes[8];
    //var day = attributes[9];
    
    //grab the properties of the attribute - MAKE INTERACTIVE - CHANGE "HI" TO VARIABLE tempType
    var attValue = feature.properties["HI"];
    //console.log(attValue);
    //define radius via func to calculate based on attribute data
    options.radius = calcPropRadius(attValue);
    //console.log(options.radius);
    //define fill color for each based on attValue (temp)
    //options.fillColor = calcColorVals(attValue);
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
    var scaleFactor = 25;
    //area based on attribute value and scale factor
    var area = Math.abs(attValue) * scaleFactor;
    //radius is calc based on area
    var radius = Math.sqrt(area/Math.PI);
    return radius;
};

//function to calculate color scale value
function calcScale(prop, attvalue){
   
    //determine classes of attValue
    
}

//function to find min max temps of the dataset
function findMinMax(data){
    //array to store all temp data
    var temp = [];
    //grab all temp attribute values and put in the array
    data.features.forEach(function(item){
        if (parseFloat(item.properties["HI"])){
            temp.push(Math.round(parseFloat(item.properties["HI"])*100)/100);
        };
        if (parseFloat(item.properties["AT"])){
            temp.push(Math.round(parseFloat(item.properties["AT"])*100)/100);   
        };
    });
    //get min and max of all temps data
    var min = Math.min(...temp);
    var max = Math.max(...temp);
    console.log(min,max);
    //diverging color array from colorbrewer
    var break1 = (min + max)/2
    var markerColors = ['#ca0020','#f4a582','#f7f7f7','#92c5de','#0571b0'];
}




$(document).ready(initialize);
