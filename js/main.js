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
    baseMaps["Satellite"].addTo(map);

    //show data load affordance spinner

    $('#ajaxloader').hide();
    $('#legendid').append('<form><h5>Select a Temperature Calculation to Desplay:</h5><br><input type="radio" name="calcradio" value="HI">Heat Index Temperatures<br><input type="radio" name="calcradio" value="AT">Apparent Temperature<br><input type="radio" name="calcradio" value="tair" checked="checked">Air Temperature</form>');
    $('#legendid').append('<form><h5>Select a Temperature Aggregation to Display:</h5><br><input type="radio" name="tempradio" value="max">Maximum Daily Temperatures<br><input type="radio" name="tempradio" value="mean" checked="checked">Mean Daily Temperatures<br><input type="radio" name="tempradio" value="min">Minimum Daily Temperatures</form>');

    //function to load data from files
    loadData(map);

};

//function to load geojson data with ajax
function loadData(map){
    //check
    /*$(':radio[name=calcradio]').change(function(){
        if ($(':radio[value=tair]').is(':checked')){
            return "tair";
        }
        else if ($(':radio[value=HI]').is(':checked')){
            return "HI";
        }
        else if ($(':radio[value=AT]').is(':checked')){
            return "AT";
        }
    }).val();
    console.log(tempType);*/
    //determine which radio buttons are checked
    $(':radio[name=tempradio]').change(function(){
        if ($(':radio[value=mean]').is(':checked')){
             //start loading affordance
            $('#ajaxloader').show();
            //load the Means data via ajax
            $.ajax("data/UHIDailySummaries/Means12-16.geojson", {
                dataType: "json",
                success: function(response){
                    //create attribute array
                    var meanAtts = processData(response);

                    var tempType = "tair";
                    createSymbols(response,map,meanAtts);
                    createSlider(response, map, meanAtts);
                    // setChart(meanAtts, attributes);

                    //hide loading affordance
                    $('#ajaxloader').hide();
                }
            });
        }
        else if ($(':radio[value=max]').is(':checked')){
            //start loading affordance
            $('#ajaxloader').show();
            //load max data
            $.ajax("data/UHIDailySummaries/Maxes12-16.geojson", {
                dataType: "json",
                success: function(response){
                    //create attribute array
                    var maxAtts = processData(response);

                    createSymbols(response,map, maxAtts);
                    createSlider(response, map, maxAtts);
                    // setChart(maxAtts, attributes)
                    //hide loading affordance
                    $('#ajaxloader').hide();
                }
            });
        }
        else if ($(':radio[value=min]').is(':checked')){
             //start loading affordance
            $('#ajaxloader').show();
             //load the min data
            $.ajax("data/UHIDailySummaries/Mins12-16.geojson", {
                dataType: "json",
                success: function(response){
                    //create attribute array
                    var minAtts = processData(response);
                    createSymbols(response,map,minAtts);
                    createSlider(response, map, minAtts)
                    // setChart(minAtts, attributes)
                    //hide loading spinner affordance
                    $('#ajaxloader').hide();
                    console.log(minAtts);
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
    //create an array for temperatures of given day
    var temps = [];
    //create a Leaflet GeoJSON layer and add it to the map
    var geojson = L.geoJson(response,{
        //point to layer converts each point feature to layer to use circle marker
        pointToLayer: function(feature, latlng, attributes){
            //push temps for that day into the temps array from above
            if (feature.properties.year == 2015 && feature.properties.month == 07 && feature.properties.day == 01){
                console.log(feature.properties);
                temps.push(feature.properties["tair"]);
            };
            return pointToLayer(feature, latlng, attributes);
        },
        //filtering the data for default date - make this interactive at some point
        filter: function(feature, layer){
            if (feature.properties.year == 2015 && feature.properties.month == 07 && feature.properties.day == 01) {
                return true
            // return feature.properties.year == 2016?  Will need to remove one/two of these constraints (day, month, year)?
            }
        }
    }).addTo(map);
    //get color scale breaks
    var colorBreaks = calcColorBreaks(temps);
    geojson.eachLayer(function(layer){
        var temp = layer.feature.properties["tair"];
        layer.setStyle({
            fillColor: getColor(colorBreaks, temp)
        });
    });
};

function calcColorBreaks(temps){
    //chroma.js determines class breaks from the array of temperatures (or any data)
    // here we use equal classes, 5 classes.
    console.log(temps);
    var colorBreaks = chroma.limits(temps,'q',5);
    return colorBreaks;
};

//function to find min max temps of the dataset
function getColor(colorBreaks, temp){
    //color scale is from colorbrewer...
    var colorScale = ['#0571b0','#92c5de','#f7f7f7','#f4a582','#ca0020'];
    //find what class the temp value falls in and assign color
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
function pointToLayer(feature, latlng, attributes){
    //grab the properties of the attribute tair - default
    var attValue = feature.properties["tair"];
    //create marker options w/ defualt styling
    var options = {
        radius: 9,
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
    var popupContent = "<p><b>Station:</b> " + feature.properties.SID + "</p>";
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
        },
        click: function(){
            $("#panel1").html(panelContent);
        }
    });
    return layer;
};




function createSlider(data, map, attributes){
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
		$('.range-slider').on('mousedown', function(e){
			L.DomEvent.stopPropagation(e);
		});
		$('#reverse').html('<img src="img/reverse.png">');
		$('#forward').html('<img src="img/forward.png">');
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

		$('.skip').on('mousedown dblclick', function(e){
			L.DomEvent.stopPropagation(e);
		});
		$('.skip').click(function(){
			var datestep = $('.range-slider').val();
			if ($(this).attr('id') == 'forward'){
				datestep = parseFloat(datestep);
        datestep += 86400000;
				datestep = datestep > maxDate ? minDate : datestep;
        var newdate = new Date(datestep);
        newdate = newdate.toLocaleDateString();
        console.log(newdate);
			} else if ($(this).attr('id') == 'reverse'){
        datestep = parseFloat(datestep);
				datestep -= 86400000;
				datestep = datestep < minDate ? maxDate : datestep;
        var newdate = new Date(datestep)
        newdate = newdate.toLocaleDateString();
        console.log(newdate);
			};
		$('.range-slider').val(datestep);

    // $('.range-slider').on('slide', function(){
    //
    // });

    // $('.range-slider').text(newdate);
		// updatePropSymbols(map, attributes[newdate]);
    setChart(data, attributes[newdate]);
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

  var chartWidth = panelContainer.innerWidth,
      chartHeight = 25,
      leftPadding = 25,
      rightPadding = 2,
      topBottomPadding = 5,
      chartInnerWidth = chartWidth - leftPadding - rightPadding,
      chartInnerHeight = chartHeight - topBottomPadding * 2,
      translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

  var yScale = d3.scaleLinear()
      .range([chartInnerHeight, 0])
      .domain([-50,120]);

  var chart = d3.select("panelContainer")
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

  // updateChart(asdflk)
};

$(document).ready(initialize);
