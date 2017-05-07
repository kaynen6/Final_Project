function initialize(){

    createMap();
};


// Creating a function to instantiate the map with Leaflet
function createMap(){
    $('#ajaxloader').show();
    var map = L.map('mapid', {
        center: [43.0731,-89.4012],
        zoom: 14,
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

    $('#tempCalc').append('<form><h5>1) Select A Temperature Calculation to Desplay:</h5><p><input type="radio" name="calcradio" value="HI">Heat Index Temperatures<br><input type="radio" name="calcradio" value="AT">Apparent Temperature<br><input type="radio" name="calcradio" value="tair">Air Temperature</form>');
    $('#tempAgg').append('<form><h5>2) Select A Temperature Aggregation to Display:</h5><p><input type="radio" name="tempradio" value="max">Maximum Daily Temperatures<br><input type="radio" name="tempradio" value="mean">Mean Daily Temperatures<br><input type="radio" name="tempradio" value="min">Minimum Daily Temperatures</form>');
    $('#dropdown').append('<h5> 3) Select a Time: </h5><p>');
    $('#dropdown').append($('dropdown1', 'dropdown2'));

    createDropdown();
    //set listeners for radio buttons for temp calculation type (heat index, apparent temp, air temp)
    $(':radio[name=calcradio]').change(function(){
        //function to load data from files
        loadData(map);
    });

    //listener for data set radio buttons (temperature aggregation - min,max,mean)
    $(':radio[name=tempradio]').change(function(){
        //function to load data from files
        loadData(map);
    });

    // $('#legendid').append('<form><h5> Select A Date:</h5><p><input type = "text" id = "date" name="calcdate" value = "03-19-2012" data-format="DD/MM/YYYY" data-template = "MMM D YYYY">');

    $('#ajaxloader').hide();
};

//function to load geojson data with ajax
function loadData(map){
    var tempType = getTempType();
    //determine which radio buttons are checked
    //if means are asked for:
    if ($(':radio[value=mean]').is(':checked')){
         //start loading affordance
        $('#ajaxloader').show();
        //load the Means data via ajax
        $.ajax("data/UHIDailySummaries/Means12-16.geojson", {
            dataType: "json",
            success: function(response){
              console.log(tempType);
                //create attribute array
                var meanAtts = processData(response);
                //create the point symbols
                createSymbols(response,map,meanAtts,tempType);
                createDropdown(response);
                // setChart(meanAtts);
                //hide loading affordance
                $('#ajaxloader').hide();
            }
        });
    }
    //if max temps are called for:
    else if ($(':radio[value=max]').is(':checked')){
        //start loading affordance
        $('#ajaxloader').show();
        //load max data
        $.ajax("data/UHIDailySummaries/Maxes12-16.geojson", {
            dataType: "json",
            success: function(response){
                //create attribute array
                var maxAtts = processData(response);

                //create the point symbols
                createSymbols(response,map, maxAtts, tempType, currentYear);
                createDropdown(response);
                // createSlider(response, map, maxAtts);
                // setChart(maxAtts);
                //hide loading affordance
                $('#ajaxloader').hide();
            }
        });
    }
    //if minimum temps:
    else if ($(':radio[value=min]').is(':checked')){
         //start loading affordance
        $('#ajaxloader').show();
         //load the min data
        $.ajax("data/UHIDailySummaries/Mins12-16.geojson", {
            dataType: "json",
            success: function(response){
                //create attribute array
                var minAtts = processData(response);
                //create the point symbols
                createSymbols(response,map,minAtts,tempType);
                createDropdown(response);
                // setChart(minAtts);
                // createSlider(response, map, minAtts);

                //hide loading spinner affordance
                $('#ajaxloader').hide();
                console.log(minAtts);
            }
        });
    };
};

//function listens for radio button change on temp calculation type and returns the value for the selected radio button
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
    var year = [];
    var month = [];
    var attributes = [];
    //properties of the first feature in the dataset
    var properties = data.features[0].properties;
    //push each attribute name into attributes array
    // Right now pushing HI & tair, but test for interactions
    for (var attribute in properties){
      if (attribute.indexOf("year")>-1){
        year.push(attribute);
      } else if (attribute.indexOf("month")>-1){
        month.push(attribute);
      };
    };

    for (var attribute in properties){
      attributes.push(attribute);
    };

    console.log(year);
    console.log(month);
    console.log(attributes);
    return year, month, attributes;
};

//create proportional sybols form geojson data properties
function createSymbols(response, map, attributes, tempType){
    //create an array for temperatures of given day
    var temps = [];
    //create a Leaflet GeoJSON layer and add it to the map
    var geojson = L.geoJson(response,{
        //point to layer converts each point feature to layer to use circle marker
        pointToLayer: function(feature, latlng, attributes){
            //push temps for that day into the temps array from above
            if (feature.properties.year == 2012 && feature.properties.month == 03 && feature.properties.day == 19){
                console.log(tempType);
                temps.push(feature.properties[tempType]);
            };
            return pointToLayer(feature, latlng, attributes, tempType);
        },
        //filtering the data for default date - make this interactive at some point
        filter: function(feature, layer){
            if (feature.properties.year == 2012 && feature.properties.month == 03 && feature.properties.day == 19) {
                return true
            // return feature.properties.year == 2016?  Will need to remove one/two of these constraints (day, month, year)?
            }
        }
    }).addTo(map);
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
    else {
        return colorScale[4];
    };
};

//initial symbolization when map loads for first time
function pointToLayer(feature, latlng, attributes, tempType){
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
    /*if (attValue < 0){
        attValue = Math.abs(attValue);
    } else {
        attValue = attValue;
    }; */
    //define radius via func to calculate based on attribute data
    //options.radius = calcPropRadius(attValue);
    //create circleMarker
    var layer = L.circleMarker(latlng, options);
    //convert attributes to english
    console.log(tempType);
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
    var popupContent = "<p><b>Station:</b> " + feature.properties.SID + "</p><p><b>" + tempLabel + " =</b> " + parseFloat(feature.properties[tempType]).toFixed(2) + "</p>";
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

function createSlider(data, map, attributes){
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
          L.DomEvent.stopPropagation(e);
        });

				// $(container).append('<button class="skip" id="reverse" title="Reverse"><b>Previous Year</b></button>');
				// $(container).append('<button class="skip" id="forward" title="Forward"><b>Next Year</b></button>');


				return container;
			}
	});

		map.addControl(new SequenceControl());

		// $('#reverse').html('<img src="img/reverse.png">');
		// $('#forward').html('<img src="img/forward.png">');
    //   var minDate = new Date(data.features[0].properties["date"]);
    var minDate = new Date(2012, 02, 19);

    minDate = minDate.getTime()
    console.log(minDate);
    var maxDate = new Date(2016, 03, 30);
    maxDate = maxDate.getTime()
    console.log(maxDate);

		$('.range-slider').attr({'type':'range',
												'max': maxDate,
												'min': minDate,
												'step': 86400000,
												'value': minDate
											});

    // Preventing any mouse event listeners on the map to occur
  	$('.range-slider').on('input', function(){
  	var newDate = $('.range-slider').on('input', function(){
      	var datestep = $(this).val();
        datestep = parseFloat(datestep);
        var newDate = new Date(datestep);
        newDate = newDate.toLocaleDateString();
        console.log(newDate);
        $('.range-slider').val(datestep);
        // updatePropSymbols(map, attributes, datestep);
    });
    // console.log(newDate);
  //Return datestep into date (m/d/Y) to send date to update chart and update symbols.
    // return newDate;
    // setChart(data);
	});
};

