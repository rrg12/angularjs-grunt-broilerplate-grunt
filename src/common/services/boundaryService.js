/***************************************************************
 * Boundary Service
 * Service to support boundary data.
* *************************************************************/        

angular.module('PMTViewer').service('boundaryService', function ($q, $http, $rootScope, pmt) {

    var boundaryService = { };
        
    // get filtered boundary features
    boundaryService.filterBoundaryFeatures = function (boundary_table, query_field, query) {
        var deferred = $q.defer();
        var options = {
            boundary_table: boundary_table, // Required. the name of the boundary spatial table to filter.
            query_field: query_field, // the name of the field within the boundary table to apply filter to.
            query: query, // comma seperated list values to filter by.           
            pmtId: pmt.id[pmt.env]
        };
        var header = {
            headers: { Authorization : 'Bearer ' + $rootScope.currentUser.token }
        };
        
        $http.post(pmt.api[pmt.env] + 'pmt_boundary_filter', options, header, { cache: true })
            .success(function (data, status, headers, config) {
            // remove unneccessary response object from api
            var response = _.pluck(data, 'response');
            // console.log('pmt_boundary_filter:', response);
            deferred.resolve(response);
        })
            .error(function (data, status, headers, c) {
            // there was an error report it to the error handler
            console.log("error on api call to: pmt_boundary_filter");
            deferred.reject(status);
        });
        return deferred.promise;
    };       
    
    // get boundary features extent
    boundaryService.getBoundaryExtent = function (boundary_table, feature_names) {
        var deferred = $q.defer();
        var options = {
            boundary_table: boundary_table, // Required. the name of the boundary spatial table.
            feature_names: feature_names, // the name(s) of the features to include in the extent.
            pmtId: pmt.id[pmt.env]
        };
        var header = {
            headers: { Authorization : 'Bearer ' + $rootScope.currentUser.token }
        };
        
        $http.post(pmt.api[pmt.env] + 'pmt_boundary_extents', options, header, { cache: true })
            .success(function (data, status, headers, config) {
            // remove unneccessary response object from api
            var response = _.pluck(data, 'response');
            // console.log('pmt_boundary_extents:', response);
            deferred.resolve(response);
        })
            .error(function (data, status, headers, c) {
            // there was an error report it to the error handler
            console.log("error on api call to: pmt_boundary_extents");
            deferred.reject(status);
        });
        return deferred.promise;
    };

    // get boundary menu (hierarchy)
    boundaryService.getBoundaryMenu = function (boundary_type, admin_levels, filter_features, data_group_ids) {
        var deferred = $q.defer();
        var options = {
            boundary_type: boundary_type, // Required. the boundary type for the created hierarchy. Options: gaul, gadm, unocha, nbs.
            admin_levels: admin_levels, // a comma delimited list of admin levels to include. Options: 0,1,2,3 
            filter_features : filter_features, //a comma delimited list of names of features in the highest admin level to restrict data to.
            data_group_ids: data_group_ids, // a comma delimited list of data groups to filter features to, only features with a data group's locaiton will be included
            pmtId: pmt.id[pmt.env]
        };
        var header = {
            headers: { Authorization : 'Bearer ' + $rootScope.currentUser.token }
        };
        
        $http.post(pmt.api[pmt.env] + 'pmt_boundary_hierarchy', options, header, { cache: true })
            .success(function (data, status, headers, config) {
            // remove unneccessary response object from api
            var response = _.pluck(data, 'response');
            //console.log('pmt_boundary_hierarchy:', response[0]);
            deferred.resolve(response[0]);
        })
            .error(function (data, status, headers, c) {
            // there was an error report it to the error handler
            console.log("error on api call to: pmt_boundary_hierarchy");
            deferred.reject(status);
        });
        return deferred.promise;
    };

    return boundaryService;
   
});