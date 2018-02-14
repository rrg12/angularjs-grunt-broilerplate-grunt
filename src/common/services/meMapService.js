/***************************************************************
 * M&E Data Map Service
 * Service to interact with M&E Map Data.
 * *************************************************************/

angular.module('PMTViewer').service('meMapService', function ($q, $http, $state, $stateParams, global, config, stateService, me, meDataService) {

    var stateConfig = _.find(config.states, function (states) {
        return states.route == $state.current.name;
    });

    var meMapService = {
        map: {},
        // on click can only be set once
        initialized: false
    };

    // Create country hover a popup, but don't add it to the map yet
    var popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });

    meMapService.init = function (map) {
        meMapService.map = map;

        // set default me filter
        if ($stateParams.me_filter == '') {
            $stateParams.me_filter = $stateParams.me_filter || stateConfig.stateParamDefaults.me_filter;
        }
    };

    // get features from map on click event, create feature collection and return bounding box
    meMapService.getBoundingBox = function (geom) {
        // create feature collection for turf
        var featureCollection = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {},
                "geometry": {}
            }]
        };

        // add vector tile geometry to feature collection
        featureCollection.features[0].geometry = geom;

        // get bounding box
        return turf.extent(featureCollection);
    };

    // set layer visibility to true
    meMapService.showLayer = function (map, id) {
        map.setLayoutProperty(id, "visibility", "visible");
    };

    // set layer visibility to false
    meMapService.hideLayer = function (map, id) {
        map.setLayoutProperty(id, "visibility", "none");
    };

    meMapService.setLayerFilter = function (map, id, filter) {
        map.setFilter(id, filter);
    };

    meMapService.zoomToDefaultState = function (){
        meMapService.map.flyTo({
            center: [stateConfig.stateParamDefaults.lng, stateConfig.stateParamDefaults.lat],
            zoom: stateConfig.stateParamDefaults.zoom,
            speed: 7
        });

        meMapService.resetLayers();
    };

    // dynamically get the next adm level
    meMapService.getNextAdmLevel = function (level) {

        level = level || $stateParams.adm;
        var nextLevel = (level !== "") ? parseInt(level) + 1 : 0;

        // get source
        var source = _.find(stateConfig.map.sources, function (o) {
            return o.alias == stateConfig.stateParamDefaults.adm_source; //TODO add to config
        });

        var layer = _.find(source.layers, function (o) {
            return o.adm == nextLevel;
        });

        // return the next adm level, if it doesn't exist return current adm level
        return layer !== undefined ? (layer.adm) : level;
    };

    // dynamically get the previous adm level
    meMapService.getPrevAdmLevel = function (level) {

        level = parseInt(level) || parseInt($stateParams.adm);

        // get source
        var source = _.find(stateConfig.map.sources, function (o) {
            return o.alias == stateConfig.stateParamDefaults.adm_source;
        });

        var layer = _.find(source.layers, function (o) {
            return o.adm == level;
        });

        // return the previous adm level, make sure subtraction doesn't give you negative number
        return (layer !== undefined && ((layer.adm - 1) >= 0)) ? (layer.adm - 1) : 0;
    };

    // return boundary geometry for given adm code
    meMapService.getBoundaryGeometry = function (adm_code, level) {

        var deferred = $q.defer();
        var column = meMapService.getLayerByLevel(level).column;
        var table = meMapService.getLayerByLevel(level).table;

        var url = me.api[me.env] + '/' + table + '/query?where=' + column + '%20%3D' + adm_code + '&returnfields=title' + '%2C' + column + '&format=geojson&returnGeometry=yes&returnGeometryEnvelopes=no';

        $http.get(url, {cache: true})
            .then(function (response) {

                if (response.data && response.data.error) {
                    deferred.reject(response.data.error);
                }

                response.data.features[0].geometry = JSON.parse(response.data.features[0].geometry.geometries[0]);

                deferred.resolve(response.data);

            }, function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    // get layer based on provided adm level
    meMapService.getLayerByLevel = function (level) {
        // get source
        var source = _.find(stateConfig.map.sources, function (o) {
            return o.alias == stateConfig.stateParamDefaults.adm_source;
        });

        return _.find(source.layers, function (o) {
            return o.adm == level || 0;
        });

    };

    meMapService.disableInteractions = function (map, handlers) {
        if (handlers.length > 0) {
            handlers.forEach(function (id) {
                map[id].disable();
            })
        }
    };

    // get source object by id
    meMapService.getSource = function (id) {
        var source;

        stateConfig.map.sources.forEach(function (s) {
            if (s.alias == id) {
                source = s;
            }
        });

        return source;
    };

    meMapService.createMapFilter = function (filter, operation, key, features, adm_code) {
        var filterArray = [filter];

        if (features.length > 0) {

            features.forEach(function (feature) {
                filterArray.push([operation, key, feature.properties[key]]);
            });

        } else {
            // otherwise, just filter selected adm level
            filterArray.push([operation, key, adm_code]);
        }

        return filterArray;
    };

    // highlight features on hover
    meMapService.onMouseMoveHandler = function (e) {
        var boundaryLayer = $stateParams.adm == "" ? getCurrentLayer() : meMapService.getLayerByLevel(meMapService.getNextAdmLevel());
        var hoverLayer = getLayerById(boundaryLayer.id + "_hover");

        meMapService.map.featuresAt(e.point, {
            radius: 10, //TODO add to config
            layer: boundaryLayer.id
        }, function (err, features) {
            if (err) {
                throw err;
            }

            if (meMapService.map.loaded()) {

                // if no adm level, hover over adm 0, otherwise hover over next adm level
                boundaryLayer = $stateParams.adm == "" ? getCurrentLayer() : meMapService.getLayerByLevel(meMapService.getNextAdmLevel());
                hoverLayer = getLayerById(boundaryLayer.id + "_hover");

                var prevHoverLayer = getLayerById("me_adm" + meMapService.getPrevAdmLevel() + "_hover");

                if (features.length) {

                    // only show pop up at global view
                    if($stateParams.adm === '') {
                        popup.setLngLat(e.lngLat)
                            .setHTML(features[0].properties.title)
                            .addTo(meMapService.map);
                    }

                    // highlight hover
                    meMapService.map.setFilter(hoverLayer.id, ["==", boundaryLayer.column, features[0].properties[boundaryLayer.column]]);
                    $("#meMap .mapboxgl-canvas-container.mapboxgl-interactive").css("cursor", "pointer");
                } else {
                    // reset hover
                    meMapService.map.setFilter(hoverLayer.id, ["==", boundaryLayer.column, ""]);
                    meMapService.map.setFilter(prevHoverLayer.id, ["==", boundaryLayer.column, ""]);
                    $("#meMap .mapboxgl-canvas-container.mapboxgl-interactive").css("cursor", "default");
                    popup.remove();

                }
            }
        });
    };

    // notify map of container resize
    meMapService.onMapContainerResizeHandler = function (bounds) {
        // map container size only adjusts from overview to adm 0
        if (parseInt($stateParams.adm) == 0 || $stateParams.adm == "") {
            // give the map a second to complete zooming transition
            setTimeout(function () {
                meMapService.map.resize();
                if (bounds) {
                    meMapService.map.fitBounds(bounds, {padding: 25});
                }
            }, 1000);
        }
    };

    meMapService.zoomToBoundary = function (level, code, title, geom){

        var layerId = "me_adm" + level;

        // set state params adm level
        // need to update first before getting current layer
        stateService.setParamWithVal("adm", level);

        var layer = meMapService.getLayerByLevel(level);

        // set state params adm name & encode URI component for titles with spaces and slashes
        stateService.setParamWithVal("adm_name", encodeURIComponent(title));
        // set state params adm code
        stateService.setParamWithVal("adm_code", code);

        var nextLayerId = "me_adm" + meMapService.getNextAdmLevel(level);
        layer = getCurrentLayer();
        var featureSelectId = "me_adm" + $stateParams.adm + "_select";
        var prevFeatureSelectId = "me_adm" + meMapService.getPrevAdmLevel(level) + "_select";
        var hoverLayer = getLayerById(getCurrentLayer().id + "_hover");
        var labelLayer = meMapService.getLayerByLevel(meMapService.getNextAdmLevel(level)).table + '-label';
        // hide hover layer
        meMapService.hideLayer(meMapService.map, hoverLayer.id);

        // outline selected feature & hide previous
        outlineFeature(featureSelectId, prevFeatureSelectId, layer.column, code);

        // filter boundary layer
        meMapService.setLayerFilter(meMapService.map, layer.id, ["==", layer.column, code]);

        // get bounds of selected feature
        var polybbox = meMapService.getBoundingBox(geom);
        meMapService.onMapContainerResizeHandler(polybbox);

        // fly to new map bounds with a little extra padding
        meMapService.map.fitBounds(polybbox, {linear:false, padding: 5, speed:1.7});

        // show next adm level label
        meMapService.showLayer(meMapService.map, labelLayer);

        // filter label layer
        meMapService.setLayerFilter(meMapService.map, labelLayer, ["==", layer.column, code]);

        // 1. get next adm levels from api
        // 2. show and filter layers on map
        // 3. if next level has data, make previous layer transparent

        filterByGeom(layer.column, code, function (filter, moveOntoNextLevel) {

            nextLayerId = "me_adm" + meMapService.getNextAdmLevel(level);
            meMapService.nextLevelHasData = moveOntoNextLevel;
            var transparentLayerId = "me_adm" + layer.adm;

            if (moveOntoNextLevel) {

                // filter map
                meMapService.showLayer(meMapService.map, nextLayerId);
                meMapService.setLayerFilter(meMapService.map, nextLayerId, filter);

                // make current adm layer transparent
                meMapService.map.setPaintProperty(transparentLayerId, "fill-color", "#5E9DB1");
                meMapService.map.setPaintProperty(transparentLayerId, "fill-opacity", ".3");

                // hide current adm level label if not at last adm level
                if (meMapService.getNextAdmLevel() !== $stateParams.adm) {
                    meMapService.hideLayer(meMapService.map, layer.table + '-label');
                }

            } else {

                // set filter
                meMapService.map.setFilter(layerId, filter);
                meMapService.map.setPaintProperty(layerId, "fill-color", "#3E7F98");
                meMapService.map.setPaintProperty(layerId, "fill-opacity", 1);

            }
        });
    };

    // hide/show layers when map is clicked
    meMapService.onClickHandler = function (e) {

        var layerId = "me_adm" + meMapService.getNextAdmLevel();

        popup.remove();

        // Use layer option to avoid getting results from other layers
        meMapService.map.featuresAt(e.point, {
            layer: layerId,
            radius: 10,
            includeGeometry: true
        }, function (err, features) {
            if (err) {
                throw err;
            }

            // if there are features within the given radius of the click event,
            if (features.length) {
                var layer = meMapService.getLayerByLevel(meMapService.getNextAdmLevel());

                meMapService.zoomToBoundary(layer.adm, features[0].properties[layer.column], features[0].properties.title, features[0].geometry)
            }
        });
    };

    // draw layers inside mini dialog map
    meMapService.miniMapHandler = function (map, data) {

        var currentLayer = meMapService.getLayerByLevel($stateParams.adm);
        var nextLayer = meMapService.getLayerByLevel(meMapService.getNextAdmLevel());
        var previousLayer = meMapService.getLayerByLevel(meMapService.getPrevAdmLevel());
        var adm_code = parseInt($stateParams.adm_code, 10);
        var labelLayerId = meMapService.getLayerByLevel(meMapService.getNextAdmLevel()).table + '-label';

        // filter layer
        meMapService.showLayer(map, currentLayer.id);
        meMapService.setLayerFilter(map, currentLayer.id, ["==", currentLayer.column, adm_code]);

        // show next adm level label & filter
        meMapService.showLayer(map, labelLayerId);
        meMapService.setLayerFilter(map, labelLayerId, ["==", currentLayer.column, adm_code]);

        // feature select layer
        meMapService.showLayer(map, currentLayer.id + "_select");
        meMapService.setLayerFilter(map, currentLayer.id + "_select", ["==", currentLayer.column, adm_code]);

        meMapService.getSubGeometries($stateParams.adm_code, currentLayer.column, nextLayer.column, nextLayer.table, 'no').then(function (response) {
                meMapService.showLayer(map, nextLayer.id);

                var filter = meMapService.createMapFilter("any", "==", nextLayer.column, response.features, $stateParams.adm_code);
                meMapService.setLayerFilter(map, nextLayer.id, filter);

                if (response.features.length > 0) {

                    meMapService.setLayerFilter(map, previousLayer.id, ["==", previousLayer.column, response.features[0].properties[previousLayer.column]]);

                    // hide current adm level label if not at last adm level
                    if (meMapService.getNextAdmLevel() !== $stateParams.adm) {
                        meMapService.hideLayer(map, currentLayer.table + '-label');
                    }

                } else {
                    //TODO use result to get previous adm levels
                    meMapService.getBoundaryGeometry($stateParams.adm_code, $stateParams.adm)
                        .then(function (res) {
                            // if previous adm level is not current level then filter that layer
                            if (previousLayer.adm !== adm_code) {
                                meMapService.setLayerFilter(map, previousLayer.id, ["==", previousLayer.column, res.features[0].properties[previousLayer.column]]);
                            }
                        });
                }

            });

        //TODO update these colors to be consistent with big map
        //fade previous layer
        map.setPaintProperty(previousLayer.id, 'fill-color', '#5E9DB1');
        map.setPaintProperty(previousLayer.id, 'fill-opacity', '0.3');
        //fade current layer so that next layer stands out
        map.setPaintProperty(currentLayer.id, 'fill-opacity', '0.5');

        var showOnMapDataPromise;

        //get data to highlight areas on map modal with project/indicator
        //if showing data on details modal, ie both indicator and project are specified
        if (data.details) {
            showOnMapDataPromise = meDataService.getShowOnMapDetailsData(adm_code, currentLayer.column, nextLayer.column, data.report_id, data.indicator_id);
        }
        else {
            showOnMapDataPromise = meDataService.getShowOnMapData(adm_code, currentLayer.column, nextLayer.column, $stateParams.me_filter, data.me_filter_id);
        }

        showOnMapDataPromise.then(function (response) {

            if(response.features) {

                //create filter for highlighted layer
                var filter = meMapService.createMapFilter("any", "==", nextLayer.column, response.features, $stateParams.adm_code);

                var highlightedLayer = nextLayer.id + '_highlighted';

                //toggle showing the layer
                meMapService.showLayer(map, highlightedLayer);

                var o = 0; // opacity
                var i = true; // incrementing
                var n = 0; // number of pulses

                var mapInterval = setInterval(function () {
                    pulsate();
                }, 80);

                meMapService.stopMapInterval = function () {
                    clearInterval(mapInterval);
                };

                function pulsate() {
                    if (n < 3) {
                        // filter map
                        meMapService.setLayerFilter(map, highlightedLayer, filter);

                        if (o < 1 && i) {
                            if (n !== 2) {
                                // opacity is less than one and incrementing, add .1
                                o += 0.1;
                            } else {
                                o = (o <= 0.6) ? o + 0.1 : 0.6;
                            }
                            // opacity greater than 1 or decrementing , subtract .1
                        } else if ((o >= 1 || !i) && n !== 2) {
                            o = (o < 0.01) ? 0 : o - 0.1; // decrease when opacity is > 0.1
                            n = (i !== (o <= 0)) ? n + 1 : n; // changes from increment to decrement
                            i = (o <= 0); // increment is true until opacity is <= 0
                        }

                        map.setPaintProperty(highlightedLayer, 'fill-opacity', o);

                    }
                }
            }

        });

    };

    // get the next adm levels admin codes
    meMapService.getSubGeometries = function(adm_code, column, nextColumn, nextTable, geom) {
        var deferred = $q.defer();

        var url = me.api[me.env] + "/" + nextTable + '/query?where=' + column + '%3D' + adm_code +  '&returnfields=title%2C' + column + '%2C' + nextColumn +'&format=geojson&returnGeometry=' + geom + '&returnGeometryEnvelopes=no';

        $http.get(url, {cache: true})
            .then(function (response) {

                var cleanData = [];
                if (response.data && response.data.error) {
                    deferred.reject(response.data.error);
                }

                // make sure data coming from DB does not have a null value for the desired admin level
                response.data.features.forEach(function (response) {
                    if (response.properties[nextColumn] !== null && response.properties.geom !== null) {
                        response.geometry = JSON.parse(response.geometry.geometries[0]);
                        cleanData.push(response);
                    }
                });

                response.data.features = cleanData;

                deferred.resolve(response.data);

            }, function (err) {
                deferred.reject(err);
            });

        return deferred.promise;

    };

    // get geometry by adm code
    meMapService.getGeomByAdm = function (table, column, adm_code) {
        var deferred = $q.defer();

        // get all results if no adm code provided
        var where = (adm_code) ? column + '%3D' + adm_code : '1%3D1';

        var url = me.api[me.env] + "/" + table + '/query?where=' + where + '&returnfields=title%2C' + column + '&format=geojson&returnGeometry=yes&returnGeometryEnvelopes=no';

        $http.get(url, {cache: true})
            .then(function (response) {

                if (response.data && response.data.error) {
                    deferred.reject(response.data.error);
                }

                response.data.features.forEach(function(v){
                    // parse geometry string
                    v.geometry = JSON.parse(v.geometry.geometries[0]);

                    // add custom properties
                    v.properties.adm = $stateParams.adm;
                    v.properties.column = column;
                });

                deferred.resolve(response.data);

            }, function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    // Country List for me Navbar, fetching list from Chubbs was too slow
    meMapService.getCountryList = function (column) {
        var deferred = $q.defer();

        var url = "assets/me-country-dropdown.geojson";

        $http.get(url, {cache: true})
            .then(function (response) {

                if (response.data && response.data.error) {
                    deferred.reject(response.data.error);
                }

                response.data.features.forEach(function(v){
                    // add custom properties
                    v.properties.adm = $stateParams.adm;
                    v.properties.column = column;
                });

                deferred.resolve(response.data);

            }, function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    meMapService.resetLayers = function () {

        meMapService.map.setLayoutProperty(stateConfig.map.defaultLayer, "visibility", "visible");
        meMapService.map.setPaintProperty(stateConfig.map.defaultLayer, "fill-color", "#357584");

        stateService.setParamWithVal("adm", "");
        stateService.setParamWithVal("adm_name", "");
        stateService.setParamWithVal("adm_code", "");

        // show country labels
        meMapService.showLayer(meMapService.map, "country-label");

        // get source
        var source = _.find(stateConfig.map.sources, function (o) {
            return o.alias == stateConfig.stateParamDefaults.adm_source;
        });

        clearLowerGadmLayers(source.layers);

        meMapService.removeHoverFilters();

        // loops through non-default sources, hide layers
        $stateParams.layers.split(",").forEach(function (val) {
            if (val !== 'me_gadm') {
                meMapService.getSource(val).layers.forEach(function (layer) {
                    meMapService.hideLayer(meMapService.map, layer.id);
                });
            }
        });
    };

    meMapService.clearLowerLayers = function(level) {

        // level:0
        // 1. adm 1 layer fill colors back to default
        // 2. adm 1 layer fill colors back to default
        // 3. adm 1 visibility back to default

        stateConfig.map.sources.forEach(function(source){
            source.layers.forEach(function(layer){
                if(layer.adm && layer.id.indexOf("hover") == -1) {
                    if (parseInt(level) !== layer.adm) {
                        meMapService.map.setLayoutProperty(layer.id, "visibility", "none");
                        meMapService.map.setFilter(layer.id, ["==", "", ""]);

                        if(layer.paint["fill-color"]){
                            meMapService.map.setPaintProperty(layer.id, "fill-color", layer.paint["fill-color"]);
                        }
                        if(layer.paint["fill-opacity"]){
                            meMapService.map.setPaintProperty(layer.id, "fill-opacity", layer.paint["fill-opacity"]);
                        }

                    }
                }
            });
        });

        // show country labels
        meMapService.showLayer(meMapService.map, "country-label");
    };

    meMapService.removeHoverFilters = function () {

        var source = _.find(stateConfig.map.sources, function (o) {
            return o.alias == stateConfig.stateParamDefaults.adm_source;
        });

        source.layers.forEach(function (layer) {
            if (layer.id.indexOf("hover") !== -1) {
                meMapService.map.setFilter(layer.id, ["==", "", ""]);
                meMapService.map.setLayoutProperty(layer.id, "visibility", "visible");
            }
        })
    };

    // Select feature and un-select previous
    function outlineFeature(featureSelectId, prevFeatureSelectId, column, adm_code) {
        // show feature select layer
        meMapService.showLayer(meMapService.map, featureSelectId);
        // filter outline feature
        meMapService.setLayerFilter(meMapService.map, featureSelectId, ["==", column, adm_code]);

        if (featureSelectId !== prevFeatureSelectId) {
            meMapService.hideLayer(meMapService.map, prevFeatureSelectId);
        }

    }

    // when an admin1 is clicked, the map should filter to only
    // show admin2 within the selected admin1
    // get next adm level codes and create filter array for map
    function filterByGeom(column, adm_code, callback) {

        var nextAdminLevel = meMapService.getNextAdmLevel();
        var nextAdmin = meMapService.getLayerByLevel(nextAdminLevel);
        var previousLayer = meMapService.getLayerByLevel(meMapService.getPrevAdmLevel());

        var promise = meMapService.getSubGeometries(adm_code, column, nextAdmin.column, nextAdmin.table, 'no');
        // only move onto next level if stateParams.adm is not at lowest level
        var moveOntoNetLevel = !isLastAdmLevel();

        promise.then(function (response) {
            var filterArray = ['any'];

            if (response.features.length > 0) {

                response.features.forEach(function (feature) {
                    filterArray.push(['==', nextAdmin.column, feature.properties[nextAdmin.column]]);
                });

                // only change state if next admin levels exist
                if (filterArray.length > 1) {
                    callback(filterArray, moveOntoNetLevel);
                }
            } else {
                // otherwise, just filter selected adm level
                filterArray.push(["==", column, adm_code]);
                callback(filterArray, false);
            }
        });

    }

    // get Layer based on CURRENT state param adm level
    function getCurrentLayer() {

        var source = _.find(stateConfig.map.sources, function (o) {
            return o.alias == stateConfig.stateParamDefaults.adm_source;
        });

        var layer = _.find(source.layers, function (o) {
            return o.adm == parseInt($stateParams.adm || 0);
        });

        return layer
    }

    // get layer by id
    function getLayerById(id) {
        // get source
        var source = _.find(stateConfig.map.sources, function (o) {
            return o.alias == stateConfig.stateParamDefaults.adm_source;
        });

        return _.find(source.layers, function (o) {
            return o.id == id;
        });

    }

    // return if at last admin level
    function isLastAdmLevel() {
        return $stateParams.adm == meMapService.getNextAdmLevel()
    }

    // draw the white outline layer for a given feature
    function showOutLineLayer(featureSelectId, columnName, level, admCode) {
        if (!meMapService.map.getLayer(featureSelectId)) {
            //add outline for previous layer
            meMapService.map.addLayer({
                "id": featureSelectId,
                "type": "line",
                "source": stateConfig.stateParamDefaults.adm_source, //TODO get source programmatically
                "source-layer": "adm" + level,
                "layout": {},
                "paint": {
                    "line-color": "#ffffff",
                    "line-width": 4
                },
                "filter": ["==", columnName, admCode]
            });
        }

    }

    // change a layers opacity and fill color to background settings
    function changeLayerOpacity(layerId) {
        meMapService.map.setLayoutProperty(layerId, "visibility", "visible");
        meMapService.map.setPaintProperty(layerId, "fill-color", "#5E9DB1");
        meMapService.map.setPaintProperty(layerId, "fill-opacity", ".9");
    }

    // create map layer filter for given features and column name
    function createFilter(features, column) {
        var filterArray = ["any"];

        features.forEach(function (v) {
            filterArray.push(['==', column, v.properties[column]]);
        });

        return filterArray;
    }
    
    // remove feature select and boundary select layers from map
    function clearLowerGadmLayers(layers) {
        layers.forEach(function (layer) {
            
            if (layer.adm !== 0) {
                meMapService.map.setLayoutProperty(layer.id, "visibility", "none");
            } else {
                // reset filter & opacity
                meMapService.map.setFilter(layer.id, stateConfig.stateParamDefaults.filter);
            }
            
            // reset paint properties
            meMapService.map.setPaintProperty(layer.id, "fill-color", layer.paint["fill-color"]);
            meMapService.map.setPaintProperty(layer.id, "fill-opacity", layer.paint["fill-opacity"]);
            
            if (meMapService.map.getLayer("me_adm" + layer.adm + "_select")) {
                meMapService.hideLayer(meMapService.map, "me_adm" + layer.adm + "_select");
            }
        });
    }

    return meMapService;

});