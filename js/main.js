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
<<<<<<< HEAD
            //console.log(meanAtts);
            //find min max for the data to color with
            findMinMax(response);
            //find average baseline temp of 4 points furtherest away (max,min lat long?)
            
=======

            console.log(meanAtts);
>>>>>>> refs/remotes/origin/master
            createPropSymbols(response,map,meanAtts);
            createSequenceControls(map, meanAtts);
            setChart(meanAtts);
        }
    });
    //load max data
    $.ajax("data/UHIDailySummaries/Maxes12-16.geojson", {
        dataType: "json",
        success: function(response){
            //create attribute array
<<<<<<< HEAD
            var maxAtts = processData(response)
            //console.log(maxAtts);
=======
            var maxAtts = processData(response);
            console.log(maxAtts);
            // console.log(maxAtts);
            // createSequenceControls(map);
            // setChart(maxAtts, colorScale)
>>>>>>> refs/remotes/origin/master
        }
    });
    //load the min data
    $.ajax("data/UHIDailySummaries/Mins12-16.geojson", {
        dataType: "json",
        success: function(response){
            //create attribute array
            var minAtts = processData(response)
<<<<<<< HEAD
            //console.log(minAtts);
=======
            // console.log(minAtts);
            // createSequenceControls(map);
            // setChart(minAtts, colorScale)
>>>>>>> refs/remotes/origin/master
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
      if (attribute.indexOf("HI")>-1 || attribute.indexOf("tair")>-1 || attribute.indexOf("year")>-1){
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
        fillOpacity: 0.8
    };
    //define the attribute to grab year, month, day
    //var year = attributes[7];
    //var month = attributes[8];
    //var day = attributes[9];
    
    //grab the properties of the attribute - MAKE INTERACTIVE - CHANGE "HI" TO VARIABLE tempType
    var attValue = feature.properties["HI"];
<<<<<<< HEAD
    //console.log(attValue);
    //define radius via func to calculate based on attribute data
    options.radius = calcPropRadius(attValue);
    //console.log(options.radius);
    //define fill color for each based on attValue (temp)
    //options.fillColor = calcColorVals(attValue);
=======
    if (attValue < 0){
      attValue = Math.abs(attValue);
    } else {
      attValue = attValue;
    };
    // console.log(attValue);
    //define radius via func to calculate based on attribute data
    options.radius = calcPropRadius(attValue);
    // console.log(options.radius);

>>>>>>> refs/remotes/origin/master
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
    var scaleFactor = 25;
    //area based on attribute value and scale factor
    var area = Math.abs(attValue) * scaleFactor;
    //radius is calc based on area
    var radius = Math.sqrt(area/Math.PI);
    return radius;
};

<<<<<<< HEAD
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
=======
function createSequenceControls(map, attributes){
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
      // console.log(props.month);
      var day = props.day;
      // console.log(attribute);
			popupContent += "<p><b>Temperature for " + month + "/" + day + "/" + year + ":</b> " + parseFloat(props[attribute]).toFixed(2)+ " %</p>";
>>>>>>> refs/remotes/origin/master

			layer.bindPopup(popupContent, {
				offset: new L.Point(0,-radius)
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

  alert("Do you know where this is going?");

  // loading geojson
  //
  //
};
$(document).ready(initialize);
