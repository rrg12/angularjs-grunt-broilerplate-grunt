/***************************************************************
 * Taxonomy Controller
 * A filter controller. Supports the filtering activities by
 * a taxonomy. Usage is defined in the app.config in the activity
 * page filter object.
* *************************************************************/
angular.module('PMTViewer').controller('ActsFilterTaxonomyCtrl', function ($rootScope, $scope, activityService) {
    var dataGroupIds = null;
    // set the "none/unspecified" option to false initially
    $scope.unassigned = {
        "active": false,
        "name": "None/Unspecified",
        "taxonomy_id": $scope.filter.params.taxonomy_id
    };

    // when the activity list is updating, do this
    $scope.$on('act-list-updating', function () {
        $scope.filter.disabled = true;
    });

    // when the activity list has updated, do this
    $scope.$on('act-list-updated', function () {
        $scope.filter.disabled = false;
    });

    // when the filters have been updated, do this
    $scope.$on('activity-filter-update', function () {
        validateClassifications();
    });

    // filter option checked
    $scope.optionClicked = function (cls) {
        // reset the selected classifications array
        $scope.selectedClassifications = [];
        // get all the selected classifications
        _.each($scope.filter.options, function (c) {
            if (c.active === true) {
                $scope.selectedClassifications.push(c.id);
            }
        });
        // send the classifications to the pmt map service
        activityService.setClassificationFilter($scope.filter.params.taxonomy_id,
            $scope.selectedClassifications);
    };

    // unnassigned (None/Unspecified) option checked
    $scope.unassignedClicked = function (t) {
        if (t.active) {
            // send the unassigned taxonomy request to the pmt map service
            activityService.setUnassignedTaxonomyFilter(t.taxonomy_id);
        }
        else {
            // remove the unassigned taxonomy request from filters
            activityService.removeUnassignedTaxonomyFilter(t.taxonomy_id);
        }
    };

    // validate the classification list
    function validateClassifications() {
        // get current data group ids, order by id
        var activeDataGroupIds = _.sortBy(activityService.getDataGroupFilters(), function (id) { return Math.sin(id); });
        // if the data groups have changed up date the organization list
        if (!_.isEqual(dataGroupIds, activeDataGroupIds.toString())) {
            // update the data groups
            dataGroupIds = activeDataGroupIds.toString();
            if (activeDataGroupIds.length === 0) {
                processClassifications(null);
            }
            else {
                var inuse = $scope.filter.params.inuse || false;
                // using the activity map service, get all the classifications for the filter
                activityService.getTaxonomy($scope.filter.params.taxonomy_id, inuse).then(function (classifications) {
                    processClassifications(classifications);
                    validateActive();
                });
            }
        }
        else {
            validateActive();
        }
    }

    // validate active classification via filter
    function validateActive() {
        // get the classification ids for all active filters
        var filters = activityService.getClassificationFilters();
        // loop through the classifications and mark the
        // active filters
        _.each($scope.filter.options, function (c) {
            c.active = false;
            if (filters.indexOf(c.id) > -1) {
                c.active = true;
            }
        });
        // get the unnassigned taxonomy filters
        var unassigned = activityService.getUnassignedTaxonomyFilters();
        // loop through the filter and mark the "None/Unspecified" option
        // if this taxonomy is in the filter
        $scope.unassigned.active = false;
        _.each(unassigned, function (u) {
            if (u == $scope.unassigned.taxonomy_id) {
                $scope.unassigned.active = true;
            }
        });
    }

    // taxonomy filter initialization
    function init() {
        // initialize the filter if it has not been initialized
        if ($scope.filter && !_.has($scope.filter, 'options')) {
            // get current data group ids, order by id
            var activeDataGroupIds = _.sortBy(activityService.getDataGroupFilters(), function (id) { return Math.sin(id); });
            // update the data groups
            dataGroupIds = activeDataGroupIds.toString();
            $scope.filter.disabled = true;
            var inuse = $scope.filter.params.inuse || false;
            // using the activity map service, get all the classifications for the filter
            activityService.getTaxonomy($scope.filter.params.taxonomy_id, inuse).then(function (classifications) {
                processClassifications(classifications);
                // set default options
                if ($scope.filter.params.defaults.length > 0) {
                    activityService.setClassificationFilter($scope.filter.params.taxonomy_id, $scope.filter.params.defaults);
                    validateActive();
                    // broadcast that the filter selection has changed
                    $rootScope.$broadcast('acts-filter-options-update');
                }
            });
        }
    }

    // process classifications for filter Usage
    function processClassifications(classifications) {
        var inuse = $scope.filter.params.inuse || false;
        // apply filter to taxonomy classifications if filter exists
        if ($scope.filter.params.filter && !$scope.filter.params.inuse) {
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
        // assign the prepared variables to scope
        $scope.filter.options = classifications;
        // set the filter size
        $scope.filter.size = $scope.filter.options.length;
        $scope.filter.disabled = false;
    }

    // initialize the filter
    init();

});