/* Creating a function to update the proportional symbols when activated
by the sequence slider */
function updatePropSymbols(data, map, attribute, datestep){

    map.eachLayer(function(layer){
		if (layer.feature && layer.feature.properties[attribute] ){
      consol.log(layer.feature);

			var props = layer.feature.properties;
      console.log(props);
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
  $("#panelContainer").empty();

  var chartWidth = $("#panelContainer").width(),
      chartHeight = $("#panelContainer").height(),
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

  var bars = chart.selectAll(".bars")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", function(d){
        return "bars " + d.SID;
      })
      .attr("width", chartInnerWidth / data.length);

  var chartTitle = chart.append("text")
      .attr("x", 85)
      .attr("y", 30)
      .attr("class", "chartTitle")
      .text("Chart Area for Stations");

  updateChart(bars, data.length);
};

function createDropdown(data){
  $("#dropdown").remove(".dropdown1");
  $('#dropdown').remove(".dropdown2");

  var year = ["2012", "2013","2014","2015","2016"];
  var month = ["1","2","3","4","5","6","7","8","9","10","11","12"];

  currentYear = year[0];
  currentMonth = month[0];

  expressed = [currentMonth, currentYear];

  var dropdownyear = d3.select('#dropdown')
        .append('select')
        .attr("class", "dropdown1")
        .on("change", function(){
          changeDate(this.value, data)
        });

  var titleOption = dropdownyear.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Year");

  var attrOptions = dropdownyear.selectAll("attrOptions")
        .data(year)
        .enter()
        .append("option")
        .attr("value", function(data){
          return data.properties
        })
        .text(function(d){
          return d
        });

  var dropdownmonth = d3.select('#dropdown')
        .append('select')
        .attr("class", "dropdown2")
        .on("change", function(){
          changeDate(this.value, data)
        })

  var titleOption2 = dropdownmonth.append("option")
        .attr("class", "titleOption2")
        .attr("disabled", "true")
        .text("Select Month");

  var attrOptions2 = dropdownmonth.selectAll("attrOptions")
        .data(month)
        .enter()
        .append("option")
        .attr("value", function(data){
          return data.properties
        })
        .text(function(d){
          return d
        });
  console.log(data);
};

function changeDate(attribute, data){
  if (attribute.indexOf("20") > -1){
    currentYear = attribute
  } else {
    currentMonth = attribute
  };

  console.log(data);
  expressed = [currentYear, currentMonth];
  console.log(expressed[0]);
  console.log(expressed[1]);

  // var bars = d3.selectAll(".bar")
  //   .sort(function(a, b){
  //     return b[expressed][1] - a[expressed][1];
  //   })
  //   // .attr("x", function(d, i){
  //   //   return i * chartInnerWidth/data.length + leftPadding;
  //   // })
  //   // .attr("height", function(d, i){
  //   //   return 500-yScale(parseFloat(d[expressed[1]]));
  //   // })
  //   // .attr("y", function(d, i){
  //   //   return yScale(parseFloat(d[expressed][1]))+ topBottomPadding;
  //   // })
  //   .transition()
  //   .delay(function(d, i){
  //     return i * 20
  //   })
  //   .duration(1000);
  //
  // updateChart(bars, data.length);

};

function updateChart(bars, n){

  var chartWidth = $("#panelContainer").width(),
      chartHeight = $("#panelContainer").height(),
      leftPadding = 40,
      rightPadding = 2,
      topBottomPadding = 5,
      chartInnerWidth = chartWidth - leftPadding - rightPadding,
      chartInnerHeight = chartHeight - topBottomPadding * 2,
      translate = "translate(" + leftPadding * 1.5 + "," + topBottomPadding + ")";

  var yScale = d3.scaleLinear()
      .range([chartInnerHeight, 0])
      .domain([-20,100]);

  bars.attr("x", function(d, i){
        return i * (chartInnerWidth / n) + leftPadding;
    })
    //size/resize bars
    .attr("height", function(d, i){
        return chartInnerHeight - yScale(parseFloat(d[expressed]=="currentMonth"));
    })
    .attr("y", function(d, i){
        return yScale(parseFloat(d[expressed]=="currentMonth")) + topBottomPadding;
    });
    // //color/recolor bars
    // .style("fill", function(d){
    //     return choropleth(d, colorBreaks);
    // });
}





$(document).ready(initialize);
