/***************************************************************
 * Timeline Controller
 * Supports the timeline feature. Users can use a timeline
 * slider to define the range for data to be displayed on
 * the map.
 * *************************************************************/
angular.module('PMTViewer').controller('MapTimelineCtrl', function ($scope, $rootScope, stateService, mapService, pmtMapService) {
    var defaultStart = $scope.page.tools.map.timeslider.defaultStart;
    var defaultEnd = $scope.page.tools.map.timeslider.defaultEnd;

    //start css for timeline
    var current_bg = null;
    var current_bg_pointer = null;

    $scope.timelineDisabled = false;
    
    //timeline defaults
    $scope.slider = {
        minValue: defaultStart,
        maxValue: defaultEnd,
        options: {
            floor: $scope.page.tools.map.timeslider.floor,
            ceil: $scope.page.tools.map.timeslider.ceiling,
            showTicks: true,
            showTicksValues: false
        }
    };
    
    // initialize the timeslider
    init();

    // when user finished sliding a handle update date filter
    $scope.$on("slideEnded", function () {
        
    });
    
    // toggle the timeline disable feature
    $scope.toggleDisableTimeline = function () {
        // toggle disable boolean
        $scope.timelineDisabled = !$scope.timelineDisabled;
        $scope.slider.options.disabled = $scope.timelineDisabled;
        if ($scope.timelineDisabled) {
            // clear date filters
            setDateFilters(true);
            //
            getCSS();
            //update color of timeline to be defailt grey
            $('.rz-bar.rz-selection').css('background-color', '#7B838E');
            $('.rz-pointer').css('background-color', '#7B838E');
        }
        else {
            // set the date filters
            setDateFilters(false);
            //update color of timeline
            $('.rz-bar.rz-selection').css('background-color', current_bg);
            $('.rz-pointer').css('background-color', current_bg_pointer);
        }
    };

    // initialize the timeslider
    function init() {
        // set timeline filters with default parameters
        var min_date = new Date('1-1-' + defaultStart);        
        var max_date = new Date('12-31-' + defaultEnd);
    }

    // set the date filters (when clear is true null filters)
    function setDateFilters(clear) {
        if (!clear) {
            var min_date = new Date('1-1-' + $scope.slider.minValue);
            var max_date = new Date('12-31-' + $scope.slider.maxValue);
        }        
    }

    //function to grab css for timeline
    function getCSS() {
        //get current css
        current_bg = $('.rz-bar.rz-selection').css('background-color');
        current_bg_pointer = $('.rz-pointer').css('background-color');
    }

});