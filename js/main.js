function initialize(){
    var currentYear;
    var currentMonth;
    var currentDay;

    createMap();
};


// Creating a function to instantiate the map with Leaflet
function createMap(){
    $('#ajaxloader').show();
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

    $('#legendid').append('<form><h5>Select a Temperature Calculation to Desplay:</h5><br><input type="radio" name="calcradio" value="HI">Heat Index Temperatures<br><input type="radio" name="calcradio" value="AT">Apparent Temperature<br><input type="radio" name="calcradio" value="tair" checked="checked">Air Temperature</form>');
    $('#legendid').append('<form><h5>Select a Temperature Aggregation to Display:</h5><br><input type="radio" name="tempradio" value="max">Maximum Daily Temperatures<br><input type="radio" name="tempradio" value="mean" checked="checked">Mean Daily Temperatures<br><input type="radio" name="tempradio" value="min">Minimum Daily Temperatures</form>');
    //set listeners for radio buttons for temp calculation type (heat index, apparent temp, air temp)
    $(':radio[name=calcradio]').change(function(){
        //function to load data from files
        loadData(map);
    });
<<<<<<< HEAD

=======
    //listener for data set radio buttons (temperature aggregation - min,max,mean)
>>>>>>> refs/remotes/origin/master
    $(':radio[name=tempradio]').change(function(){
        //function to load data from files
        loadData(map);
    });
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
                //create attribute array
                var meanAtts = processData(response);
                //create the point symbols
                createSymbols(response,map,meanAtts,tempType);
                createSlider(response, map, meanAtts);
                // setChart(meanAtts, attributes);
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
                createSymbols(response,map, maxAtts, tempType);
                createSlider(response, map, maxAtts);
                // setChart(maxAtts, attributes)
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
                createSlider(response, map, minAtts)
                // setChart(minAtts, attributes)
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
    }).val();
    console.log(tempType);
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
                    setChart(meanAtts, attributes);

                    //hide loading affordance
                    $('#ajaxloader').hide();
                }
            });
        } else if ($(':radio[value=max]').is(':checked')){
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
        } else if ($(':radio[value=min]').is(':checked')){
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
    return type;
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
function createSymbols(response, map, attributes, tempType){
    //create an array for temperatures of given day
    var temps = [];
    //create a Leaflet GeoJSON layer and add it to the map
    var geojson = L.geoJson(response,{
        //point to layer converts each point feature to layer to use circle marker
        pointToLayer: function(feature, latlng, attributes){
            //push temps for that day into the temps array from above
            if (feature.properties.year == 2015 && feature.properties.month == 07 && feature.properties.day == 01){
                console.log(tempType);
                temps.push(feature.properties[tempType]);
            };
            return pointToLayer(feature, latlng, attributes, tempType);
        },
        //filtering the data for default date - make this interactive at some point
        filter: function(feature, layer){
            if (feature.properties.year == 2015 && feature.properties.month == 07 && feature.properties.day == 01) {
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
    var popupContent = "<p><b>Station:</b> " + feature.properties.SID + "</p>" + tempLabel + " = " + feature.properties[tempType];
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
  // console.log(data.features[0].properties["date"]);
  newDate = ""
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
    var minDate = new Date(data.features[0].properties["date"]);
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
      	var datestep = $(this).val();
        datestep = parseFloat(datestep);
        var newDate = new Date(datestep);
        newDate = newDate.toLocaleDateString();
        console.log(newDate);
    });
    console.log(newDate);
  //   updatePropSymbols(map, attributes["date"], newDate);
  //   // setChart(data);
	// // });
};

/* Creating a function to update the proportional symbols when activated
by the sequence slider */
function updatePropSymbols(data, map, attribute, newDate){
    map.eachLayer(function(layer){
		if (layer.feature && layer.feature[0].properties[attribute] == newDate){
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


  // updateChart(asdflk)
};

$(document).ready(initialize);
