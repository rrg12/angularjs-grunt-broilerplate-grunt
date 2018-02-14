/***************************************************************
 * ZoomTo Controller
 * Supports the interactive map tool.
 ***************************************************************/
angular.module('PMTViewer').controller('MapZoomToCtrl', function ($scope, mapService, stateService, pmtMapService) {
    $scope.showSearchInputBox = false;
    $scope.searchText = null;
    $scope.showResponse = false;

    //if no search text, opposite of what it started as
    $scope.toggleSearchInputBox = function() {
        if (!$scope.searchText) {
            $scope.showSearchInputBox = !$scope.showSearchInputBox;
        }
    };

    //geocoder
    $scope.getOpenCageSearchData = function () {

        if ($scope.searchText) {

            $scope.loading = true;
            $scope.searchResponse = null;

            $scope.searchDisplayText = $scope.searchText;

            pmtMapService.geocode($scope.searchText)
                .then(function (res) {
                    $scope.searchResponse = res;
                    $scope.loading = false;
                    $scope.showResponse = true;
                });
        }
    };

    // update map extent for bounds
    $scope.fitBounds = function (bounds) {
        var b = L.latLngBounds(bounds.southwest, bounds.northeast);
        mapService.map.fitBounds(b);
    };

    //close search results
    $scope.closeSearchResults = function () {
        $scope.showResponse = false;
        $scope.searchText = null;
        $scope.toggleSearchInputBox();
    };
});