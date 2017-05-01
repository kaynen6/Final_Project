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
    $('#ajaxloader').hide();
    $('#legendid').append('<form action=""><input type="radio" name="tempradio" value="max">Maximum Daily Temperatures<br><input type="radio" name="tempradio" value="mean">Mean Daily Temperatures<br><input type="radio" name="tempradio" value="min">Minimum Daily Temperatures</form>');
    //function to load data from files
    loadData(map);

};

//function to load geojson data with ajax
function loadData(map){
    //determine which radio button is checked
    $('#tempradio').change(function(){
        if ($('#tempradio').value == 'mean'){
             //start loading affordance 
            $('#ajaxloader').show();
            //load the Means data via ajax
            $.ajax("data/UHIDailySummaries/Means12-16.geojson", {
                dataType: "json",
                success: function(response){
                    //create attribute array
                    var meanAtts = processData(response);
                    createSymbols(response,map,meanAtts);
                    createSequenceControls(response, map, meanAtts);
                    setChart(meanAtts);
                    //hide loading affordance
                    $('#ajaxloader').hide();
                }
            });
        }
        else if ($('#tempradio').value == 'max'){
            //start loading affordance 
            $('#ajaxloader').show();
            //load max data
            $.ajax("data/UHIDailySummaries/Maxes12-16.geojson", {
                dataType: "json",
                success: function(response){
                    //create attribute array
                    var maxAtts = processData(response);
                    console.log(maxAtts);
                    createSequenceControls(map);
                    setChart(maxAtts, colorScale)
                    //hide loading affordance
                    $('#ajaxloader').hide();
                }
            });
        }
        else if ($('#tempradio').value == 'min'){
             //start loading affordance 
            $('#ajaxloader').show();
             //load the min data
            $.ajax("data/UHIDailySummaries/Mins12-16.geojson", {
                dataType: "json",
                success: function(response){
                    //create attribute array
                    var minAtts = processData(response)
                    createSequenceControls(map);
                    setChart(minAtts, colorScale)
                    //hide loading spinner affordance
                    $('#ajaxloader').hide();
                }
            });    
        };
    });
};

//create an attributes array from data
function processData(data){
    //empty array to hold attribute index names
    var attributes = [];
    //properties of the first feature in the dataset
    var properties = data.features[0].properties;
    //push each attribute name into attributes array
    // Right now pushing HI & tair, but test for interactions
    for (var attribute in properties){
      //if (attribute.indexOf("HI")>-1 || attribute.indexOf("tair")>-1 || attribute.indexOf("year")>-1){
        attributes.push(attribute);
    };
    return attributes;
};


//create proportional sybols form geojson data properties
function createSymbols(response, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(response, {
        //point to layer converts each point feature to layer to use circle marker
        pointToLayer: function(feature, latlng, attributes){
            return pointToLayer(feature, latlng, attributes);
        },
        //filtering the data for default date - make this interactive at some point
        filter: function(feature, layer){
            if (feature.properties.year == 2016 && feature.properties.month == 01 && feature.properties.day == 01) {
                return true
            // return feature.properties.year == 2016?  Will need to remove one/two of these constraints (day, month, year)?
            }
        }
    }).addTo(map);
};

//initial symbolization when map loads for first time
function pointToLayer(feature, latlng, attributes,){
    //grab the properties of the attribute tair - default
    var attValue = feature.properties["tair"];
    //create marker options w/ defualt styling
    var options = {
        radius: 8,
        fillColor: "lightblue",
        color: "#000",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 0.8
    };    
    //console.log(attValue);
    /*if (attValue < 0){
        attValue = Math.abs(attValue);
    } else {
        attValue = attValue;
    }; */
    //define radius via func to calculate based on attribute data
    //options.radius = calcPropRadius(attValue);
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
/*function calcPropRadius(attValue) {
    //scale factor for even symbol size adjustments
    var scaleFactor = 25;
    //area based on attribute value and scale factor
    var area = Math.abs(attValue) * scaleFactor;
    //radius is calc based on area
    var radius = Math.sqrt(area/Math.PI);
    return radius;
};*/



function createSequenceControls(data,map, attributes){
	$('#panel1').append('<input class="range-slider" type="range">');

    $('.range-slider').attr({
        max: 4,
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
			index = index > 4 ? 0 : index;
		} else if ($(this).attr('id') == 'reverse'){
			index--;
			index = index < 0 ? 4 : index;
		};
		$('.range-slider').val(index);
		updatePropSymbols(data,map, attributes[index]);
	});

	$('.range-slider').on('input', function(){
		var index = $(this).val();
		updatePropSymbols(data, map, attributes[index]);
    });
};

/* Creating a function to update the proportional symbols when activated
by the sequence slider */
function updatePropSymbols(data, map, attribute){
    map.eachLayer(function(layer){
		if (layer.feature && layer.feature.properties[attribute]){
			var props = layer.feature.properties;
			var options = { radius: 8,
                            fillColor: "lightblue",
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
				offset: new L.Point(0,-layer.options.radius)
			});
		};
	});
};

function setChart(data){
  var chartWidth = window.innerWidth * 0.425,
      chartHeight = 100,
      leftPadding = 25,
      rightPadding = 2,
      topBottomPadding = 5,
      chartInnerWidth = chartWidth - leftPadding - rightPadding,
      chartInnerHeight = chartHeight - topBottomPadding * 2,
      translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

  var yScale = d3.scaleLinear()
      .range([chartInnerHeight, 0])
      .domain([-50,120]);

  var chart = d3.select("panel2")
      .append("svg")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("class", "chart");

  var chartBackground = chart.append("rect")
      .attr("class", "chartBackground")
      .attr("width", chartInnerWidth)
      .attr("height", chartInnerHeight)
      .attr("transform", translate);

  // Creating a vertical axis generator for the bar chart
  var yAxis = d3.axisLeft()
      .scale(yScale);

  // Placing the axis
  var axis = chart.append("g")
      .attr("class", "axis")
      .attr("transform", translate)
      .call(yAxis);

  // Creating a frame for the chart border
  var chartFrame = chart.append("rect")
      .attr("class", "chartFrame")
      .attr("width", chartInnerWidth)
      .attr("height", chartInnerHeight)
      .attr("transform", translate);

  //alert("Do you know where this is going?");

  // loading geojson
  //
  //
};
$(document).ready(initialize);
