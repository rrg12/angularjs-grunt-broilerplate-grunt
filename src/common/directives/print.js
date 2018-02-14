/***************************************************************
 * Pie Chart Directive
 * Manages creation of a d3 pie chart.
* *************************************************************/   
angular.module('PMTViewer').directive('print', function ($timeout) {
    
    var print = {
        restrict: 'A',
        replace: false,
        link: function (scope, element, attrs) {
            var targetElement = null;
            attrs.$observe('print', function () {
                // console.log(' print:', attrs.print);
                targetElement = attrs.print;  
            });                     
            element.bind('click', onClick);
            function onClick() {
                var targete = $(targetElement);
                html2canvas($('#' + targetElement), {
                    onrendered: function (canvas) {
                        var c = canvas;
                        Canvas2Image.saveAsPNG(canvas);
                        $("#print-download").empty();
                        $("#print-download").append(canvas);
                    }
                });
            }
        }
    };
    
    return print;
});