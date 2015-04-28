/// Copyright 2014-2015 Red Hat, Inc. and/or its affiliates
/// and other contributors as indicated by the @author tags.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
if (typeof HawkularComponentsVersions !== 'undefined') { HawkularComponentsVersions.push({name:'inventory', version:'dbef477 Merge pull request #100 from jpkrohling/HAWKULAR-102-FadeAndMessage'})} else {HawkularComponentsVersions = [{name:'inventory', version:'dbef477 Merge pull request #100 from jpkrohling/HAWKULAR-102-FadeAndMessage'}]};


var Inventory;
(function (Inventory) {
    Inventory.pluginName = "inventory";
    Inventory.log = Logger.get(Inventory.pluginName);
    Inventory.templatePath = "plugins/inventory/html";
})(Inventory || (Inventory = {}));

var Inventory;
(function (Inventory) {
    Inventory._module = angular.module(Inventory.pluginName, ['ngResource', 'hawkular.services', 'hawkularCharts']);
    var tab = undefined;
    Inventory._module.config(['$locationProvider', '$routeProvider', 'HawtioNavBuilderProvider', 'HawkularInventoryProvider', function ($locationProvider, $routeProvider, builder, HawkularInventoryProvider) {
        tab = builder.create().id(Inventory.pluginName).title(function () { return "Inventory"; }).href(function () { return "/inventory"; }).subPath("Inventory List", "Inventory", builder.join(Inventory.templatePath, 'inventory.html')).build();
        builder.configureRouting($routeProvider, tab);
        $locationProvider.html5Mode(true);
    }]);
    Inventory._module.run(['HawtioNav', function (HawtioNav) {
        HawtioNav.add(tab);
    }]);
    hawtioPluginLoader.addModule(Inventory.pluginName);
})(Inventory || (Inventory = {}));

var Inventory;
(function (Inventory) {
    Inventory.InventoryController = Inventory._module.controller("Inventory.InventoryController", ['$scope', '$rootScope', 'HawkularInventory', 'HawkularMetric', function ($scope, $rootScope, hkInventory, hkMetric) {
        var envId = 'test';
        $scope.queryResources = function () {
            if (this.tenantId) {
                this.resources = hkInventory.ResourceOfType.query({ tenantId: this.tenantId, resourceTypeId: 'URL' }, function (data) {
                    angular.forEach(data, function (value) {
                        value.metrics = hkInventory.ResourceMetric.query({ tenantId: $scope.tenantId, environmentId: envId, resourceId: value.id });
                    });
                });
            }
        };
        $scope.queryMetrics = function () {
            if (this.tenantId && this.resourceId && envId) {
                this.metrics = hkInventory.ResourceMetric.query({ tenantId: this.tenantId, environmentId: envId, resourceId: this.resourceId });
            }
        };
        $scope.showMetric = function (tenantId, resourceId, metricId) {
            var _tenantId = tenantId || this.tenantId;
            var _resourceId = resourceId || this.resourceId;
            var _metricId = metricId || this.metricId;
            if (_tenantId && _resourceId && _metricId) {
                hkMetric.NumericMetricData.get({ tenantId: _tenantId, numericId: _metricId, buckets: 60 }, function (data) {
                    $rootScope.metricData = data;
                });
            }
        };
        $scope.closeChart = function () {
            delete $rootScope.metricData;
        };
    }]);
})(Inventory || (Inventory = {}));

