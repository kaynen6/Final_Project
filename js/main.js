function initialize(){
    var currentYear;
    var currentMonth;
    var currentDay;
    var colorScale = ['#ca0020','#f4a582','#f7f7f7','#92c5de','#0571b0'];

    createMap();
};

// Creating a function to instantiate the map with Leaflet
function createMap(){

    var map = L.map('mapid', {
      center: [43.0731,-89.4012],
      zoom: 10
    });
    // Adding the tile layers to the map
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

    // Creating a layer control to switch between tile layers
    L.control.layers(baseMaps).addTo(map);
    baseMaps["Satellite"].addTo(map);

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
            //find average baseline temp of 4 points furtherest away (max,min lat long?)
            console.log(meanAtts);
            createPropSymbols(response,map,meanAtts);
            createSequenceControls(response, map, meanAtts);
            setChart(meanAtts);
        }
    });
    //load max data
    $.ajax("data/UHIDailySummaries/Maxes12-16.geojson", {
        dataType: "json",
        success: function(response){
            //create attribute array

            var maxAtts = processData(response)
            //console.log(maxAtts);
            var maxAtts = processData(response);
            console.log(maxAtts);
            // console.log(maxAtts);
            // createSequenceControls(map);
            // setChart(maxAtts, colorScale);
        }
    });
    //load the min data
    $.ajax("data/UHIDailySummaries/Mins12-16.geojson", {
        dataType: "json",
        success: function(response){
            //create attribute array
            var minAtts = processData(response)

            //console.log(minAtts);
            // console.log(minAtts);
            // createSequenceControls(map);
            // setChart(minAtts, colorScale)
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
    // Right now pushing HI & tair, but test for interactions
    for (var attribute in properties){
      if (attribute.indexOf("tair")>-1){
        attributes.push(attribute);
      };
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
            if ( feature.properties.year == 2016  &&  feature.properties.month == 01 && feature.properties.day == 01) {
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

    //grab the properties of the attribute - MAKE INTERACTIVE - CHANGE "" TO VARIABLE tempType
    var attValue = feature.properties["tair"];
    //console.log(attValue);
    //define radius via func to calculate based on attribute data
    options.radius = calcPropRadius(attValue);
    //console.log(options.radius);
    //define fill color for each based on attValue (temp)
    //options.fillColor = calcColorVals(attValue);
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
            $("#panel").html(panelContent);
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

//function to find min max temps of the dataset
function calcColorBreaks(data,attribute){
    //array to store all temp data
    var temps = [];
    //grab all temp attribute values and put in the array
    data.features.forEach(function(item){
        if (parseFloat(item.properties[attribute])){
            temps.push(Math.round(parseFloat(item.properties[attribute])*100)/100);
        };
    });
    //get min and max of all temps data
    //var min = Math.min(...temps);
    //var max = Math.max(...temps);
    var colorBreaks = chroma.limits(temps,'e',5);
    return colorBreaks;
};

function createSequenceControls(map, attributes){
	var SequenceControl = L.Control.extend({
		options: {
			position: 'bottomleft'
		},

			onAdd: function (map){
				// Creating a control container for the sequence control slider
				var container = L.DomUtil.create('div', 'sequence-control-container');
				$(container).append('<input class="range-slider" type="range">');
				$(container).append('<button class="skip" id="reverse" title="Reverse"><b>Previous Year</b></button>');
				$(container).append('<button class="skip" id="forward" title="Forward"><b>Next Year</b></button>');

				return container;
			}
	});

		map.addControl(new SequenceControl());
		// Preventing any mouse event listeners on the map to occur
		$('.range-slider').on('mousedown dblclick', function(e){
			L.DomEvent.stopPropagation(e);
		});
		$('#reverse').html('<img src="img/reverse.png">');
		$('#forward').html('<img src="img/forward.png">');
		$('.range-slider').attr({'type':'range',
												'max': 4,
												'min': 0,
												'step': 1,
												'value': 0
											});
		$('.skip').on('mousedown dblclick', function(e){
			L.DomEvent.stopPropagation(e);
		});
		$('.skip').click(function(){
			var index = $('.range-slider').val();

			if ($(this).attr('id') == 'forward'){
				index++;
				index = index > 4 ? 0 : index;
			} else if ($(this).attr('id') == 'reverse'){
				index--;
				index = index < 0 ? 4 : index;
			};
			$('.range-slider').val(index);
			updatePropSymbols(data, map, attributes[index]);
		});
};

/* Creating a function to update the proportional symbols when activated
by the sequence slider */
function updatePropSymbols(data, map, attribute){
  map.eachLayer(function(layer){
		if (layer.feature && layer.feature.properties[attribute]){
			var props = layer.feature.properties;
			var radius = calcPropRadius(props[attribute]);
			layer.setRadius(radius);
            var year = props.year;
            var month = props.month;
            // console.log(props.month);
            var day = props.day;
            var temp = parseFloat(props[attribute]).toFixed(2);
            var colorBreaks = calcColorBreaks(data, year, month, day);
            var options = { radius: 8,
                            fillColor: function(){
                                if (temp < colorBreaks[1]){
                                    return colorScale[0];
                                }
                                else if (temp < colorBreaks[2]){
                                    return colorScale[1];
                                }
                                else if (temp < colorBreaks[3]){
                                    return colorScale[2];
                                }
                                else if (temp < colorBreaks[4]){
                                    return colorScale[3];
                                }
                                else {
                                    return colorScale[4];
                                };
                            },
                            color: "#000",
                            weight: 0.5,
                            opacity: 1,
                            fillOpacity: 0.8
                        };
            layer.setStyle(options);
            // Creating a popup for each of the data points with information
			var popupContent = "<p><b>Temperature:</b> " + parseFloat(props.HI).toFixed(2) + "</p>";
			// console.log(attribute);
			popupContent += "<p><b>Temperature for " + month + "/" + day + "/" + year + ":</b> " + parseFloat(props[attribute]).toFixed(2)+ " %</p>";

			layer.bindPopup(popupContent, {
				offset: new L.Point(0,-radius)
			});
		};
	});
};

function setChart(data){

  $(panel).append("Bar Chart Area");


  // var chartWidth = window.innerWidth * 0.425,
  //     chartHeight = 100,
  //     leftPadding = 25,
  //     rightPadding = 2,
  //     topBottomPadding = 5,
  //     chartInnerWidth = chartWidth - leftPadding - rightPadding,
  //     chartInnerHeight = chartHeight - topBottomPadding * 2,
  //     translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
  //
  // var yScale = d3.scaleLinear()
  //     .range([chartInnerHeight, 0])
  //     .domain([-50,120]);
  //
  // var chart = d3.select("panel2")
  //     .append("svg")
  //     .attr("width", chartWidth)
  //     .attr("height", chartHeight)
  //     .attr("class", "chart");
  //
  // var chartBackground = chart.append("rect")
  //     .attr("class", "chartBackground")
  //     .attr("width", chartInnerWidth)
  //     .attr("height", chartInnerHeight)
  //     .attr("transform", translate);
  //
  // // Creating a vertical axis generator for the bar chart
  // var yAxis = d3.axisLeft()
  //     .scale(yScale);
  //
  // // Placing the axis
  // var axis = chart.append("g")
  //     .attr("class", "axis")
  //     .attr("transform", translate)
  //     .call(yAxis);
  //
  // // Creating a frame for the chart border
  // var chartFrame = chart.append("rect")
  //     .attr("class", "chartFrame")
  //     .attr("width", chartInnerWidth)
  //     .attr("height", chartInnerHeight)
  //     .attr("transform", translate);
  //
  //

};

$(document).ready(initialize);
