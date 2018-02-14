/***************************************************************
 * User Service
 * Service to support authentication for PMT users.
* *************************************************************/

angular.module('PMTViewer').service('userService', function ($q, $http, $rootScope, $state, $stateParams, config, pmt, stateService) {
    // the user service model
    var userService = {
    };

    // user log in function
    userService.logIn = function (username, password) {
        var deferred = $q.defer();
        var options = {
            username: username,
            password: password,
            pmtInstance: pmt.instance,
            pmtId: pmt.id[pmt.env]
        };
        // fake a response from an api authentication endpoint
        $rootScope.currentUser = {
            "databaseId": 2,
            "permission": "000001",
            "user": {
                "id": 1,
                "_first_name": "Public",
                "_last_name": "Access",
                "_username": "public",
                "_email": "info@spatialdev.com",
                "role_id": 1,
                "role": "Reader",
                "role_auth": { "_read": true, "_create": false, "_update": false, "_delete": false, "_super": false, "_security": false }, "authorizations": null
            }
        };
        deferred.resolve($rootScope.currentUser);
        return deferred.promise;
    };

    return userService;

});