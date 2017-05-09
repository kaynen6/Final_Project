function initialize(){

    createMap();
};


// Creating a function to instantiate the map with Leaflet
function createMap(){
    $('#ajaxloader').show();
    var map = L.map('mapid', {
        center: [43.0731,-89.4012],
        zoom: 13,
        maxZoom: 18,
        minZoom: 8
    });

    // Adding the Satellite tilelayer
    var satellite = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }),
    streets = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
    });
    var baseMaps = {
      "Streets": streets,
      "Satellite": satellite
    };

    //preliminary zoom reset "button", gotta find a button//
	var control = new L.control({position:'topright'});
	control.onAdd = function(map){
			var azoom = L.DomUtil.create('a','resetzoom');
			azoom.innerHTML = "[Reset Zoom]";
			L.DomEvent
				.disableClickPropagation(azoom)
				.addListener(azoom, 'click', function() {
					map.setView(map.options.center, map.options.zoom);
				},azoom);
			return azoom;
		};
    control.addTo(map)

    L.control.layers(baseMaps).addTo(map);
    baseMaps["Streets"].addTo(map);
    //load data based on default selections
    loadData(map);

    //submit button
    $('#legendContainer').append("<center><input type='submit' name='Update' value='Update'></input>");

    //create radio buttons for selecting temps attributes to display
    $('#tempCalc').append('<form><h5>1) Select A Temperature Calculation to Display:</h5><p><input type="radio" name="calcradio" value="HI">Heat Index Temperatures<br><input type="radio" name="calcradio" value="AT">Apparent Temperature<br><input type="radio" name="calcradio" value="tair">Air Temperature</form>');
    $('#tempAgg').append('<form><h5>2) Select A Temperature Aggregation to Display:</h5><p><input type="radio" name="tempradio" value="max">Maximum Daily Temperatures<br><input type="radio" name="tempradio" value="mean">Mean Daily Temperatures<br><input type="radio" name="tempradio" value="min">Minimum Daily Temperatures</form>');

    $('#dropdown').append('<h5> 3) Select a Date: </h5><p>');
     //dropdown for month
    $('#dropdown').append("<select id='monthdd'><option value='01'>January</option><option value='02'>February</option><option value='03'>March</option><option value='04'>April</option><option value='05'>May</option><option value='06'>June</option><option value='07'>July</option><option value='08'>August</option><option value='09'>September</option><option value='10'>October</option><option value='11'>November</option><option value='12'>December</option></select>");
    //dropdown for year
    $('#dropdown').append("<select id='yeardd'><option value='2012'>2012</option><option value='2013'>2013</option><option value='2014'>2014</option><option value='2015'>2015</option><option value='2016'>2016</option></select>");
    //load data based on default selections
    loadData(map);

    //submit button listener
    $(':submit').on('click', function(){
        loadData(map);
    });
    $('#ajaxloader').hide();
};

//function to load geojson data with ajax
function loadData(map){
    //file name holder
    var file;
    var tempType = getTempType();
    //determine which radio buttons are checked
    //if means are asked for:
    if ($(':radio[value=mean]').is(':checked')){
        //if mean temps checked:
        file = "data/UHIDailySummaries/Means12-16.geojson";
    } //if max temps:
    else if ($(':radio[value=max]').is(':checked')){
        file = "data/UHIDailySummaries/Maxes12-16.geojson";
    }     //if minimum temps:
    else if ($(':radio[value=min]').is(':checked')){
        file = "data/UHIDailySummaries/Mins12-16.geojson";
    };
    //start loading affordance
    $('#ajaxloader').show();
    //load the Means data via ajax with specified file
    $.ajax(file, {
        dataType: "json",
        success: function(response){
            //create attribute array
            var attributes = processData(response);
            //month and year set from the user via dropdown boxes
            var month = $('#monthdd').val();
            var year = $('#yeardd').val();
            createSlider(response, map, attributes, month, year);
            var day = $('.range-slider').val()
            //create the point symbols
            createSymbols(response, map, attributes, tempType, day, month, year);
            $('.range-slider').on('input', function(){
                day = $('.range-slider').val()
                createSymbols(response, map, attributes, tempType, day, month, year);
            });
            setChart(response, attributes, tempType, day, month, year);
            //hide loading affordance
            $('#ajaxloader').hide();
        }
    });
};

