/***************************************************************
 * Taxonomy Controller
 * A filter controller. Supports the filtering PMT layers by 
 * a taxonomy. Usage is defined in the app.config in the explorer 
 * page filter object.
* *************************************************************/
angular.module('PMTViewer').controller('MapFilterTaxonomyCtrl', function ($scope, $rootScope, $element, stateService, config, pmtMapService, mapService) {
    var initialized = false;
    var dataGroupIds = null;

    // set the "none/unspecified" option to false initially
    $scope.unassigned = {
        "active": false,
        "name": "None/Unspecified",
        "taxonomy_id": $scope.filter.params.taxonomy_id
    };

    // initialize the filter
    init();

    // when the selected filter changes do this
    $scope.$on('pmt-filter-update', function () {
        validateActive();
    });

    // when the selected filter changes do this
    $scope.$on('filter-menu-selected', function () {
        // scroll back to the top
        $('div.sub-menu').scrollTop(0);
        if(!initialized){ init(); }
        validateActive();
    });

    // classification name checked
    $scope.classificationClicked = function (cls) {
        // toggle current classification active flag
        cls.active = !cls.active;
        // reset the selected classifications array
        $scope.selectedClassifications = [];
        // get all the selected classifications
        _.each($scope.filter.options, function (c) {
            if (c.active === true) {
                $scope.selectedClassifications.push(c.id);
            }
        });
        // send the classifications to the pmt map service
        pmtMapService.setClassificationFilter($scope.filter.params.taxonomy_id,
            $scope.selectedClassifications);

    };

    // unnassigned (None/Unspecified) option checked
    $scope.unassignedClicked = function (t) {
        // toggle current classification active flag
        t.active = !t.active;
        if (t.active) {
            // send the unassigned taxonomy request to the pmt map service
            pmtMapService.setUnassignedTaxonomyFilter(t.taxonomy_id);
        }
        else {
            // remove the unassigned taxonomy request from filters
            pmtMapService.removeUnassignedTaxonomyFilter(t.taxonomy_id);
        }
    };

    // taxonomy filter initialization
    function init() {
        // get the id of the div (which is the filter id value from the config)
        var filterId = $($element[0]).parent().attr("id");
        // get the filter by id from the config
        $scope.filter = _.find($scope.page.tools.map.filters, function (filter) { return filter.id == filterId; });
        // if the filter is valid
        if ($scope.filter) {
            // determine from config if classifications for filter should be in-use only
            var inuse = $scope.filter.params.inuse || false;
            // get data groups in-use
            var activeDataGroupIds = pmtMapService.getDataGroupIds();
            // if the selected data groups have changed update or if the filter hasn't been
            // initialized then update the organization list
            if (!_.isEqual(dataGroupIds, activeDataGroupIds) || !initialized || inuse) {
                // get the data groups currently in use (on the map)
                dataGroupIds = pmtMapService.getDataGroupIds();
                // using the pmt map service, get all the classifications for the filter
                pmtMapService.getTaxonomy($scope.filter.params.taxonomy_id, inuse)
                    .then(function (classifications) {
                        // apply filter to taxonomy classifications if filter exists
                        if ($scope.filter.params.filter) {
                            if ($scope.filter.params.filter.length > 0) {
                                classifications = _.filter(classifications, function (c) {
                                    return _.contains($scope.filter.params.filter, c.id);
                                });
                            }
                        }
                        // sort the classifications by name
                        classifications = _.sortBy(classifications, 'c');
                        // capital case the classification
                        classifications = _.each(classifications, function (c) {
                            c.c = c.c.toLowerCase();
                            c.c = c.c.capitalizeFirstLetter();
                        });
                        // if there are default settings in the config
                        // loop through the classifications and set them to active
                        if (_.has($scope.filter.params, 'defaults')) {
                            if ($scope.filter.params.defaults.length > 0) {
                                _.each(classifications, function (cls) {
                                    if (_.contains($scope.filter.params.defaults, cls.id)) {
                                        // set the classification as active
                                        $scope.classificationClicked(cls);
                                    }
                                });
                            }
                        }
                        // assign the prepared variables to scope
                        $scope.filter.options = classifications;
                        // set the filter size
                        $scope.filter.size = $scope.filter.options.length;
                        // set init flag true
                        initialized = true;
                    });
            }
        }
    }

    // validate active classification via filter
    function validateActive() {
        // get the classification ids for all active filters
        var filters = pmtMapService.getClassificationFilters();
        // loop through the classifications and mark the
        // active filters 
        _.each($scope.filter.options, function (c) {
            c.active = false;
            if (filters.indexOf(c.id) > -1) {
                c.active = true;
            }
        });
        // get the unnassigned taxonomy filters
        var unassigned = pmtMapService.getUnassignedTaxonomyFilters();
        // loop through the filter and mark the "None/Unspecified" option
        // if this taxonomy is in the filter
        $scope.unassigned.active = false;
        _.each(unassigned, function (u) {
            if (u == $scope.unassigned.taxonomy_id) {
                $scope.unassigned.active = true;
            }
        });
    }
});