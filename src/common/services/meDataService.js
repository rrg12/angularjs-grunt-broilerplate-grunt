/***************************************************************
 * Map Data Service
 * Grabs data from spatial server.
 * *************************************************************/

angular.module('PMTViewer').service('meDataService', function ($state, config, me, $q, $http) {
    
    var stateConfig = _.find(config.states, function (states) { return states.route == $state.current.name; });
    
    var meDataService = {};
    
    // get very high level summary data for specific admin level
    meDataService.getOverviewData = function () {
        var deferred = $q.defer();
        
        var url = me.api[me.env] + "/me_summary_stats/query?where=1%3D1&format=geojson&returnGeometry=yes&returnGeometryEnvelopes=no";
        
        $http.get(url, { cache: true })
            .then(function (response) {
            if (response.data && response.data.error) {
                deferred.reject(response.data.error);
            }
            deferred.resolve(response.data);
        }, function (err) {
            deferred.reject(err);
        });
        
        return deferred.promise;
    };
    
    // get very high level summary data for specific adm level and code
    meDataService.getSummaryData = function (table, column, adm_code) {
        var deferred = $q.defer();
        
        var url = me.api[me.env] + "/me_summary_data_by_" + table + "/query?where=" + column + "%3D" + adm_code + "&format=geojson&returnGeometry=yes&returnGeometryEnvelopes=no";
        
        $http.get(url, { cache: true })
            .then(function (response) {
            if (typeof response.data == 'string' || response.data.error) {
                deferred.reject(response.data.error);
            }
            deferred.resolve(response.data);
        }, function (err) {
            deferred.reject(err);
        });
        
        return deferred.promise;
    };
    
    //get unique projects by adm code
    meDataService.getProjectList = function (table, column, adm_code) {
        var deferred = $q.defer();
        
        var url = me.api[me.env] + "/me_report_indicator_" + table + "/query?where=" + column + "%20%3D%20(select%20" + column + "%20from%20" + table + "%20where%20" + column + "%20%3D%20" + adm_code + ")&returnfields=report_id%2C%20report_title&format=geojson&returnGeometry=no&returnGeometryEnvelopes=no&groupby=report_id%2C%20report_title&statsdef=count%3Areport_id";
        
        $http.get(url, { cache: true })
            .then(function (response) {
            if (response.data && response.data.error) {
                deferred.reject(response.data.error);
            }
            deferred.resolve(response.data);
        }, function (err) {
            deferred.reject(err);
        });
        
        return deferred.promise;
    };
    
    //get unique indicators by adm code
    meDataService.getIndicatorList = function (table, column, adm_code) {
        var deferred = $q.defer();
        
        var url = me.api[me.env] + "/me_report_indicator_" + table + "/query?where=" + column + "%20%3D%20(select%20" + column + "%20from%20" + table + "%20where%20" + column + "%20%3D%20" + adm_code + ")&returnfields=indicator_id%2C%20indicator_title&format=geojson&returnGeometry=no&returnGeometryEnvelopes=no&groupby=indicator_id%2C%20indicator_title&statsdef=count%3Aindicator_id&limit=10";
        
        $http.get(url, { cache: true })
            .then(function (response) {
            if (response.data && response.data.error) {
                deferred.reject(response.data.error);
            }
            deferred.resolve(response.data);
        }, function (err) {
            deferred.reject(err);
        });
        
        return deferred.promise;
    };
    
    // get indicators for a particular project by adm code
    meDataService.getIndicatorsPerProject = function (adm_level, adm_code, column, report_id) {
        var deferred = $q.defer();
        
        var url = me.api[me.env] + "/me_summary_data_by_location/query?where=" + column + "%3D" + adm_code + "%20and%20report_id%20%3D%20" + report_id + "&format=geojson&returnGeometry=yes&returnGeometryEnvelopes=no";
        
        $http.get(url, { cache: true })
            .then(function (response) {
            if (response.data && response.data.error) {
                deferred.reject(response.data.error);
            }
            deferred.resolve(response.data);
        }, function (err) {
            deferred.reject(err);
        });
        
        return deferred.promise;
    };
    
    // get projects for a particular indicator by adm code
    meDataService.getProjectsPerIndicator = function (adm_level, adm_code, column, indicator_id) {
        var deferred = $q.defer();
        
        var url = me.api[me.env] + "/me_summary_data_by_location/query?where=" + column + "%3D" + adm_code + "%20and%20indicator_id%20%3D%20" + indicator_id + "&format=geojson&returnGeometry=yes&returnGeometryEnvelopes=no";
        
        $http.get(url, { cache: true })
            .then(function (response) {
            if (response.data && response.data.error) {
                deferred.reject(response.data.error);
            }
            deferred.resolve(response.data);
        }, function (err) {
            deferred.reject(err);
        });
        
        return deferred.promise;
    };
       
    //get distinct sub adm codes for a specified adm_code and either project or indicator
    // this is used on the show on map modal
    // example, return all districts for adm0_code=79 and indicator_id = 9
    meDataService.getShowOnMapData = function (adm_code, adm_level, next_adm_level, filter_type, filter_id) {
        var deferred = $q.defer();
        
        filter = filter_type == 'indicator' ? 'indicator' : 'report';
        
        var url = me.api[me.env] + "/me_summary_data_by_location/query?where=" + filter + "_id%20%3D" + filter_id + "%20and%20" + adm_level + "%3D" + adm_code + "%20and%20" + next_adm_level + "%20is%20not%20null&returnfields=distinct(" + next_adm_level + ")&format=geojson&returnGeometry=no&returnGeometryEnvelopes=no&groupby=" + next_adm_level + "&statsdef=distinct%3A" + next_adm_level;
        
        $http.get(url, { cache: true })
            .then(function (response) {
            if (response.data && response.data.error) {
                deferred.reject(response.data.error);
            }
            deferred.resolve(response.data);
        }, function (err) {
            deferred.reject(err);
        });
        
        return deferred.promise;
    };
     
    //get distinct sub adm codes for a specified adm_code and both project and indicator
    // this is used on the 'show on map' modal for specified project and indicator
    // example, return all districts for adm0_code=79, project=5, and indicator_id = 9
    meDataService.getShowOnMapDetailsData = function (adm_code, adm_level, next_adm_level, report_id, indicator_id) {
        var deferred = $q.defer();
        
        var url = me.api[me.env] + "/me_summary_data_by_location/query?where=report_id%20%3D" + report_id + "%20and%20indicator_id%3D" + indicator_id + "%20and%20" + adm_level + "%3D" + adm_code + "%20and%20" + next_adm_level + "%20is%20not%20null&returnfields=distinct(" + next_adm_level + ")&format=geojson&returnGeometry=no&returnGeometryEnvelopes=no&groupby=" + next_adm_level + "&statsdef=distinct%3A" + next_adm_level;
        
        $http.get(url, { cache: true })
            .then(function (response) {
            if (response.data && response.data.error) {
                deferred.reject(response.data.error);
            }
            deferred.resolve(response.data);
        }, function (err) {
            deferred.reject(err);
        });
        
        return deferred.promise;
    };
        
    //creates project charts from project data, and a specified indicator and measure id
    meDataService.drawProjectChart = function (projectData, project_id, indicator_id, measure_id) {
        
        var chartData = projectData.projects[project_id].measures[measure_id];
        
        meDataService.drawChart(chartData, project_id, indicator_id);

    };
    
    //creates an indicator chart from indicator data, and a specified project and measure id
    meDataService.drawIndicatorChart = function (indicatorData, project_id, indicator_id, measure_id) {
        
        var chartData = indicatorData.indicators[indicator_id].measures[measure_id];
        
        meDataService.drawChart(chartData, project_id, indicator_id);
    };
    
    //creates project charts from project data, and a specified indicator and measure id
    meDataService.updateProjectChart = function (chartData, project_id, indicator_id) {
        
        
        // setting the constraints of the whole chart
        var margin = { top: 10, right: 45, bottom: 30, left: 40 },
            width = 424 - margin.left - margin.right,
            height = 280 - margin.top - margin.bottom;
        
        //setting up scales
        var y = d3.scale.linear()
            .range([height, 0]);
        
        var y_percent = d3.scale.linear()
            .range([height, 0]);
        
        
        // setting up data y range
        var data_values = [];
        for (var y_key in chartData.editions) {
            data_values.push(Number(chartData.editions[y_key].data.target));
            data_values.push(Number(chartData.editions[y_key].data.actual));
        }
        y.domain([0, d3.max(data_values)]);
        
        var formatLargeNumber = d3.format("s");
        
        var yAxisLeft = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickSize(4)
            .ticks(4)
            .tickFormat(formatLargeNumber);
        
        var chartLocation = '.project-' + project_id + '.indicator-' + indicator_id + ' .project-datum-chart';
        
        var chart = d3.selectAll(chartLocation);
        
        chart.select(".yAxisLeft")
            .transition().duration(150)
            .call(yAxisLeft);
        
        
        //turning edition data from a dictionary to an array to be mapped by d3
        var edition_data = [];
        for (var k in chartData.editions) {
            edition_data.push(chartData.editions[k]);
        }
        
        //string name of location for chart target bars
        var targetBarLocation = '.project-' + project_id + '.indicator-' + indicator_id + ' .target_bar';
        
        
        //adding data for target bar
        d3.selectAll(targetBarLocation)
            .data(edition_data)
            .attr("y", function (d) {
            return y(d.data.target);
        })

            .attr("height", function (d) {
            return height - y(d.data.target);
        })
            .exit()
            .remove();
        
        //string name of location for chart actual bars
        var actualBarLocation = '.project-' + project_id + '.indicator-' + indicator_id + ' .actual_bar';
        
        // adding data for actual bar
        d3.selectAll(actualBarLocation)
            .data(edition_data)
            .attr("y", function (d) {
            return y(d.data.actual);
        })
            .attr("height", function (d) {
            return height - y(d.data.actual);
        })
            .attr("width", 10)
            .exit()
            .remove();
        
        
        //string name of location for chart percent dots
        var dotLocation = '.project-' + project_id + '.indicator-' + indicator_id + ' .dot';
        
        // draw scatterdots
        d3.selectAll(dotLocation)
            .data(edition_data)
            .attr("cy", function (d) {
            if (d.data.actual == null || d.data.target == null) {
                return null;
            }
            else {
                var percent = d.data.actual / d.data.target;
                //will show percent at 200% if more than 200%
                var percentToGraph = Math.min(2, percent);
                return y_percent(percentToGraph);
            }
        })
            .exit()
            .remove();
    };
    
    // service to draw all of the indicator charts for a specific project
    meDataService.createAllIndicatorCharts = function (projectData, projectId) {
        
        //loop though all of the indicators
        for (var indicator in Object.keys(projectData.indicators)) {
            
            var indicatorId = Object.keys(projectData.indicators)[indicator];
            
            //check how many measures there are for a specific indicator
            var numMeasures = Object.keys(projectData.indicators[indicatorId].measures).length;
            
            //if there is only one measure, draw it
            if (numMeasures == 1) {
                for (var measure in Object.keys(projectData.indicators[indicatorId].measures)) {
                    
                    var measureId = Object.keys(projectData.indicators[indicatorId].measures)[measure];
                    
                    meDataService.drawIndicatorChart(projectData, projectId, indicatorId, measureId);
                }
            }
            else {
                //otherwise, track that there are multiple measures and draw the first one
                projectData.indicators[indicatorId].multipleMeasures = true;
                var measureId;
                for (var measure in Object.keys(projectData.indicators[indicatorId].measures)) {
                    
                    measureId = Object.keys(projectData.indicators[indicatorId].measures)[measure];
                }
                projectData.indicators[indicatorId].measureShown = measureId;
                meDataService.drawIndicatorChart(projectData, projectId, indicatorId, measureId);
            }
        }
    };
    
    // service to draw all of the project charts for a specific indicator
    meDataService.createAllProjectCharts = function (indicatorData, indicatorId) {
        
        var measureId = indicatorData.measureShown;
        
        //loop though all of the projects
        for (var project in Object.keys(indicatorData.projects)) {
            
            var projectId = Object.keys(indicatorData.projects)[project];
            
            //draw chart for a specific indicator, project and measure
            meDataService.drawProjectChart(indicatorData, projectId, indicatorId, measureId);
        }
    };
    
    //function to draw actual chart for a given indicator, project, and measure
    meDataService.drawChart = function (chartData, project_id, indicator_id) {
        
        // setting the constraints of the whole chart
        var margin = { top: 10, right: 45, bottom: 30, left: 40 },
            width = 424 - margin.left - margin.right,
            height = 280 - margin.top - margin.bottom;
        
        var formatPercent = d3.format(".0%");
        var formatLargeNumber = d3.format("s");
        
        //track whether chart has data
        var containsData = false;
        
        var x = d3.time.scale()
            .range([20, width]);
        
        var y = d3.scale.linear()
            .range([height, 0]);
        
        var y_percent = d3.scale.linear()
            .range([height, 0]);
        
        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickSize(0)
            .tickFormat(d3.time.format("%Y"));
        
        var yAxisRight = d3.svg.axis()
            .scale(y_percent)
            .orient("right")
            .ticks(2)
            .tickSize(-width)
            .tickFormat(formatPercent);
        
        var yAxisLeft = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickSize(4)
            .ticks(4)
            .tickFormat(formatLargeNumber);
        
        
        //setting up tooltip
        var tooltip = d3.select('#me-detail').append('div')
            .attr('class', 'tooltip');
        
        // setting up charts
        
        //string name of location for chart
        var chartLocation = '.project-' + project_id + '.indicator-' + indicator_id + ' .project-datum-chart';
        
        // clear chart div
        $(chartLocation).empty();
        
        var chart = d3.selectAll(chartLocation)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("class", "indicator_chart")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .append("g");
        
        
        //setting domain of chart
        var years = [];
        for (var key in chartData.editions) {
            years.push(new Date(chartData.editions[key].year.toString()));
            //to get upper bounds of years
            years.push(new Date(Number(chartData.editions[key].year.toString()) + 1, 0, 0));
        }
        
        //years should be in the correct order
        years = years.sort();
        
        x.domain(d3.extent(years));
        
        // setting up data y range
        var data_values = [];
        for (var y_key in chartData.editions) {
            data_values.push(Number(chartData.editions[y_key].data.target));
            data_values.push(Number(chartData.editions[y_key].data.actual));
            
            //if either target or actual contains data. set containsData to true
            if ((chartData.editions[y_key].data.target != null) || (chartData.editions[y_key].data.actual != null)) {
                containsData = true;
            }
        }
        y.domain([0, d3.max(data_values)]);
        
        // setting up percentage y range
        y_percent.domain([0, 2]);
        
        //addding x axis
        chart.append("g")
            .attr("class", "xAxis axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
        
        //adding y axis on the right (percent)
        chart.append("g")
            .attr("class", "yAxisRight axis")
            .attr("transform", "translate(" + width + ",0)")
            .call(yAxisRight)
            .append("text")
            .attr("class", "y label")
            .attr("text-anchor", "end")
            .attr("y", 6)
            .attr("x", -150)
            .attr("dy", ".75em")
            .attr("transform", "rotate(-90)")
            .text("% of target met");
        
        // adding y axis on the left (data)
        chart.append("g")
            .attr("class", "yAxisLeft axis")
            .attr("transform", "translate(" + 0 + ",0)")
            .call(yAxisLeft);
        
        // transform dictionary data into an array
        var edition_data = [];
        for (var k in chartData.editions) {
            edition_data.push(chartData.editions[k]);
        }
        
        
        if (containsData) {
            //string name of location for chart target bars
            var targetBarLocation = '.project-' + project_id + '.indicator-' + indicator_id + ' .target_bar';
            
            //adding data for target bar
            chart.selectAll(targetBarLocation)
                .data(edition_data)
                .enter().append("rect")
                .attr("class", "target_bar bar")
                .attr("y", function (d) {
                return y(d.data.target);
            })
                .attr("x", function (d) {
                return x(new Date(d.year.toString())) - 10;
            })
                .attr("height", function (d) {
                return height - y(d.data.target);
            })
                .attr("width", 10)
                .on('mouseover', function (d) {
                tooltip.transition()
                        .style('opacity', .9);
                
                tooltip.html("<div class='small-header'>Year: " + d.year + "</div><div class='data'>Value: " + numberWithCommas(d.data.target) + "</div")
                        .style('left', (d3.event.clientX - 25) + 'px')//position of the tooltip
                        .style('top', (d3.event.clientY - 60) + 'px')
                        .style('border', '1px solid #8298BF');
            })
                .on('mouseout', function () {
                tooltip.transition()
                        .style('opacity', 0);
            });
            
            
            //string name of location for chart actual bars
            var actualBarLocation = '.project-' + project_id + '.indicator-' + indicator_id + ' .actual_bar';
            
            // adding data for actual bar
            chart.selectAll(actualBarLocation)
                .data(edition_data)
                .enter().append("rect")
                .attr("class", "actual_bar bar")
                .attr("y", function (d) {
                return y(d.data.actual);
            })
                .attr("x", function (d) {
                return x(new Date(d.year.toString()));
            })
                .attr("height", function (d) {
                return height - y(d.data.actual);
            })
                .attr("width", 10)
                .on('mouseover', function (d) {
                tooltip.transition()
                        .style('opacity', .9);
                
                tooltip.html("<div class='small-header'>Year: " + d.year + "</div><div class='data'>Value: " + numberWithCommas(d.data.actual) + "</div")
                        .style('left', (d3.event.clientX - 25) + 'px')//position of the tooltip
                        .style('top', (d3.event.clientY - 60) + 'px')
                        .style('border', '1px solid #80AA5F');
            })
                .on('mouseout', function () {
                tooltip.transition()
                        .style('opacity', 0);
            });
            
            
            //string name of location for chart percent dots
            var dotLocation = '.project-' + project_id + '.indicator-' + indicator_id + ' .dot';
            
            // draw scatterdots
            chart.selectAll(dotLocation)
                .data(edition_data)
                .enter().append("circle")

                .attr("class", "dot")
                .style("stroke-width", 3)// set the stroke width
                .style("stroke", "#4f5050")
                .style("fill", "white")
                .attr("r", function (d) {
                return (d.data.actual && d.data.target > 0) ? 4 : 0;
            })
                .attr("cx", function (d) {
                return x(new Date(d.year.toString()));
            })
                .attr("cy", function (d) {
                if (d.data.actual == null || d.data.target == null) {
                    return null;
                }
                else {
                    var percent = d.data.actual / d.data.target;
                    //will show percent at 200% if more than 200%
                    var percentToGraph = Math.min(2, percent);
                    return y_percent(percentToGraph);
                }
            })
                .on('mouseover', function (d) {
                
                d3.select(this).attr("r", function (d) {
                    return (d.data.actual && d.data.target > 0) ? 6 : 0;
                });
                
                tooltip.transition()
                        .style('opacity', .9);
                
                tooltip.html("<div class='small-header'>Year: " + d.year + "</div><div class='data'>Value: " + calculateTrendPercent(d.data) + "</div")
                        .style('left', (d3.event.clientX - 35) + 'px')//position of the tooltip
                        .style('top', (d3.event.clientY - 60) + 'px')
                        .style('border', '1px solid #4f5050')
                        .style('display', function () {
                    return (d.data.actual && d.data.target > 0) ? 'block' : 'none';
                });
            })
                .on('mouseout', function () {
                
                d3.select(this).attr("r", function (d) {
                    return (d.data.actual && d.data.target > 0) ? 4 : 0;
                });
                
                tooltip.transition()
                        .style('opacity', 0);
            });



        }
        //if chart does not contain data, show text "No Data Available"
        else {
            chart
                .append("text")
                .attr("x", (width - 80) / 2)
                .attr("y", height / 2)

                .text("No Data Available");
        }
    };
    
    // Service that takes project json and turns it into nested dictionaries
    meDataService.dataByProject = function (input_data) {
        var locationData = {};
        locationData.organization = input_data.features[0].properties.title;
        locationData.indicators = {};
        
        input_data.features.forEach(function (row) {
            
            var indicatorExists = containsIndicator(locationData.indicators, row.properties.indicator_id);
            
            //if indicator does not exist, add it and all the data below
            if (!indicatorExists) {
                setIndicatorProperties(locationData, row.properties);
                
                //add measure dictionary
                locationData.indicators[row.properties.indicator_id].measures = {};
                setMeasurePropertiesForIndicator(locationData, row.properties);
                
                //add edition dictionary
                locationData.indicators[row.properties.indicator_id].measures[row.properties.measure_id].editions = {};
                setEditionPropertiesForIndicator(locationData, row.properties);
            }
            else {
                var measureExists = containsMeasure(locationData.indicators[row.properties.indicator_id].measures, row.properties.measure_id);
                
                // if measure does not exist, add it and all data below
                if (!measureExists) {
                    setMeasurePropertiesForIndicator(locationData, row.properties);
                    
                    //add edition dictionary
                    locationData.indicators[row.properties.indicator_id].measures[row.properties.measure_id].editions = {};
                    setEditionPropertiesForIndicator(locationData, row.properties);

                }
                else {
                    var editionExists = containsEdition(locationData.indicators[row.properties.indicator_id].measures[row.properties.measure_id].editions, row.properties.edition_id);
                    
                    // if edition does not exist, add it and all data below
                    if (!editionExists) {
                        setEditionPropertiesForIndicator(locationData, row.properties);
                    }
                    else {
                        var dictionary = locationData.indicators[row.properties.indicator_id].measures[row.properties.measure_id].editions[row.properties.edition_id].data;
                        updateEditionPropertiesForIndicator(dictionary, row.properties.value_title, row.properties.data);
                    }
                }
            }
        });
        return locationData;
    };
    
    // Service that takes project json and turns it into nested dictionaries
    meDataService.dataByIndicator = function (input_data) {
        
        var locationData = {};
        locationData.projects = {};
        //boolean to denote whether an indicator has multiple measures
        locationData.multipleMeasures = false;
        //grab the first measureId and that is what will be shown first
        locationData.measureShown = input_data.features[0].properties.measure_id;
        //array of measure titles (can't use ids because there is repetition in names i.e. two indicators with measure 'null' will have different measureIds)
        locationData.measures = {};
        
        input_data.features.forEach(function (row) {
            
            var projectExists = containsProject(locationData.projects, row.properties.report_id);
            
            //if project does not exist, add it and all the data below
            if (!projectExists) {
                setProjectProperties(locationData, row.properties);
                
                //add measure dictionary
                locationData.projects[row.properties.report_id].measures = {};
                setMeasurePropertiesForProject(locationData, row.properties);
                
                //add measure to dictionary of indicator measures
                if (!locationData.measures[row.properties.measure_id]) {
                    locationData.measures[row.properties.measure_id] = row.properties.measure_title;
                }                ;
                
                //add edition dictionary
                locationData.projects[row.properties.report_id].measures[row.properties.measure_id].editions = {};
                setEditionPropertiesForProject(locationData, row.properties);
            }
            else {
                var measureExists = containsMeasure(locationData.projects[row.properties.report_id].measures, row.properties.measure_id);
                
                // if measure does not exist, add it and all data below
                if (!measureExists) {
                    setMeasurePropertiesForProject(locationData, row.properties);
                    
                    //add measure to dictionary of indicator measures
                    //todo this is duplicate
                    if (!locationData.measures[row.properties.measure_id]) {
                        locationData.measures[row.properties.measure_id] = row.properties.measure_title;
                    }                    ;
                    
                    //add edition dictionary
                    locationData.projects[row.properties.report_id].measures[row.properties.measure_id].editions = {};
                    setEditionPropertiesForProject(locationData, row.properties);

                }
                else {
                    var editionExists = containsEdition(locationData.projects[row.properties.report_id].measures[row.properties.measure_id].editions, row.properties.edition_id);
                    
                    // if edition does not exist, add it and all data below
                    if (!editionExists) {
                        setEditionPropertiesForProject(locationData, row.properties);
                    }
                    else {
                        var dictionary = locationData.projects[row.properties.report_id].measures[row.properties.measure_id].editions[row.properties.edition_id].data;
                        updateEditionPropertiesForProject(dictionary, row.properties.value_title, row.properties.data);
                    }
                }
            }
        });
        
        //check the first project to see if there are multiple measures
        if (Object.keys(locationData.projects[input_data.features[0].properties.report_id].measures).length > 1) {
            locationData.multipleMeasures = true;
        }
        
        return locationData;
    };
    
    //check if dictionary contains project
    function containsProject(dict, report_id) {
        if (dict[report_id]) { return true; }
    }
    
    //check if dictionary contains indicator
    function containsIndicator(dict, indicator_id) {
        if (dict[indicator_id]) { return true; }
    }
    
    //check if dictionary contains measure
    function containsMeasure(dict, measure_id) {
        if (dict[measure_id]) { return true; }
    }
    
    //check if dictionary contains edition
    function containsEdition(dict, edition_id) {
        if (dict[edition_id]) { return true; }
    }

    //set properties for a given indicator
    function setIndicatorProperties(dict, properties) {
        dict.indicators[properties.indicator_id] = {};
        dict.indicators[properties.indicator_id].indicator_title = properties.indicator_title;

    }
    
    //set properties for a given measure
    function setMeasurePropertiesForIndicator(dict, properties) {
        dict.indicators[properties.indicator_id].measures[properties.measure_id] = {};
        dict.indicators[properties.indicator_id].measures[properties.measure_id].measure_title = properties.measure_title;
        
        if (properties.measure_title != 'null') {
            dict.indicators[properties.indicator_id].measures[properties.measure_id].multipleMeasures = true;
            dict.indicators[properties.indicator_id].measures[properties.measure_id].measureShown = Number(properties.measure_id);
        }

    }
    
    //set properties for a given edition
    function setEditionPropertiesForIndicator(dict, properties) {
        dict.indicators[properties.indicator_id].measures[properties.measure_id].editions[properties.edition_id] = {};
        dict.indicators[properties.indicator_id].measures[properties.measure_id].editions[properties.edition_id].year = properties.year;
        dict.indicators[properties.indicator_id].measures[properties.measure_id].editions[properties.edition_id].data = {};
        
        dict.indicators[properties.indicator_id].measures[properties.measure_id].editions[properties.edition_id].data.target = null;
        dict.indicators[properties.indicator_id].measures[properties.measure_id].editions[properties.edition_id].data.actual = null;
        dict.indicators[properties.indicator_id].measures[properties.measure_id].editions[properties.edition_id].data.baseline = null;
        
        var dictionary = dict.indicators[properties.indicator_id].measures[properties.measure_id].editions[properties.edition_id].data;
        updateEditionPropertiesForIndicator(dictionary, properties.value_title, properties.data);
    }
    
    //set properties for a given edition
    // if not data available, defaulted to null
    function updateEditionPropertiesForIndicator(dictionary, data_type, data) {
        if (data_type == 'Target') {
            dictionary.target = data;
        }
        else if (data_type == 'Actual') {
            dictionary.actual = data;
        }
        else if (data_type == 'Baseline') {
            dictionary.baseline = data;
        }
    }
    
    //set properties for a given project
    function setProjectProperties(dict, properties) {
        dict.projects[properties.report_id] = {};
        dict.projects[properties.report_id].project_title = properties.report_title;
        dict.projects[properties.report_id].organization = properties.title;

    }
    
    //set properties for a given measure
    function setMeasurePropertiesForProject(dict, properties) {
        dict.projects[properties.report_id].measures[properties.measure_id] = {};
        dict.projects[properties.report_id].measures[properties.measure_id].measure_title = properties.measure_title;

    }
    
    //set properties for a given edition
    function setEditionPropertiesForProject(dict, properties) {
        dict.projects[properties.report_id].measures[properties.measure_id].editions[properties.edition_id] = {};
        dict.projects[properties.report_id].measures[properties.measure_id].editions[properties.edition_id].year = properties.year;
        dict.projects[properties.report_id].measures[properties.measure_id].editions[properties.edition_id].data = {};
        
        dict.projects[properties.report_id].measures[properties.measure_id].editions[properties.edition_id].data.target = null;
        dict.projects[properties.report_id].measures[properties.measure_id].editions[properties.edition_id].data.actual = null;
        dict.projects[properties.report_id].measures[properties.measure_id].editions[properties.edition_id].data.baseline = null;
        
        var dictionary = dict.projects[properties.report_id].measures[properties.measure_id].editions[properties.edition_id].data;
        updateEditionPropertiesForProject(dictionary, properties.value_title, properties.data);
    }
    
    //set properties for a given edition
    // if not data available, defaulted to null
    function updateEditionPropertiesForProject(dictionary, data_type, data) {
        if (data_type == 'Target') {
            dictionary.target = data;
        }
        else if (data_type == 'Actual') {
            dictionary.actual = data;
        }
        else if (data_type == 'Baseline') {
            dictionary.baseline = data;
        }
    }
       
    //caluclate percent to put in trenddot tooltip
    function calculateTrendPercent(data) {
        var target = data.target;
        var actual = data.actual;
        
        // in null values return NA
        if (target == null || actual == null || target <= 0 || actual <= 0) {
            return 'NA'
        }
        // otherwise return the percent
        else {
            return Math.round(actual / target * 100) + '%';
        }
    }
    
    //function to format large numbers to have commas for easier readig
    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
     
    return meDataService;
});