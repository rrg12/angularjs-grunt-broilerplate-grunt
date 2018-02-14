/***************************************************************
 * Activity Page List Controller
 * Supports the activity page's activity list feature.
 * *************************************************************/
angular.module('PMTViewer').controller('ActsListCtrl', function ($scope, $rootScope, stateService, config, activityService, $mdDialog) {

    $scope.stateService = stateService;
    //loader
    $scope.loading = true;
    //defaults for pagination
    $scope.query = {
        order: 'response._title',
        limit: 50,
        page: 1
    };
    // list of additional columns to show for activity list
    $scope.columnList = $scope.page.tools.map.params.activityListColumns;
    // determine the column span for child activities
    $scope.childColSpan = $scope.page.tools.map.params.activityListColumns.length + 2;
    //initialize parent count at 0
    $scope.parentActivityCount = 0;

    // when the activity list is updated do this
    $scope.$on('act-list-updated', function () {
        $scope.loading = false;
    });

    // when the activity list is updating do this
    $scope.$on('act-list-updating', function () {
        $scope.loading = true;
    });

    // show activity
    $scope.showActivityDetail = function (activity) {
        stateService.setParamWithVal('activity_id', activity.id.toString());
    };

    // toggle whether seeing child activity details on the list
    $scope.toggleActive = function (act) {
        act.active = !act.active;
        act.arrow = (act.active) ? "keyboard_arrow_up" : "keyboard_arrow_down";
    };

    // export activity list
    $scope.exportActivityList = function () {

    };

    // modal popup for printing widgets
    $scope.exportPopup = function () {
        $mdDialog.show({
            locals: {},
            controller: DownloadController,
            templateUrl: 'acts/list/acts-print-modal.tpl.html',
            parent: angular.element(document.body),
            clickOutsideToClose: true,
            scope: $scope,
            preserveScope: true
        });
    };

    // navigate to edit page to edit activity
    $scope.editActivity = function (activity_id) {
        var params = { "editor_activity_id": activity_id };
        stateService.setState("editor", params, true);
    };

    // initialize list
    function init() {
        
    }

    // pop-up model on download click
    function DownloadController($scope) {

        // on click function for close buttons
        $scope.closeDialog = function () {
            $mdDialog.cancel();
        };
    }

    init();
});


// custom filter for adding elipses to long strings
angular.module('PMTViewer').filter('filterListOrgs', function () {
    return function (value) {
        if (!value) { return '--'; }
        //identify number of funders
        var funderCount = value.length;

        if (funderCount > 1) {
            return 'Multiple Funders';
        }
        else if (funderCount === 0) {
            return '--';
        }
        else {
            return value[0];
        }
    };
});