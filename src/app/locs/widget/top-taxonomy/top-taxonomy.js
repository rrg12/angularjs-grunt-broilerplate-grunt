/***************************************************************
 * Top Programs Widget Controller
 * Supports the top dollar summary widget.
 ***************************************************************/
angular.module('PMTViewer').controller('LocsWidgetTopTaxonomyCtrl', function($scope, $rootScope, $stateParams, analysisService, locsService, $mdDialog) {
    $scope.chartData = [];
    $scope.loading = false;
    $scope.colors = $scope.widget.colors;
    $scope.noData = false;

    // when the selection is updated, do this
    $scope.$on('selection-update', function() {
        if ($scope.widget.area == $stateParams.area) {
            processChartData();
        }
    });

    // when the filter is updated, update widget
    $scope.$on('locs-filter-update', function() {
        if ($scope.widget.area == $stateParams.area) {
            processChartData();
        }
    });

    // collect and process the chart data
    function processChartData() {
        var featureId;
        var boundaryId;
        // if a data group is selected process the chart data
        if (locsService.getDataGroupFilters().length > 0) {
            switch ($stateParams.area) {
                case 'national':
                    featureId = parseInt(locsService.selectedNationalFeature.id, 10);
                    boundaryId = locsService.nationalLayer.boundary_id;
                    processData(featureId, boundaryId);
                    break;
                case 'regional':
                    featureId = parseInt(locsService.selectedRegionalFeature.id, 10);
                    boundaryId = locsService.regionalLayer.boundary_id;
                    processData(featureId, boundaryId);
                    break;
                default:
                    $scope.chartData = [];
                    $scope.loading = false;
                    $scope.noData = true;
                    break;
            }
        }
        // otherwise inform the widget there is no data
        else {
            $scope.chartData = [];
            $scope.loading = false;
            $scope.noData = true;
        }
    }

    // initialization function
    function init() {
        processChartData();
    }

    // call analysis service for data and processs
    function processData(featureId, boundaryId) {
        $scope.noData = false;
        $scope.loading = true;
        analysisService.getStatsActivityByTaxonomy(
            $scope.widget.params.taxonomy_id,
            locsService.getDataGroupFilters().join(','),
            locsService.getClassificationFilters().join(','),
            locsService.getStartDateFilter(),
            locsService.getEndDateFilter(),
            boundaryId,
            featureId,
            $scope.widget.params.top
        ).then(function(data) {
            // clear the chart data
            $scope.chartData = [];
            // set no data flag if array is empty
            if(data.length === 1){                
                if(data[0].classification === 'Other' && data[0].count===0){
                    $scope.noData = true;
                }
            }        
            if (!$scope.noData) {
                // assign the chart data
                $scope.chartData = data;
                // show the other column
                if ($scope.widget.params.show_other) {
                    // update the aggregated "other" classifications label
                    if ($scope.widget.params.other_label) {
                        _.each($scope.chartData, function(f) {
                            if (f.classification_id === null) {
                                f.classification = $scope.widget.params.other_label;
                            }
                        });
                    }
                }
                // don't show other column
                else {
                    // remove the aggregated "other" classifications information
                    $scope.chartData = _.filter($scope.chartData, function(f) { return f.classification_id !== null; });
                }
            }
            $scope.loading = false;
        });
    }

    // initialize the widget
    init();
});