//function returns the value for the selected radio button
function getTempType(){
    var type;
        //if regualar air temperature:
        if ($(':radio[value=tair]').is(':checked')){
            type = "tair";
        }
        //if Heat Index:
        else if ($(':radio[value=HI]').is(':checked')){
            type = "HI";
        }
        //if Apparent Temperature:
        else if ($(':radio[value=AT]').is(':checked')){
            type = "AT";
        }
    return type;
};

//create an attributes array from data
function processData(data){
    //empty array to hold attribute index names
    var attributes = [];
    //properties of the first feature in the dataset
    var properties = data.features[0].properties;
    //push each attribute name into attributes array

    for (var attribute in properties){
      attributes.push(attribute);
    };
    return attributes;
};

//create proportional symbols form geojson data properties
function createSymbols(response, map, attributes, tempType, day, month, year){
    //create an array for temperatures of given day
    var temps = [];
    //create a Leaflet GeoJSON layer and add it to the map
    var geojson = L.geoJson(response,{
        //point to layer converts each point feature to layer to use circle marker
        pointToLayer: function(feature, latlng, attributes){
            //push temps for that day into the temps array from above
            if (feature.properties.year == year && feature.properties.month == month && feature.properties.day == day){
                temps.push(feature.properties[tempType]);
                return pointToLayer(feature, latlng, attributes, tempType, day, month, year);
            };
        },
        //filtering the data for default date - make this interactive at some point
        filter: function(feature, layer){
            if (feature.properties.year == year && feature.properties.month == month && feature.properties.day == day) {
                return true
            // return feature.properties.year == 2016?  Will need to remove one/two of these constraints (day, month, year)?
            }
        }
    }).addTo(map);
    console.log(temps)
    //get color scale breaks via function
    var colorBreaks = calcColorBreaks(temps);
    geojson.eachLayer(function(layer){
        //get the temp of the point in question
        var temp = layer.feature.properties[tempType];
        //adjust the default style to new fill color via function
        layer.setStyle({
            fillColor: getColor(colorBreaks, temp)
        });
    });
};

//function to calculate the class breaks of the temperature data for the day
function calcColorBreaks(temps){
    //chroma.js determines class breaks from the array of temperatures (or any data)
    // here we use quantile classes, 5 classes.
    var colorBreaks = chroma.limits(temps,'q',5);
    return colorBreaks;
};

//function takes the breaks for the color scale from previous function and assigns colors accordingly
function getColor(colorBreaks, temp){
    //color scale is from colorbrewer...
    var colorScale = ['#0571b0','#92c5de','#f7f7f7','#f4a582','#ca0020'];
    //find what class the temp value falls in and assign color from above scale
    if (temp <= colorBreaks[1]){
        return colorScale[0];
    }
    else if (temp <= colorBreaks[2]){
        return colorScale[1];
    }
    else if (temp <= colorBreaks[3]){
        return colorScale[2];
    }
    else if (temp <= colorBreaks[4]){
        return colorScale[3];
    }
    else if (temp <= colorBreaks[5]){
        return colorScale[4];
    }
    else if (temp == "NA"){
        return "000000";
    }
};

//initial symbolization when map loads for first time
function pointToLayer(feature, latlng, attributes, tempType, day, month, year){
    //grab the properties of the attribute tair - default
    var attValue = feature.properties[tempType];
    //create marker options w/ defualt styling
    var options = {
        radius: 9,
        fillColor: "lightblue",
        color: "#000",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 0.8
    };
    //create circleMarker
    var layer = L.circleMarker(latlng, options);
    //convert attributes to english
    var tempLabel;
    if (tempType == "HI"){
            tempLabel = "Heat Index"
        }
        else if (tempType == "AT"){
            tempLabel = "Apparent Temperature"
        }
        else if (tempType == "tair"){
            tempLabel = "Air Temperature"
        };
    //create popup content string
    var popupContent = "<p><b>Station:</b> " + feature.properties.SID + "</p>" + "<p><b>Date: </b>" + feature.properties.month + "/" + feature.properties.day + "/" + feature.properties.year + "</p>" + "<p><b>" + tempLabel + " =</b> " + parseFloat(feature.properties[tempType]).toFixed(2) + "</p>";
    // //add panel content variable
    // var panelContent = "";
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
        }
        // click: function(){
        //     $("#panel1").html(panelContent);
        // }
    });
    return layer;
};

