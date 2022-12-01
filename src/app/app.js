/***************************************************************
 *  Application
 *  This is the applications entry point. The main module and 
 *  routing are configured here.
 ***************************************************************/
require('./config.js');
require('./global.js');

var PMTViewer = angular.module('PMTViewer', [
    'ui.router', // angular routing library
    'ui.bootstrap', // bootstrap library for angularjs
    'ngMaterial', // angular material design library
    'config', // include the config module generated by the grunt build from app.config.js
    'rzModule', //time slider module
    'angular-sortable-view', //sorting capability
    'md.data.table', //pagination
    'ui.materialize', // an extension of angular material design library
    'blockUI', // angularjs block ui
    'ngMessages', //validation messages
    'ngSanitize', // html sanitization for mdDialog
    'ngIdle' // session timeout
]);

PMTViewer.config(function ($stateProvider, $urlRouterProvider, pmt, KeepaliveProvider, IdleProvider) {
    $urlRouterProvider.otherwise('/login');
    IdleProvider.idle(5);
    IdleProvider.timeout(5);
    KeepaliveProvider.interval(10);
    $stateProvider
        .state('login', {
            url: '/login',
            views: {
                "main": {
                    controller: 'AppCtrl',
                    templateUrl: 'login/login.tpl.html'
                }
            },
            data: { pageTitle: 'Login', requireLogin: false }
        })
        .state('home', {
            url: '/home',
            views: {
                "main": {
                    controller: 'AppCtrl',
                    templateUrl: 'home/home.tpl.html'
                }
            },
            data: { pageTitle: 'Home', requireLogin: true }
        })
        .state('locations', {
            url: '/locations@:lat,:lng,:zoom,:area,:selection,:basemap(*layers)',
            views: {
                "main": {
                    controller: 'AppCtrl',
                    templateUrl: 'locs/locs.tpl.html'
                }
            },
            data: { pageTitle: 'Locations', requireLogin: true }
        })
        .state('activities', {
            url: '/activities@:lat,:lng,:zoom,:basemap(*layers),:activity_id',
            views: {
                "main": {
                    controller: 'AppCtrl',
                    templateUrl: 'acts/acts.tpl.html'
                }
            },
            data: { pageTitle: 'Activities', requireLogin: true }
        })
        .state('map', {
            url: '/map@:lat,:lng,:zoom,:basemap(*layers)?&left-panel&slide-out-panel&detail-panel&travel-panel&target-analysis-panel&basemap-menu&activity-search-results&activity-locations',
            views: {
                "main": {
                    controller: 'AppCtrl',
                    templateUrl: 'map/map.tpl.html'
                }
            },
            data: { pageTitle: 'Partnerlink', requireLogin: true }
        })
        .state('admin', {
            url: '/admin',
            views: {
                "main": {
                    controller: 'AppCtrl',
                    templateUrl: 'admin/admin.tpl.html'
                }
            },
            data: { pageTitle: 'Admin', requireLogin: true }
        });
});

PMTViewer.run(function ($rootScope, $state, $stateParams, userService, config, Idle) {
    // session idle setting in seconds
    $rootScope.loginIdle = 1200;
    // session timeout before forcing login in seconds
    $rootScope.loginTimeout = 15;
    // set ng-idle settings
    Idle.setIdle($rootScope.loginIdle);
    Idle.setTimeout($rootScope.loginTimeout);
    Idle.watch();
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
        // check to see if the requested state requires a login
        var requireLogin = toState.data.requireLogin;
        // lookup the config state for the requested state
        var state = _.find(config.states, function (state) { return state.route == toState.name; });
        // if the requested state requires a login, determine course of action
        if (requireLogin) {
            // there is no user currently logged in, force the state to login
            if (typeof $rootScope.currentUser === 'undefined' || $rootScope.currentUser === null) {
                event.preventDefault();
                return $state.go('login');
            }
            // there is a user determine if user's permission meets the state authorization requirements
            else if ($rootScope.currentUser.permission < state.authorization) {
                event.preventDefault();
                return $state.go('login');
            }
        }
    });
});

// include the config & global constants from the config module
PMTViewer.controller('AppCtrl', function AppCtrl($scope, $rootScope, $state, $stateParams, $location, config, global, pmt, stateService, blockUIConfig, Idle, Keepalive, $mdDialog) {
    // update the current page's state    
    stateService.updateState();

    $rootScope.config = config;  // add the config constat to the rootScope variable
    $rootScope.global = global; // add the global constant to the rootScope variable
    $scope.$state = $state;  // assign state to scope
    $rootScope.environment = pmt.env; // assign the current environment
    blockUIConfig.message = 'Loading...';
    blockUIConfig.delay = 200;

    // this code block will only execute once on the first time through
    if (window.initialization) {
        $rootScope.currentYear = new Date().getFullYear();
        // order pages according to config order for navigation buttons
        $rootScope.config.states = _.sortBy($rootScope.config.states, "order");
    }
    window.initialization = false; //marks the first run through

    $scope.$on('IdleStart', function () {
        $scope.timeoutWarning = $mdDialog.show({
            controller: 'LoginTimeout',
            templateUrl: 'login/timeout/timeout.tpl.html',
            parent: angular.element(document.body),
            targetEvent: event,
            preserveScope: true,
            bindToController: true,
            scope: $scope
        });
    });

    $scope.$on('IdleTimeout', function () {
        $mdDialog.cancel();
         $rootScope.logOut();
        Idle.watch();
        $state.go('login');
    });

    $scope.$on('IdleEnd', function () {
        $mdDialog.cancel();
    });
});

String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};


// page controllers
require('./login/login.js'); // login page
require('./home/home.js'); // home page
require('./locs/locs.js'); // locations page
require('./acts/acts.js'); // activities page
require('./map/map.js'); // interactive map page
require('./admin/admin.js'); // administrative console page
// directives
require('../common/directives/horizontalBarChart.js');
require('../common/directives/verticalBarChart.js');
require('../common/directives/pieChart.js');
require('../common/directives/print.js');
require('../common/directives/dynamicHTML.js');
// services
require('../common/services/activityService.js');
require('../common/services/analysisService.js');
require('../common/services/boundaryService.js');
require('../common/services/pmtMapService.js');
require('../common/services/stateService.js');
require('../common/services/mapService.js');
require('../common/services/basemapService.js');
require('../common/services/userService.js');
require('../common/services/otpService.js');
require('../common/services/hcService.js');
require('../common/services/locsService.js');
require('../common/services/utilService.js');
require('../common/services/partnerLinkService.js');