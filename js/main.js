function initialize(){
    var currentYear;
    var currentMonth;
    var currentDay;

    createMap();
};


// Creating a function to instantiate the map with Leaflet
function createMap(){
    var map = L.map('mapid', {
        center: [43.0731,-89.4012],
        zoom: 10
    });

    // Adding the Satellite tilelayer
    var satellite = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }),
    streets = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
    });

    var baseMaps = {
      "Satellite": satellite,
      "Streets": streets
    };

    L.control.layers(baseMaps).addTo(map);

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
            createSequenceControls(map, meanAtts);
        }
    });
    //load max data
    $.ajax("data/UHIDailySummaries/Maxes12-16.geojson", {
        dataType: "json",
        success: function(response){
            //create attribute array
            var maxAtts = processData(response)
            // console.log(maxAtts);
            // createSequenceControls(map);
        }
    });
    //load the min data
    $.ajax("data/UHIDailySummaries/Mins12-16.geojson", {
        dataType: "json",
        success: function(response){
            //create attribute array
            var minAtts = processData(response)
            // console.log(minAtts);
            // createSequenceControls(map);
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
    console.log(properties);
    // if (properties == "null"){
    //   properties = 0
    // } else {
    //   properties = data.features[0].properties;
    // };
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
            // return feature.properties.year == 2016?  Will need to remove one/two of these constraints (day, month, year)?
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
    if (attValue < 0){
      attValue = Math.abs(attValue);
    } else {
      attValue = attValue;
    };
    // console.log(attValue);
    //define radius via func to calculate based on attribute data
    options.radius = calcPropRadius(attValue);
    // console.log(options.radius);
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
            $("#panel1").html(panelContent);
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

function createSequenceControls(map, attributes){
	$('#panel1').append('<input class="range-slider" type="range">');

  $('.range-slider').attr({
    max: 6,
    min: 0,
    value: 0,
    step: 1
  });

  $('#panel1').append('<button class="skip" id="reverse">Reverse</button>');
  $('#panel1').append('<button class="skip" id="forward">Skip</button>');

  $('#reverse').html('<img src="img/reverse.png">');
  $('#forward').html('<img src="img/forward.png">');

  $('.skip').click(function(){
		var index = $('.range-slider').val();

		if ($(this).attr('id') == 'forward'){
			index++;
			index = index > 6 ? 0 : index;
		} else if ($(this).attr('id') == 'reverse'){
			index--;
			index = index < 0 ? 6 : index;
		};
		$('.range-slider').val(index);
		updatePropSymbols(map, attributes[index]);
	});

	$('.range-slider').on('input', function(){
		var index = $(this).val();
		updatePropSymbols(map, attributes[index]);
		});
};

/* Creating a function to update the proportional symbols when activated
by the sequence slider */
function updatePropSymbols(map, attribute){
  map.eachLayer(function(layer){
		if (layer.feature && layer.feature.properties[attribute]){
			var props = layer.feature.properties;
			var radius = calcPropRadius(props[attribute]);
			layer.setRadius(radius);

// Creating a popup for each of the data points with information
			var popupContent = "<p><b>Temperature:</b> " + parseFloat(props.HI).toFixed(2) + "</p>";
			var year = props.year;
      var month = props.month;
      console.log(props.month);
      var day = props.day;
      console.log(attribute);
			popupContent += "<p><b>Temperature for " + month + "/" + day + "/" + year + ":</b> " + parseFloat(props[attribute]).toFixed(2)+ " %</p>";

			layer.bindPopup(popupContent, {
				offset: new L.Point(0,-radius)
			});
		};
	});
};

// function createLegend(map, attributes){
// 	var LegendControl = L.Control.extend({
// 		options: {
// 			position: 'bottomright'
// 		},
//
// 		onAdd: function(map){
// 			// Creating a container for the legend control
// 			var container = L.DomUtil.create('div', 'legend-control-container');
// 			$(container).append('<div id = "temporal-legend">');
//
// 			var svg = '<svg id="attribute-legend" width="160px" height="70px">';
//
// 			var circles = {
// 				max: 25,
// 				mean: 37.5,
// 				min: 50
// 			};
// 			// Creating a "for" loop to add each circle and text into a svg string
// 			for (var circle in circles){
// 				// Creating a circle string
// 				svg += '<circle class="legend-circle" id="' + circle + '" fill="#2b8cbe" fill-opacity="0.8" stroke="#000000" cx="30"/>';
//
// 				// Creating a text string
// 				svg += '<text id="' + circle + '-text" x="65" y="' + circles[circle] + '"></text>';
// 			};
//
// 			svg += "</svg>";
// 			$(container).append(svg);
//
// 			return container;
// 		}
// 	});
// 	map.addControl(new LegendControl());
// 	// updateLegend(map, attributes[0]);
// };

/* Some function to update the legend if we change from geoJsons */
// function updateLegend(map, attribute){
//
// };

// function setChart(data, colorScale){

// };
$(document).ready(initialize);
