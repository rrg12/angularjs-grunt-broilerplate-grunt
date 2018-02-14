/***************************************************************
 * Map GL Service
 * Provides Mapbox GL Map. 
 * https://www.mapbox.com/mapbox-gl-js/api/
 * *************************************************************/

angular.module('PMTViewer').service('mapGLService', function ($q, $http, $state, $rootScope, $stateParams, stateService, meMapService, basemapService, config) {
    
    // the map service model
    var mapService = {
        map: {},
        style: {},
        sources: {},
        layers: {}
    };
    
    var stateConfig = _.find(config.states, function (states) { return states.route == $state.current.name; });
    
    // when the url is updated do this
    $rootScope.$on('layers-update', function () {
        redraw(false);
    });
    
    // when the style parameter is updated do this
    $rootScope.$on('style-update', function () {
        // if the basemap has changed, update the map
        if (stateService.paramChanged('style') && mapService.map.loaded()) {
            // remove style
            mapService.style = {};
            // get the current state
            var state = stateService.getState();
            // get the style alias from state or default if empty
            // call the style service to get the style layer
            var styleLayer = basemapService.getStyle(state.style || stateConfig.stateParamDefaults.style);
            // add the style layer to the map
            mapService.style = styleLayer;
            mapService.map.setStyle(mapService.style.url);
            //force redraw if layers exists
            if ($stateParams.layers) {
                redraw(true);
            }
        }
    });
    
    // when the zoom parameter is updated do this
    $rootScope.$on('zoom-update', function () {
        redraw(false);
    });
    
    // when the adm level is updated do this
    $rootScope.$on('adm-update', function () {
        redraw(true);
    });
    
    // initialize the map service
    mapService.init = function (map) {
        
        var setState = false;
        // assign the instantiated map to our map variable
        mapService.map = map;
        
        //set state params if empty
        if ($stateParams.lat === '' || $stateParams.lng === '' || $stateParams.zoom === '' || $stateParams.style === '') {
            $stateParams.lat = $stateParams.lat || stateConfig.stateParamDefaults.lat;
            $stateParams.lng = $stateParams.lng || stateConfig.stateParamDefaults.lng;
            $stateParams.zoom = $stateParams.zoom || stateConfig.stateParamDefaults.zoom;
            $stateParams.adm = $stateParams.adm || stateConfig.stateParamDefaults.adm;
            $stateParams.style = $stateParams.style || stateConfig.stateParamDefaults.style;
            $stateParams.layers = $stateParams.layers || stateConfig.stateParamDefaults.source;
            setState = true;
        }
        // set map zoom
        mapService.map.setZoom($stateParams.zoom);
        
        // set the map center
        mapService.map.setCenter([$stateParams.lng, $stateParams.lat]);
        // get the style alias from state or default if empty
        // call the style service to get the style layer
        var styleLayer = basemapService.getStyle($stateParams.style);
        mapService.style = styleLayer;
        // add the style layer to the map
        mapService.map.setStyle(mapService.style.url);
        
        // update the url if it was empty of lat,lng,zoom or style params
        if ($stateParams.lat === '' || $stateParams.lng === '' || $stateParams.zoom === '' || $stateParams.style === '') {
            stateService.setState($state.current.name, $stateParams, false);
        }
        
        // disable specified map interactions
        mapService.disableInteractions(stateConfig.map.disabledInteractions);
        
        // add default layers if url is empty
        if ($stateParams.layers) {
            // call the redraw function to redraw all layers listed in the url
            redraw(true);
        }
        else {
            $stateParams.layers = stateConfig.stateParamDefaults.source;
            stateService.setState($state.current.name, $stateParams, false);
            setState = false; // set to false so state is not set twice below
        }
        
        // setState if it was altered
        if (setState) {
            stateService.setState($state.current.name, $stateParams, false);
        }
        
        //when the map stops moving do this
        mapService.map.on('move', function () {
            var c = map.getCenter();
            var lat = c.lat.toFixed(6);
            var lng = c.lng.toFixed(6);
            var zoom = map.getZoom().toString();
            
            // if the zoom level or lat/log changes then
            // update the states zoom and lat/long parameters
            if ($stateParams.lat !== lat || $stateParams.lng !== lng || $stateParams.zoom !== zoom) {
                $stateParams.lat = lat;
                $stateParams.lng = lng;
                $stateParams.zoom = zoom;
                mapMoveEnd = true;
                stateService.setState($state.current.name, $stateParams, false);
                meMapService.onMapContainerResizeHandler();
            }
        });
        
        // This event is emitted immediately after all necessary resources have been downloaded 
        // and the first visually complete rendering has occurred.
        mapService.map.once('load', function () {
            redraw(true);
        });
        
        // fire custom onclick event
        mapService.map.on('click', function (e) {
            meMapService.onClickHandler(e);
        });
        
        // fire custom mouse hover event
        mapService.map.on('mousemove', function (e) {
            meMapService.onMouseMoveHandler(e);
        });
    };
    
    // loop through interactions in config and disable them
    mapService.disableInteractions = function (handlers) {
        if (handlers.length > 0) {
            handlers.forEach(function (id) {
                mapService.map[id].disable();
            })
        }
    };
    
    // zoom to an extent
    mapService.zoomToExtent = function (extent, options) {
        mapService.map.fitBounds(extent, options);
    };
    
    // make layer visible on map
    mapService.showLayer = function (layer) {
        mapService.map.setLayoutProperty(layer.id, "visibility", "visible");
        mapService.layers[layer.id].visibility = "visible";
    };
    
    // hide layer on map
    mapService.hideLayer = function (layer) {
        mapService.map.setLayoutProperty(layer.id, "visibility", "none");
        mapService.layers[layer.id].visibility = "none";
    };
    
    // checks for existing map source
    mapService.isSource = function (alias) {
        return mapService.map.getSource(alias) !== undefined;
    };
    
    // add source to map and service
    mapService.addSource = function (source) {
        var deferred = $q.defer();
        
        // check for source type
        if (source.type == "vector") {
            
            mapService.map.addSource(source.alias, source); // add vector tile source
            deferred.resolve();

        } else if (source.type == "geojson") {
            
            // get data for geojson ccsource
            $http.get(source.data, { cache: true })
                .success(function (response) {
                var sourceObj = new mapboxgl.GeoJSONSource({ data: response }); // create source object
                mapService.map.addSource(source.alias, sourceObj); // add source
                deferred.resolve();
            })
                .error(function (error) {
                deferred.reject(error);
            });
        }
        
        mapService.sources[source.alias] = source;
        
        return deferred.promise;
    };
    
    // take array of layers and batch them to the map
    mapService.addLayers = function (map, layers) {
        map.batch(function (batch) {            
            // add all layers to map
            layers.forEach(function (lyr) {
                // add layers before country labels
                batch.addLayer(lyr, "country-label");
                mapService.layers[lyr.id] = lyr;
            });

        });
    };
    
    // remove source from map and service
    mapService.removeSource = function (alias) {
        mapService.map.removeSource(alias);
        delete mapService.sources[alias];
    };

    // loop through the list of layers in state
    // and draw them on the map
    function redraw(force_redraw) {
        // init me map service
        meMapService.init(mapService.map);
        // get the current state
        var state = stateService.getState();
        var loaded = mapService.map.loaded();
        // if the layer list has changed, update the map
        if (stateService.paramChanged('layers') || stateService.paramChanged('zoom') || force_redraw) {
            var layers = state.layers.split(',');            
            // loop through all sources
            _.each(stateConfig.map.sources, function (source) {
                // layer is IN state: put it/keep it on the map                
                if (_.contains(layers, source.alias)) {                    
                    // check if map already has source
                    if (mapService.map.getSource(source.alias)) {
                        // make sure correct layers are showing
                    } else {
                        // map doesn't have source, so add it
                        // map must be loaded
                        // double check for empty source
                        // load all source layer
                        if (!mapService.isSource(source.alias) && loaded) {                            
                            // add source
                            mapService.addSource(source)
                                .then(function () {
                                // batch add source layers to map
                                mapService.addLayers(meMapService.map, source.layers);
                            })
                                .catch(function (err) {
                                console.error(err);
                            });
                        }
                    }
                }
                // layer is NOT in state: remove it from the map
                else {                    
                    // check for source and layer, the remove
                    if (mapService.map.getSource(source.alias)) {
                        // remove layer
                        mapService.removeSource(source.alias);
                    }
                }
            });
        }
    }
    
    return mapService;

});