/***************************************************************
 * Activity Detail Controller
 * Supports the activity controller and displays data for a single activity.
 * *************************************************************/
angular.module('PMTViewer').controller('ActsDetailCtrl', function ($scope, $rootScope, stateService, activityService, config, mapService, pmtMapService) {

    $scope.stateService = stateService;
    //loader
    $scope.loading = false;
    //map loader
    $scope.mapLoading = false;
    // details object for active detail
    $scope.selectedActivity = {};
    //has map been initialized
    var initialized = false;

    //initialize map for details
    initializeMap();

    //set activity
    setActivity();

    // when the url is updated do this
    $scope.$on('activity_id-update', function () {
        if (initialized) {
            setActivity();

        }
    });

    //show child activity
    $scope.showChildActivity = function (activity, parent_id) {
        stateService.setParamWithVal('activity_id', activity.id.toString());

        //update activity stored in activity Service
        var a = {
            id : activity.id,
            pid : parent_id,
            title : activity._title
        };
        activityService.setSelectedActivity(a);

    };

    function initializeMap() {
        try {
            // create the map control
            var map = L.map('acts-map', {
                zoomControl: false,
                maxZoom: 8
            });

            // disable drag and zoom handlers
            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.keyboard.disable();


            // call the map services to initialize the map
            mapService.init(map);
            mapService.setCursor('default');

            initialized = true;

        }
        // error handler
        catch (ex) {
            // there was an error report it to the error handler
            console.log("There was an error in the detail controller: " + ex);
        }
    }

    //private function to grab activity from url and set page to details
    function setActivity() {
        if (stateService.isParam('activity_id')) {

            //activity id
            if (!isNaN(parseInt(stateService.states.activities.activity_id, 10))) {
                var act_id = parseInt(stateService.states.activities.activity_id, 10);
                //loader
                $scope.loading = true;
                //map loader
                $scope.mapLoading = true;

                // get detail details
                activityService.getDetail(act_id).then(function (d) {
                    //if valid activity
                    if (d.length > 0) {
                        $scope.selectedActivity = d[0].response;

                        //update activity stored in activity Service
                        var a = {
                            id : $scope.selectedActivity.id,
                            pid : $scope.selectedActivity.parent_id,
                            title : $scope.selectedActivity._title
                        };
                        activityService.setSelectedActivity(a);



                        // process data for each UI activity details tabs
                        $scope.selectedActivity.overviewDetails = activityService.processOverview($scope.selectedActivity);
                        $scope.selectedActivity.taxonomyDetails = activityService.processTaxonomies($scope.selectedActivity.taxonomy);
                        $scope.selectedActivity.financialsDetails = activityService.processFinancials($scope.selectedActivity.financials);
                        $scope.selectedActivity.locationDetails = activityService.processLocations($scope.selectedActivity.locations);
                        $scope.selectedActivity.organizationDetails = activityService.processOrganizations($scope.selectedActivity.organizations);

                        //check to see if at least one location has sub national data
                        _.each($scope.selectedActivity.locationDetails, function(l) {
                            if (l.admin1 || l.admin2 || l.admin3) {
                                $scope.subNationallocationData = true;
                            }
                        });

                        // add locations to map
                        if ($scope.selectedActivity.location_ids) {
                            var location_ids = $scope.selectedActivity.location_ids.join(',');
                            mapService.clearGeojson();
                            pmtMapService.getLocations(location_ids).then(function (locations) {
                                _.each(locations, function (location) {
                                    //get the admin level
                                    var adminLevel = location.response._admin_level ? 'admin' + location.response._admin_level : null;


                                    if (location.response.polygon !== null) {
                                        mapService.addGeojson(JSON.parse(location.response.polygon), adminLevel);
                                    }
                                    else {
                                        if (location.response.point !== null) {
                                            mapService.addGeojson(JSON.parse(location.response.point));
                                        }
                                    }
                                });
                                var bounds = mapService.geojson.getBounds();
                                if (bounds) {
                                    mapService.map.fitBounds(bounds);
                                }
                                $scope.mapLoading = false;
                            });
                        }
                        else {
                            mapService.clearGeojson();
                            //set mapview to world
                            mapService.map.fitWorld();
                            //end loader
                            $scope.mapLoading = false;
                        }
                    }
                    else {
                        //update page title
                        activityService.setActivityTitle('No activity found');
                        mapService.clearGeojson();
                        //set mapview to world
                        mapService.map.fitWorld();
                    }
                    // notify listeners that the activity detail is updated
                    $rootScope.$broadcast('activity-detail-updated');
                    //deactivate the loader
                    $scope.loading = false;

                });
            }
        }
    }

});

//custom filter for adding elipses to long strings
angular.module('PMTViewer').filter('cut', function () {
    return function (value, wordwise, max, tail) {
        if (!value) { return ''; }

        max = parseInt(max, 10);
        if (!max) { return value; }
        if (value.length <= max) { return value; }

        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace != -1) {
                //Also remove . and , so its gives a cleaner result.
                if (value.charAt(lastspace - 1) == '.' || value.charAt(lastspace - 1) == ',') {
                    lastspace = lastspace - 1;
                }
                value = value.substr(0, lastspace);
            }
        }
        return value + (tail || ' …');
    };
});


//custom filter for adding elipses to long strings
angular.module('PMTViewer').filter('filterDetailOrgs', function () {
    return function (value) {
        if (!value) { return '--'; }
        //identify number of funders
        var funderCount = value.length;

        if (funderCount > 1) {
            return 'Multiple Funders';
        }
        else if (funderCount === 0) {
            return 'No Information';
        }
        else {
            return value[0].organization;
        }
    };
});

// all templates used by the details:
require('./locations/locations-national.js');