function createSlider(data, map, attributes, month, year){
  dayArray = [];
    for (i=0;i<data.features.length;i++){
      if (data.features[i].properties["month"]== month && data.features[i].properties["year"]== year && data.features[i].properties["SID"] == "S.001.R"){
        newDay = data.features[i].properties["day"];
        dayArray.push(newDay);
      };
    };
    if (dayArray.length < 1){
      alert("No information was collected for " + month + "/" + year)
    };

  // remove slider if the slider already exists
  $(".sequence-control-container.leaflet-control").removeClass();
  $(".range-slider").remove();
	var SequenceControl = L.Control.extend({
		options: {
			position: 'bottomleft'
		},

			onAdd: function (map){
				// Creating a control container for the sequence control slider
				var container = L.DomUtil.create('div', 'sequence-control-container');
				$(container).append('<input class="range-slider" type="range">');
        $(container).on('mousedown', function(e){
          e.stopPropagation();
          return false;
        });

				return container;
			}
	});
    map.addControl(new SequenceControl());
		$('.range-slider').attr({'type':'range',
            'max': dayArray.length,
            'min': dayArray[0],
            'step': 1,
            'value': dayArray[0]
        });
    // Preventing any mouse event listeners on the map to occur
    $('.range-slider').on('mousedown', function(e){
      L.DomEvent.stopPropagation(e);
    });
};

function setChart(data, attributes, tempType, day, month, year){
  $("#panelContainer").empty();

  dataArray = [];
  tempTotal = 0;
  tempTotalCount = 0;

  for (i=0;i<data.features.length;i++){
    if (data.features[i].properties["month"]==Number(month) && data.features[i].properties["year"]==Number(year)){
      sid = data.features[i].properties["SID"];
      newDay = data.features[i].properties["day"];
      tempVal = parseFloat(data.features[i].properties[tempType]).toFixed(2);
        if (data.features[i].properties["day"] == Number(day)){
          if (!isNaN (Number(tempVal))){
            tempTotal += Number(tempVal);
            tempTotalCount += 1;
          };
        }
      var tempObject = {
        day: newDay,
        // SID: sid,
        value: tempVal
      };
      dataArray.push(tempObject);
    };
  };

  console.log(dataArray);

  console.log(tempTotal/tempTotalCount);
  console.log(tempTotalCount);

  console.log(Math.max(dataArray));
  // Loading data into function
  // Filtering data based on inputs for day, month, year.  Return SID (x axis) and tempType (y axis)


  var chartWidth = $("#panelContainer").width(),
      chartHeight = $("#panelContainer").height();
      leftPadding = 40,
      rightPadding = 2,
      topBottomPadding = 5,
      chartInnerWidth = chartWidth - leftPadding - rightPadding,
      chartInnerHeight = chartHeight - topBottomPadding * 2,
      translate = "translate(" + leftPadding * 1.5 + "," + topBottomPadding + ")";

  var yScale = d3.scaleLinear()
      .range([chartInnerHeight, 0])
      .domain([-20,100]);

  // Creating the chart svg
  var chart = d3.select("#panelContainer")
    .append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("class", "chart");

  // Creating a vertical axis generator for the bar chart
  var yAxis = d3.axisLeft()
      .scale(yScale);

  // Placing the axis
  var axis = chart.append("g")
      .attr("class", "axis")
      .attr("transform", translate)
      .call(yAxis);

  // Placing background for the chart
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
      .attr("width", chartInnerWidth-25)
      .attr("height", chartInnerHeight)
      .attr("transform", translate);

  var bar = chart.selectAll(".bar")
      .data(dataArray)
      .enter()
      .append("rect")
      .attr("class", function(d){
        return "bars " + d.day;
      })
      .attr("width", chartInnerWidth / ((tempTotalCount.length)/151)-1)
      .attr("x", function(d, i){
        return d.day * (chartInnerWidth/ ((tempTotalCount.length)/151));
      })
      .attr("height", function(d){
        return yScale(d.tempTotal);
      })
      .attr("y", function(d){
        console.log(d);
        return chartInnerHeight - yScale(d.tempTotal);
      });

  console.log(dataArray.length);
  var chartTitle = chart.append("text")
      .attr("x", 85)
      .attr("y", 30)
      .attr("class", "chartTitle")
      .text("The " + tempType + " for " + month+"/"+year);

};

$(document).ready(initialize);