angular.module("hawkular-ui-components-inventory-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("plugins/inventory/html/inventory.html","<div ng-controller=\"Inventory.InventoryController\">\n\n    <hr>\n\n    <!-- Dropdown View -->\n    <div class=\"row\">\n        <div class=\" col-md-4\">\n            <div class=\"panel panel-default\">\n                <div class=\"panel-heading\">\n                    <h3 class=\"panel-title\"><i class=\"fa fa-user\"></i> Tenant</h3>\n                </div>\n                <div class=\"panel-body\">\n                    <form role=\"form\" class=\"search-pf has-button\">\n                        <div class=\"form-group has-clear\">\n                            <div class=\"search-pf-input-group\">\n                                <label for=\"tenantId\" class=\"sr-only\">Tenant</label>\n                                <input id=\"tenantId\" type=\"search\" class=\"form-control\" placeholder=\"Tenant ID\" ng-model=\"tenantId\" autofocus>\n                                <button type=\"button\" class=\"clear\" aria-hidden=\"true\" ng-click=\"tenantId = \'\'\"><span class=\"pficon pficon-close\"></span></button>\n                            </div>\n                        </div>\n                        <div class=\"form-group\">\n                            <button class=\"btn btn-default\" type=\"button\" ng-click=\"queryResources()\"><span class=\"fa fa-search\"></span></button>\n                        </div>\n                    </form>\n                </div>\n            </div>\n        </div>\n        <div class=\" col-md-4\">\n            <div class=\"panel panel-default\">\n                <div class=\"panel-heading\">\n                    <h3 class=\"panel-title\"><i class=\"fa fa-cube\"></i> Resource <span class=\"pull-right\" ng-show=\"tenantId && resources\"><a href=\"#\" ng-click=\"showTable = !showTable\"><span ng-hide=\"showTable\">Show</span><span ng-show=\"showTable\">Hide</span> all</a></span></h3>\n                </div>\n                <div class=\"panel-body\">\n                    <select class=\"form-control\" ng-options=\"resource.id as resource.properties.url + \' (\' +resource.id + \')\' for resource in resources\" ng-model=\"resourceId\" ng-disabled=\"!tenantId || !resources\" ng-hide=\"resources.length === 0\" ng-change=\"queryMetrics()\"></select>\n                    <span ng-show=\"resources.length === 0\"><i class=\"fa fa-warning\"></i> No Resources Available</span>\n                </div>\n            </div>\n        </div>\n        <div class=\" col-md-4\">\n            <div class=\"panel panel-default\">\n                <div class=\"panel-heading\">\n                    <h3 class=\"panel-title\"><i class=\"fa fa-line-chart\"></i> Metric</h3>\n                </div>\n                <div class=\"panel-body\">\n                    <select class=\"form-control\" ng-options=\"metric.id as metric.id for metric in metrics\" ng-model=\"metricId\" ng-disabled=\"!tenantId || !resourceId\" ng-hide=\"metrics.length === 0\"></select>\n                    <span ng-show=\"metrics.length === 0\"><i class=\"fa fa-warning\"></i> No Metrics Available</span>\n                </div>\n            </div>\n        </div>\n    </div>\n    <div class=\"row\">\n        <div class=\"col-md-offset-10\">\n            <a href=\"\" class=\"btn btn-primary btn-lg\" ng-click=\"showMetric()\"><i class=\"fa fa-line-chart\" ng-disabled=\"!metricId\"></i> Show Metric</a>\n        </div>\n    </div>\n\n    <!-- Table View -->\n    <div class=\"row\" ng-show=\"tenantId && showTable\">\n        <div class=\"col-md-12\">\n            <h1>Resources</h1>\n            <table class=\"table table-condensed\">\n                <thead>\n                    <th>Resource ID</th>\n                    <th>Resource Type</th>\n                    <th>Properties</th>\n                    <th>Metrics</th>\n                </thead>\n                <tr ng-repeat=\"resource in resources\">\n                    <td>{{resource.id}}</td>\n                    <td>{{resource.resourceTypeId}}</td>\n                    <td>\n                        <dl class=\"dl-horizontal\" ng-repeat=\"(name, value) in resource.properties\">\n                          <dt>{{name}}</dt>\n                          <dd>{{value}}</dd>\n                        </dl>\n                    </td>\n                    <td >\n                        <table>\n                            <tr ng-repeat=\"metric in resource.metrics\">\n                                <td>{{metric.id}} <button class=\"btn btn-primary btn-xs\" ng-click=\"showMetric(tenantId, resource.id, metric.id)\"> <i class=\"fa fa-area-chart\"></i> </button></td>\n                            </tr>\n                        </table>\n                    </td>\n                </tr>\n            </table>\n        </div>\n    </div>\n\n    <!-- Chart View -->\n    <div class=\"row\" ng-show=\"metricData\">\n        <hr>\n        <div class=\"col-md-12\">\n            <div class=\"panel panel-default\">\n                <div class=\"panel-heading\">\n                    <h3 class=\"panel-title\">{{metricData.tenantId}} / {{metricData.name}} <span class=\"pull-right\" ng-click=\"closeChart()\"><i class=\"pficon pficon-close\"></i></span></h3>\n                </div>\n                <div class=\"panel-body\" style=\"height: 280px;\">\n                  <hawkular-chart data=\"{{metricData.data}}\" chart-type=\"bar\" chart-height=\"250\" chart-width=\"1000px\"></hawkular-chart>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>\n");}]); hawtioPluginLoader.addModule("hawkular-ui-components-inventory-templates");
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpY2VuY2UudHh0IiwiaW52ZW50b3J5dmVyc2lvbi5qcyIsIi9zb3VyY2UvaW5jbHVkZXMuanMiLCIvaW52ZW50b3J5L3RzL2ludmVudG9yeUdsb2JhbHMudHMiLCIvaW52ZW50b3J5L3RzL2ludmVudG9yeVBsdWdpbi50cyIsIi9pbnZlbnRvcnkvdHMvaW52ZW50b3J5LnRzIiwidGVtcGxhdGVzLmpzIl0sIm5hbWVzIjpbIkludmVudG9yeSJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FDQUE7QUFDQTtBQ2VBLElBQU8sU0FBUyxDQVFmO0FBUkQsV0FBTyxTQUFTLEVBQUMsQ0FBQztJQUVMQSxvQkFBVUEsR0FBR0EsV0FBV0EsQ0FBQ0E7SUFFekJBLGFBQUdBLEdBQWtCQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxvQkFBVUEsQ0FBQ0EsQ0FBQ0E7SUFFNUNBLHNCQUFZQSxHQUFHQSx3QkFBd0JBLENBQUNBO0FBRXJEQSxDQUFDQSxFQVJNLFNBQVMsS0FBVCxTQUFTLFFBUWY7O0FDUEQsSUFBTyxTQUFTLENBdUJmO0FBdkJELFdBQU8sU0FBUyxFQUFDLENBQUM7SUFFSEEsaUJBQU9BLEdBQUdBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLFNBQVNBLENBQUNBLFVBQVVBLEVBQUVBLENBQUNBLFlBQVlBLEVBQUNBLG1CQUFtQkEsRUFBQ0EsZ0JBQWdCQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUUvR0EsSUFBSUEsR0FBR0EsR0FBR0EsU0FBU0EsQ0FBQ0E7SUFFcEJBLGlCQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxtQkFBbUJBLEVBQUVBLGdCQUFnQkEsRUFBRUEsMEJBQTBCQSxFQUFFQSwyQkFBMkJBLEVBQUVBLFVBQUNBLGlCQUFpQkEsRUFBRUEsY0FBc0NBLEVBQUVBLE9BQW9DQSxFQUFFQSx5QkFBeUJBO1FBQ3ZPQSxHQUFHQSxH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RyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUMxQyxJQUFJLFdBQVcsR0FBRyxVQUFVLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUNoRCxJQUFJLFNBQVMsR0FBRyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUMxQyxFQUFFLENBQUEsQ0FBQyxTQUFTLElBQUksV0FBVyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsRUFBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBQyxFQUFFLFVBQVUsSUFBSTtvQkFDckcsVUFBVSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7Z0JBQy9CLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztRQUNILENBQUMsQ0FBQ0E7UUFFRkEsTUFBTUEsQ0FBQ0EsVUFBVUEsR0FBR0E7WUFDbEIsT0FBTyxVQUFVLENBQUMsVUFBVSxDQUFDO1FBQy9CLENBQUMsQ0FBQ0E7SUFFTkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7QUFFTkEsQ0FBQ0EsRUF2Q00sU0FBUyxLQUFULFNBQVMsUUF1Q2Y7O0FDdkREIiwiZmlsZSI6Imhhd2t1bGFyLXVpLWNvbXBvbmVudHMtaW52ZW50b3J5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIENvcHlyaWdodCAyMDE0LTIwMTUgUmVkIEhhdCwgSW5jLiBhbmQvb3IgaXRzIGFmZmlsaWF0ZXNcbi8vLyBhbmQgb3RoZXIgY29udHJpYnV0b3JzIGFzIGluZGljYXRlZCBieSB0aGUgQGF1dGhvciB0YWdzLlxuLy8vXG4vLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLy9cbi8vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8vXG4vLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuIiwiaWYgKHR5cGVvZiBIYXdrdWxhckNvbXBvbmVudHNWZXJzaW9ucyAhPT0gJ3VuZGVmaW5lZCcpIHsgSGF3a3VsYXJDb21wb25lbnRzVmVyc2lvbnMucHVzaCh7bmFtZTonaW52ZW50b3J5JywgdmVyc2lvbjonZGJlZjQ3NyBNZXJnZSBwdWxsIHJlcXVlc3QgIzEwMCBmcm9tIGpwa3JvaGxpbmcvSEFXS1VMQVItMTAyLUZhZGVBbmRNZXNzYWdlJ30pfSBlbHNlIHtIYXdrdWxhckNvbXBvbmVudHNWZXJzaW9ucyA9IFt7bmFtZTonaW52ZW50b3J5JywgdmVyc2lvbjonZGJlZjQ3NyBNZXJnZSBwdWxsIHJlcXVlc3QgIzEwMCBmcm9tIGpwa3JvaGxpbmcvSEFXS1VMQVItMTAyLUZhZGVBbmRNZXNzYWdlJ31dfTsiLG51bGwsIi8vLyBDb3B5cmlnaHQgMjAxNC0yMDE1IFJlZCBIYXQsIEluYy4gYW5kL29yIGl0cyBhZmZpbGlhdGVzXG4vLy8gYW5kIG90aGVyIGNvbnRyaWJ1dG9ycyBhcyBpbmRpY2F0ZWQgYnkgdGhlIEBhdXRob3IgdGFncy5cbi8vL1xuLy8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8vXG4vLy8gICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vL1xuLy8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vaW5jbHVkZXMudHNcIi8+XG5tb2R1bGUgSW52ZW50b3J5IHtcblxuICBleHBvcnQgdmFyIHBsdWdpbk5hbWUgPSBcImludmVudG9yeVwiO1xuXG4gIGV4cG9ydCB2YXIgbG9nOkxvZ2dpbmcuTG9nZ2VyID0gTG9nZ2VyLmdldChwbHVnaW5OYW1lKTtcblxuICBleHBvcnQgdmFyIHRlbXBsYXRlUGF0aCA9IFwicGx1Z2lucy9pbnZlbnRvcnkvaHRtbFwiO1xuICBcbn1cbiIsIi8vLyBDb3B5cmlnaHQgMjAxNC0yMDE1IFJlZCBIYXQsIEluYy4gYW5kL29yIGl0cyBhZmZpbGlhdGVzXG4vLy8gYW5kIG90aGVyIGNvbnRyaWJ1dG9ycyBhcyBpbmRpY2F0ZWQgYnkgdGhlIEBhdXRob3IgdGFncy5cbi8vL1xuLy8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8vXG4vLy8gICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vL1xuLy8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vaW5jbHVkZXMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiaW52ZW50b3J5R2xvYmFscy50c1wiLz5cbm1vZHVsZSBJbnZlbnRvcnkge1xuXG4gICAgZXhwb3J0IHZhciBfbW9kdWxlID0gYW5ndWxhci5tb2R1bGUoSW52ZW50b3J5LnBsdWdpbk5hbWUsIFsnbmdSZXNvdXJjZScsJ2hhd2t1bGFyLnNlcnZpY2VzJywnaGF3a3VsYXJDaGFydHMnXSk7XG5cbiAgICB2YXIgdGFiID0gdW5kZWZpbmVkO1xuXG4gICAgX21vZHVsZS5jb25maWcoWyckbG9jYXRpb25Qcm92aWRlcicsICckcm91dGVQcm92aWRlcicsICdIYXd0aW9OYXZCdWlsZGVyUHJvdmlkZXInLCAnSGF3a3VsYXJJbnZlbnRvcnlQcm92aWRlcicsICgkbG9jYXRpb25Qcm92aWRlciwgJHJvdXRlUHJvdmlkZXI6bmcucm91dGUuSVJvdXRlUHJvdmlkZXIsIGJ1aWxkZXI6SGF3dGlvTWFpbk5hdi5CdWlsZGVyRmFjdG9yeSwgSGF3a3VsYXJJbnZlbnRvcnlQcm92aWRlcikgPT4ge1xuICAgICAgICB0YWIgPSBidWlsZGVyLmNyZWF0ZSgpXG4gICAgICAgICAgICAuaWQoSW52ZW50b3J5LnBsdWdpbk5hbWUpXG4gICAgICAgICAgICAudGl0bGUoKCkgPT4gXCJJbnZlbnRvcnlcIilcbiAgICAgICAgICAgIC5ocmVmKCgpID0+IFwiL2ludmVudG9yeVwiKVxuICAgICAgICAgICAgLnN1YlBhdGgoXCJJbnZlbnRvcnkgTGlzdFwiLCBcIkludmVudG9yeVwiLCBidWlsZGVyLmpvaW4oSW52ZW50b3J5LnRlbXBsYXRlUGF0aCwgJ2ludmVudG9yeS5odG1sJykpXG4gICAgICAgICAgICAuYnVpbGQoKTtcbiAgICAgICAgYnVpbGRlci5jb25maWd1cmVSb3V0aW5nKCRyb3V0ZVByb3ZpZGVyLCB0YWIpO1xuICAgICAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgfV0pO1xuXG4gICAgX21vZHVsZS5ydW4oWydIYXd0aW9OYXYnLCAoSGF3dGlvTmF2Okhhd3Rpb01haW5OYXYuUmVnaXN0cnkpID0+IHtcbiAgICAgICAgSGF3dGlvTmF2LmFkZCh0YWIpO1xuICAgIH1dKTtcblxuXG4gICAgaGF3dGlvUGx1Z2luTG9hZGVyLmFkZE1vZHVsZShJbnZlbnRvcnkucGx1Z2luTmFtZSk7XG59XG4iLCIvLy8gQ29weXJpZ2h0IDIwMTQtMjAxNSBSZWQgSGF0LCBJbmMuIGFuZC9vciBpdHMgYWZmaWxpYXRlc1xuLy8vIGFuZCBvdGhlciBjb250cmlidXRvcnMgYXMgaW5kaWNhdGVkIGJ5IHRoZSBAYXV0aG9yIHRhZ3MuXG4vLy9cbi8vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vL1xuLy8vICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLy9cbi8vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImludmVudG9yeVBsdWdpbi50c1wiLz5cbm1vZHVsZSBJbnZlbnRvcnkge1xuXG4gIGV4cG9ydCB2YXIgSW52ZW50b3J5Q29udHJvbGxlciA9IF9tb2R1bGUuY29udHJvbGxlcihcIkludmVudG9yeS5JbnZlbnRvcnlDb250cm9sbGVyXCIsIFsnJHNjb3BlJywgJyRyb290U2NvcGUnLCAnSGF3a3VsYXJJbnZlbnRvcnknLCAnSGF3a3VsYXJNZXRyaWMnICwoJHNjb3BlLCAkcm9vdFNjb3BlLCBoa0ludmVudG9yeSwgaGtNZXRyaWMpID0+IHtcbiAgICAgIC8vIGhhcmQgY29kZWQgZm9yIG5vd1xuICAgICAgdmFyIGVudklkID0gJ3Rlc3QnO1xuXG4gICAgICAkc2NvcGUucXVlcnlSZXNvdXJjZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYodGhpcy50ZW5hbnRJZCkge1xuICAgICAgICAgICAgdGhpcy5yZXNvdXJjZXMgPSBoa0ludmVudG9yeS5SZXNvdXJjZU9mVHlwZS5xdWVyeSh7dGVuYW50SWQ6IHRoaXMudGVuYW50SWQsIHJlc291cmNlVHlwZUlkOiAnVVJMJ30sIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goZGF0YSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUubWV0cmljcyA9IGhrSW52ZW50b3J5LlJlc291cmNlTWV0cmljLnF1ZXJ5KHt0ZW5hbnRJZDogJHNjb3BlLnRlbmFudElkLCBlbnZpcm9ubWVudElkOiBlbnZJZCwgcmVzb3VyY2VJZDogdmFsdWUuaWR9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUucXVlcnlNZXRyaWNzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmKHRoaXMudGVuYW50SWQgJiYgdGhpcy5yZXNvdXJjZUlkICYmIGVudklkKSB7XG4gICAgICAgICAgICB0aGlzLm1ldHJpY3MgPSBoa0ludmVudG9yeS5SZXNvdXJjZU1ldHJpYy5xdWVyeSh7dGVuYW50SWQ6IHRoaXMudGVuYW50SWQsIGVudmlyb25tZW50SWQ6IGVudklkLCByZXNvdXJjZUlkOiB0aGlzLnJlc291cmNlSWR9KTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnNob3dNZXRyaWMgPSBmdW5jdGlvbih0ZW5hbnRJZCwgcmVzb3VyY2VJZCwgbWV0cmljSWQpIHtcbiAgICAgICAgdmFyIF90ZW5hbnRJZCA9IHRlbmFudElkIHx8IHRoaXMudGVuYW50SWQ7XG4gICAgICAgIHZhciBfcmVzb3VyY2VJZCA9IHJlc291cmNlSWQgfHwgdGhpcy5yZXNvdXJjZUlkO1xuICAgICAgICB2YXIgX21ldHJpY0lkID0gbWV0cmljSWQgfHwgdGhpcy5tZXRyaWNJZDtcbiAgICAgICAgaWYoX3RlbmFudElkICYmIF9yZXNvdXJjZUlkICYmIF9tZXRyaWNJZCkge1xuICAgICAgICAgIGhrTWV0cmljLk51bWVyaWNNZXRyaWNEYXRhLmdldCh7dGVuYW50SWQ6IF90ZW5hbnRJZCwgbnVtZXJpY0lkOiBfbWV0cmljSWQsIGJ1Y2tldHM6IDYwfSwgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICRyb290U2NvcGUubWV0cmljRGF0YSA9IGRhdGE7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5jbG9zZUNoYXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGRlbGV0ZSAkcm9vdFNjb3BlLm1ldHJpY0RhdGE7XG4gICAgICB9O1xuXG4gIH1dKTtcblxufVxuIiwiYW5ndWxhci5tb2R1bGUoXCJoYXdrdWxhci11aS1jb21wb25lbnRzLWludmVudG9yeS10ZW1wbGF0ZXNcIiwgW10pLnJ1bihbXCIkdGVtcGxhdGVDYWNoZVwiLCBmdW5jdGlvbigkdGVtcGxhdGVDYWNoZSkgeyR0ZW1wbGF0ZUNhY2hlLnB1dChcInBsdWdpbnMvaW52ZW50b3J5L2h0bWwvaW52ZW50b3J5Lmh0bWxcIixcIjxkaXYgbmctY29udHJvbGxlcj1cXFwiSW52ZW50b3J5LkludmVudG9yeUNvbnRyb2xsZXJcXFwiPlxcblxcbiAgICA8aHI+XFxuXFxuICAgIDwhLS0gRHJvcGRvd24gVmlldyAtLT5cXG4gICAgPGRpdiBjbGFzcz1cXFwicm93XFxcIj5cXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcIiBjb2wtbWQtNFxcXCI+XFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwicGFuZWwgcGFuZWwtZGVmYXVsdFxcXCI+XFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInBhbmVsLWhlYWRpbmdcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzPVxcXCJwYW5lbC10aXRsZVxcXCI+PGkgY2xhc3M9XFxcImZhIGZhLXVzZXJcXFwiPjwvaT4gVGVuYW50PC9oMz5cXG4gICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInBhbmVsLWJvZHlcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgPGZvcm0gcm9sZT1cXFwiZm9ybVxcXCIgY2xhc3M9XFxcInNlYXJjaC1wZiBoYXMtYnV0dG9uXFxcIj5cXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwIGhhcy1jbGVhclxcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInNlYXJjaC1wZi1pbnB1dC1ncm91cFxcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgZm9yPVxcXCJ0ZW5hbnRJZFxcXCIgY2xhc3M9XFxcInNyLW9ubHlcXFwiPlRlbmFudDwvbGFiZWw+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgaWQ9XFxcInRlbmFudElkXFxcIiB0eXBlPVxcXCJzZWFyY2hcXFwiIGNsYXNzPVxcXCJmb3JtLWNvbnRyb2xcXFwiIHBsYWNlaG9sZGVyPVxcXCJUZW5hbnQgSURcXFwiIG5nLW1vZGVsPVxcXCJ0ZW5hbnRJZFxcXCIgYXV0b2ZvY3VzPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVxcXCJidXR0b25cXFwiIGNsYXNzPVxcXCJjbGVhclxcXCIgYXJpYS1oaWRkZW49XFxcInRydWVcXFwiIG5nLWNsaWNrPVxcXCJ0ZW5hbnRJZCA9IFxcJ1xcJ1xcXCI+PHNwYW4gY2xhc3M9XFxcInBmaWNvbiBwZmljb24tY2xvc2VcXFwiPjwvc3Bhbj48L2J1dHRvbj5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwiZm9ybS1ncm91cFxcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XFxcImJ0biBidG4tZGVmYXVsdFxcXCIgdHlwZT1cXFwiYnV0dG9uXFxcIiBuZy1jbGljaz1cXFwicXVlcnlSZXNvdXJjZXMoKVxcXCI+PHNwYW4gY2xhc3M9XFxcImZhIGZhLXNlYXJjaFxcXCI+PC9zcGFuPjwvYnV0dG9uPlxcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgICAgICAgPC9mb3JtPlxcbiAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgIDwvZGl2PlxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiIGNvbC1tZC00XFxcIj5cXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJwYW5lbCBwYW5lbC1kZWZhdWx0XFxcIj5cXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwicGFuZWwtaGVhZGluZ1xcXCI+XFxuICAgICAgICAgICAgICAgICAgICA8aDMgY2xhc3M9XFxcInBhbmVsLXRpdGxlXFxcIj48aSBjbGFzcz1cXFwiZmEgZmEtY3ViZVxcXCI+PC9pPiBSZXNvdXJjZSA8c3BhbiBjbGFzcz1cXFwicHVsbC1yaWdodFxcXCIgbmctc2hvdz1cXFwidGVuYW50SWQgJiYgcmVzb3VyY2VzXFxcIj48YSBocmVmPVxcXCIjXFxcIiBuZy1jbGljaz1cXFwic2hvd1RhYmxlID0gIXNob3dUYWJsZVxcXCI+PHNwYW4gbmctaGlkZT1cXFwic2hvd1RhYmxlXFxcIj5TaG93PC9zcGFuPjxzcGFuIG5nLXNob3c9XFxcInNob3dUYWJsZVxcXCI+SGlkZTwvc3Bhbj4gYWxsPC9hPjwvc3Bhbj48L2gzPlxcbiAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwicGFuZWwtYm9keVxcXCI+XFxuICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IGNsYXNzPVxcXCJmb3JtLWNvbnRyb2xcXFwiIG5nLW9wdGlvbnM9XFxcInJlc291cmNlLmlkIGFzIHJlc291cmNlLnByb3BlcnRpZXMudXJsICsgXFwnIChcXCcgK3Jlc291cmNlLmlkICsgXFwnKVxcJyBmb3IgcmVzb3VyY2UgaW4gcmVzb3VyY2VzXFxcIiBuZy1tb2RlbD1cXFwicmVzb3VyY2VJZFxcXCIgbmctZGlzYWJsZWQ9XFxcIiF0ZW5hbnRJZCB8fCAhcmVzb3VyY2VzXFxcIiBuZy1oaWRlPVxcXCJyZXNvdXJjZXMubGVuZ3RoID09PSAwXFxcIiBuZy1jaGFuZ2U9XFxcInF1ZXJ5TWV0cmljcygpXFxcIj48L3NlbGVjdD5cXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIG5nLXNob3c9XFxcInJlc291cmNlcy5sZW5ndGggPT09IDBcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS13YXJuaW5nXFxcIj48L2k+IE5vIFJlc291cmNlcyBBdmFpbGFibGU8L3NwYW4+XFxuICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCIgY29sLW1kLTRcXFwiPlxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInBhbmVsIHBhbmVsLWRlZmF1bHRcXFwiPlxcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJwYW5lbC1oZWFkaW5nXFxcIj5cXG4gICAgICAgICAgICAgICAgICAgIDxoMyBjbGFzcz1cXFwicGFuZWwtdGl0bGVcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1saW5lLWNoYXJ0XFxcIj48L2k+IE1ldHJpYzwvaDM+XFxuICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJwYW5lbC1ib2R5XFxcIj5cXG4gICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgY2xhc3M9XFxcImZvcm0tY29udHJvbFxcXCIgbmctb3B0aW9ucz1cXFwibWV0cmljLmlkIGFzIG1ldHJpYy5pZCBmb3IgbWV0cmljIGluIG1ldHJpY3NcXFwiIG5nLW1vZGVsPVxcXCJtZXRyaWNJZFxcXCIgbmctZGlzYWJsZWQ9XFxcIiF0ZW5hbnRJZCB8fCAhcmVzb3VyY2VJZFxcXCIgbmctaGlkZT1cXFwibWV0cmljcy5sZW5ndGggPT09IDBcXFwiPjwvc2VsZWN0PlxcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gbmctc2hvdz1cXFwibWV0cmljcy5sZW5ndGggPT09IDBcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS13YXJuaW5nXFxcIj48L2k+IE5vIE1ldHJpY3MgQXZhaWxhYmxlPC9zcGFuPlxcbiAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgIDwvZGl2PlxcbiAgICA8L2Rpdj5cXG4gICAgPGRpdiBjbGFzcz1cXFwicm93XFxcIj5cXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImNvbC1tZC1vZmZzZXQtMTBcXFwiPlxcbiAgICAgICAgICAgIDxhIGhyZWY9XFxcIlxcXCIgY2xhc3M9XFxcImJ0biBidG4tcHJpbWFyeSBidG4tbGdcXFwiIG5nLWNsaWNrPVxcXCJzaG93TWV0cmljKClcXFwiPjxpIGNsYXNzPVxcXCJmYSBmYS1saW5lLWNoYXJ0XFxcIiBuZy1kaXNhYmxlZD1cXFwiIW1ldHJpY0lkXFxcIj48L2k+IFNob3cgTWV0cmljPC9hPlxcbiAgICAgICAgPC9kaXY+XFxuICAgIDwvZGl2PlxcblxcbiAgICA8IS0tIFRhYmxlIFZpZXcgLS0+XFxuICAgIDxkaXYgY2xhc3M9XFxcInJvd1xcXCIgbmctc2hvdz1cXFwidGVuYW50SWQgJiYgc2hvd1RhYmxlXFxcIj5cXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImNvbC1tZC0xMlxcXCI+XFxuICAgICAgICAgICAgPGgxPlJlc291cmNlczwvaDE+XFxuICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVxcXCJ0YWJsZSB0YWJsZS1jb25kZW5zZWRcXFwiPlxcbiAgICAgICAgICAgICAgICA8dGhlYWQ+XFxuICAgICAgICAgICAgICAgICAgICA8dGg+UmVzb3VyY2UgSUQ8L3RoPlxcbiAgICAgICAgICAgICAgICAgICAgPHRoPlJlc291cmNlIFR5cGU8L3RoPlxcbiAgICAgICAgICAgICAgICAgICAgPHRoPlByb3BlcnRpZXM8L3RoPlxcbiAgICAgICAgICAgICAgICAgICAgPHRoPk1ldHJpY3M8L3RoPlxcbiAgICAgICAgICAgICAgICA8L3RoZWFkPlxcbiAgICAgICAgICAgICAgICA8dHIgbmctcmVwZWF0PVxcXCJyZXNvdXJjZSBpbiByZXNvdXJjZXNcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgPHRkPnt7cmVzb3VyY2UuaWR9fTwvdGQ+XFxuICAgICAgICAgICAgICAgICAgICA8dGQ+e3tyZXNvdXJjZS5yZXNvdXJjZVR5cGVJZH19PC90ZD5cXG4gICAgICAgICAgICAgICAgICAgIDx0ZD5cXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGwgY2xhc3M9XFxcImRsLWhvcml6b250YWxcXFwiIG5nLXJlcGVhdD1cXFwiKG5hbWUsIHZhbHVlKSBpbiByZXNvdXJjZS5wcm9wZXJ0aWVzXFxcIj5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkdD57e25hbWV9fTwvZHQ+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGQ+e3t2YWx1ZX19PC9kZD5cXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2RsPlxcbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cXG4gICAgICAgICAgICAgICAgICAgIDx0ZCA+XFxuICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgbmctcmVwZWF0PVxcXCJtZXRyaWMgaW4gcmVzb3VyY2UubWV0cmljc1xcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+e3ttZXRyaWMuaWR9fSA8YnV0dG9uIGNsYXNzPVxcXCJidG4gYnRuLXByaW1hcnkgYnRuLXhzXFxcIiBuZy1jbGljaz1cXFwic2hvd01ldHJpYyh0ZW5hbnRJZCwgcmVzb3VyY2UuaWQsIG1ldHJpYy5pZClcXFwiPiA8aSBjbGFzcz1cXFwiZmEgZmEtYXJlYS1jaGFydFxcXCI+PC9pPiA8L2J1dHRvbj48L3RkPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XFxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxcbiAgICAgICAgICAgICAgICA8L3RyPlxcbiAgICAgICAgICAgIDwvdGFibGU+XFxuICAgICAgICA8L2Rpdj5cXG4gICAgPC9kaXY+XFxuXFxuICAgIDwhLS0gQ2hhcnQgVmlldyAtLT5cXG4gICAgPGRpdiBjbGFzcz1cXFwicm93XFxcIiBuZy1zaG93PVxcXCJtZXRyaWNEYXRhXFxcIj5cXG4gICAgICAgIDxocj5cXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImNvbC1tZC0xMlxcXCI+XFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwicGFuZWwgcGFuZWwtZGVmYXVsdFxcXCI+XFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInBhbmVsLWhlYWRpbmdcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzPVxcXCJwYW5lbC10aXRsZVxcXCI+e3ttZXRyaWNEYXRhLnRlbmFudElkfX0gLyB7e21ldHJpY0RhdGEubmFtZX19IDxzcGFuIGNsYXNzPVxcXCJwdWxsLXJpZ2h0XFxcIiBuZy1jbGljaz1cXFwiY2xvc2VDaGFydCgpXFxcIj48aSBjbGFzcz1cXFwicGZpY29uIHBmaWNvbi1jbG9zZVxcXCI+PC9pPjwvc3Bhbj48L2gzPlxcbiAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwicGFuZWwtYm9keVxcXCIgc3R5bGU9XFxcImhlaWdodDogMjgwcHg7XFxcIj5cXG4gICAgICAgICAgICAgICAgICA8aGF3a3VsYXItY2hhcnQgZGF0YT1cXFwie3ttZXRyaWNEYXRhLmRhdGF9fVxcXCIgY2hhcnQtdHlwZT1cXFwiYmFyXFxcIiBjaGFydC1oZWlnaHQ9XFxcIjI1MFxcXCIgY2hhcnQtd2lkdGg9XFxcIjEwMDBweFxcXCI+PC9oYXdrdWxhci1jaGFydD5cXG4gICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICA8L2Rpdj5cXG4gICAgPC9kaXY+XFxuPC9kaXY+XFxuXCIpO31dKTsgaGF3dGlvUGx1Z2luTG9hZGVyLmFkZE1vZHVsZShcImhhd2t1bGFyLXVpLWNvbXBvbmVudHMtaW52ZW50b3J5LXRlbXBsYXRlc1wiKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=