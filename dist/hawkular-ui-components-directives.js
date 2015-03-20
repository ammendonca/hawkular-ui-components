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


var Sidebar;
(function (Sidebar) {
    Sidebar.pluginName = "sidebar";
    Sidebar.log = Logger.get(Sidebar.pluginName);
    Sidebar.templatePath = "plugins/sidebar/html/sidebar.html";
})(Sidebar || (Sidebar = {}));

var Sidebar;
(function (Sidebar) {
    Sidebar._module = angular.module(Sidebar.pluginName, []);
    Sidebar._module.directive('hawkularSidebar', function () {
        return new Sidebar.SidebarDirective();
    });
    hawtioPluginLoader.addModule(Sidebar.pluginName);
})(Sidebar || (Sidebar = {}));

var Sidebar;
(function (Sidebar) {
    var log = Logger.get("Sidebar");
    var SidebarDirective = (function () {
        function SidebarDirective() {
            this.restrict = 'E';
            this.transclude = false;
            this.replace = false;
            this.templateUrl = Sidebar.templatePath;
        }
        return SidebarDirective;
    })();
    Sidebar.SidebarDirective = SidebarDirective;
    Sidebar.SidebarController = Sidebar._module.controller("Sidebar.SidebarController", ['$scope', '$rootScope', '$location', function ($scope, $rootScope, $location) {
        $scope.getClass = function (path) {
            return $location.path().indexOf(path) === 0 ? 'active' : '';
        };
    }]);
})(Sidebar || (Sidebar = {}));

var Topbar;
(function (Topbar) {
    Topbar.pluginName = "topbar";
    Topbar.log = Logger.get(Topbar.pluginName);
    Topbar.templatePath = "plugins/topbar/html/topbar.html";
    Topbar.globalTenantId = "test";
})(Topbar || (Topbar = {}));

var Topbar;
(function (Topbar) {
    Topbar._module = angular.module(Topbar.pluginName, ['ngResource', 'hawkular.services']);
    Topbar._module.directive('hawkularTopbar', function () {
        return new Topbar.TopbarDirective();
    });
    hawtioPluginLoader.addModule(Topbar.pluginName);
})(Topbar || (Topbar = {}));

var Topbar;
(function (Topbar) {
    var log = Logger.get("Topbar");
    var TopbarDirective = (function () {
        function TopbarDirective() {
            this.restrict = 'E';
            this.transclude = false;
            this.replace = false;
            this.templateUrl = Topbar.templatePath;
        }
        return TopbarDirective;
    })();
    Topbar.TopbarDirective = TopbarDirective;
    Topbar.TopbarController = Topbar._module.controller("Topbar.TopbarController", ['$scope', '$rootScope', '$location', 'DataResource', 'DataRange', 'HawkularInventory', function ($scope, $rootScope, $location, DataResource, DataRange, HawkularInventory) {
        $scope.range = 'week';
        $scope.getDate = function () {
            $scope.rangeDates = DataRange.getFormattedTimeRange();
        };
        $scope.setRange = function (range) {
            DataRange.setCustomRange(range);
            $scope.getDate();
            $scope.range = Object.keys(range)[0];
        };
        $scope.rangeNames = {
            'hour': 'Last Hour',
            'hours': 'Last 12 Hours',
            'day': 'Last Day',
            'week': 'Last Week',
            'month': 'Last Month',
            'year': 'Last Year'
        };
        $scope.updateResources = function () {
            DataResource.updateResources().then(function (data) {
                $scope.resources = data;
            });
        };
        $scope.getSelection = function () {
            return {
                resource: DataResource.getSelectedResource(),
                start: DataRange.getStartDate(),
                end: DataRange.getEndDate()
            };
        };
        $scope.setSelection = function (resourceId) {
            DataResource.setSelectedResource(resourceId);
        };
        $scope.updateResources();
        $scope.getSelection();
        $scope.getDate();
    }]);
})(Topbar || (Topbar = {}));

var Topbar;
(function (Topbar) {
    var DataRange = (function () {
        function DataRange() {
            this.endTimestamp = moment().valueOf();
            this.startTimestamp = moment(this.endTimestamp).subtract({ days: 7 }).valueOf();
        }
        DataRange.prototype.setCustomRange = function (rangeValue, customEndTimestamp) {
            this.endTimestamp = customEndTimestamp || moment().valueOf();
            this.startTimestamp = moment(this.endTimestamp).subtract(rangeValue).valueOf();
        };
        DataRange.prototype.getStartDate = function () {
            return new Date(this.startTimestamp);
        };
        DataRange.prototype.getEndDate = function () {
            return new Date(this.endTimestamp);
        };
        DataRange.prototype.getFormattedTimeRange = function () {
            var diff = this.endTimestamp - this.startTimestamp;
            var momStart = moment(this.startTimestamp);
            var momEnd = moment(this.endTimestamp);
            if (diff < 24 * 60 * 60 * 1000) {
                return momStart.format('D MMM YYYY') + ' ' + momStart.format('HH:mm') + ' - ' + (momStart.day() !== momEnd.day() ? momEnd.format('D MMM YYYY ') : '') + momEnd.format('HH:mm');
            }
            else {
                return momStart.format('D MMM YYYY') + ' - ' + momEnd.format('D MMM YYYY');
            }
        };
        return DataRange;
    })();
    Topbar.DataRange = DataRange;
    Topbar._module.service('DataRange', DataRange);
    var DataResource = (function () {
        function DataResource(HawkularInventory) {
            this.HawkularInventory = HawkularInventory;
            this.hkInventory = HawkularInventory;
            this.updateResources();
        }
        DataResource.prototype.updateResources = function () {
            var _this = this;
            return this.hkInventory.Resource.query({ tenantId: Topbar.globalTenantId }).$promise.then(function (resources) {
                _this.globalResourceList = resources;
                if (!_this.selectedResource) {
                    _this.selectedResource = resources[resources.length - 1];
                }
                return resources;
            });
        };
        DataResource.prototype.getSelectedResource = function () {
            return this.selectedResource;
        };
        DataResource.prototype.getResources = function () {
            return this.globalResourceList;
        };
        DataResource.prototype.setSelectedResource = function (resource) {
            this.selectedResource = resource;
        };
        DataResource.$inject = ['HawkularInventory'];
        return DataResource;
    })();
    Topbar.DataResource = DataResource;
    Topbar._module.service('DataResource', DataResource);
})(Topbar || (Topbar = {}));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLmpzIiwiL1VzZXJzL210aG8xMS9wcm9qZWN0cy9oYXdrdWxhci11aS1jb21wb25lbnRzL3NpZGViYXIvdHMvc2lkZWJhckdsb2JhbHMudHMiLCIvVXNlcnMvbXRobzExL3Byb2plY3RzL2hhd2t1bGFyLXVpLWNvbXBvbmVudHMvc2lkZWJhci90cy9zaWRlYmFyUGx1Z2luLnRzIiwiL1VzZXJzL210aG8xMS9wcm9qZWN0cy9oYXdrdWxhci11aS1jb21wb25lbnRzL3NpZGViYXIvdHMvc2lkZWJhckRpcmVjdGl2ZS50cyIsIi9Vc2Vycy9tdGhvMTEvcHJvamVjdHMvaGF3a3VsYXItdWktY29tcG9uZW50cy90b3BiYXIvdHMvdG9wYmFyR2xvYmFscy50cyIsIi9Vc2Vycy9tdGhvMTEvcHJvamVjdHMvaGF3a3VsYXItdWktY29tcG9uZW50cy90b3BiYXIvdHMvdG9wYmFyUGx1Z2luLnRzIiwiL1VzZXJzL210aG8xMS9wcm9qZWN0cy9oYXdrdWxhci11aS1jb21wb25lbnRzL3RvcGJhci90cy90b3BiYXJEaXJlY3RpdmUudHMiLCIvVXNlcnMvbXRobzExL3Byb2plY3RzL2hhd2t1bGFyLXVpLWNvbXBvbmVudHMvdG9wYmFyL3RzL3RvcGJhclNlcnZpY2VzLnRzIl0sIm5hbWVzIjpbIlNpZGViYXIiLCJTaWRlYmFyLlNpZGViYXJEaXJlY3RpdmUiLCJTaWRlYmFyLlNpZGViYXJEaXJlY3RpdmUuY29uc3RydWN0b3IiLCJUb3BiYXIiLCJUb3BiYXIuVG9wYmFyRGlyZWN0aXZlIiwiVG9wYmFyLlRvcGJhckRpcmVjdGl2ZS5jb25zdHJ1Y3RvciIsIlRvcGJhci5EYXRhUmFuZ2UiLCJUb3BiYXIuRGF0YVJhbmdlLmNvbnN0cnVjdG9yIiwiVG9wYmFyLkRhdGFSYW5nZS5zZXRDdXN0b21SYW5nZSIsIlRvcGJhci5EYXRhUmFuZ2UuZ2V0U3RhcnREYXRlIiwiVG9wYmFyLkRhdGFSYW5nZS5nZXRFbmREYXRlIiwiVG9wYmFyLkRhdGFSYW5nZS5nZXRGb3JtYXR0ZWRUaW1lUmFuZ2UiLCJUb3BiYXIuRGF0YVJlc291cmNlIiwiVG9wYmFyLkRhdGFSZXNvdXJjZS5jb25zdHJ1Y3RvciIsIlRvcGJhci5EYXRhUmVzb3VyY2UudXBkYXRlUmVzb3VyY2VzIiwiVG9wYmFyLkRhdGFSZXNvdXJjZS5nZXRTZWxlY3RlZFJlc291cmNlIiwiVG9wYmFyLkRhdGFSZXNvdXJjZS5nZXRSZXNvdXJjZXMiLCJUb3BiYXIuRGF0YVJlc291cmNlLnNldFNlbGVjdGVkUmVzb3VyY2UiXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUNlQSxJQUFPLE9BQU8sQ0FRYjtBQVJELFdBQU8sT0FBTyxFQUFDLENBQUM7SUFFSEEsa0JBQVVBLEdBQUdBLFNBQVNBLENBQUNBO0lBRXZCQSxXQUFHQSxHQUFrQkEsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0Esa0JBQVVBLENBQUNBLENBQUNBO0lBRTVDQSxvQkFBWUEsR0FBR0EsbUNBQW1DQSxDQUFDQTtBQUVoRUEsQ0FBQ0EsRUFSTSxPQUFPLEtBQVAsT0FBTyxRQVFiOztBQ1BELElBQU8sT0FBTyxDQVNiO0FBVEQsV0FBTyxPQUFPLEVBQUMsQ0FBQztJQUVIQSxlQUFPQSxHQUFHQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxrQkFBVUEsRUFBRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7SUFFcERBLGVBQU9BLENBQUNBLFNBQVNBLENBQUNBLGlCQUFpQkEsRUFBRUE7UUFDbkMsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDeEMsQ0FBQyxDQUFDQSxDQUFDQTtJQUVIQSxrQkFBa0JBLENBQUNBLFNBQVNBLENBQUNBLGtCQUFVQSxDQUFDQSxDQUFDQTtBQUMzQ0EsQ0FBQ0EsRUFUTSxPQUFPLEtBQVAsT0FBTyxRQVNiOztBQ1ZELElBQU8sT0FBTyxDQW9CYjtBQXBCRCxXQUFPLE9BQU8sRUFBQyxDQUFDO0lBRWRBLElBQUlBLEdBQUdBLEdBQWtCQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFD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TUEsQ0FBQ0EsSUFBSUEsQ0FBQ0Esa0JBQWtCQSxDQUFDQTtRQUNqQ0EsQ0FBQ0E7UUFFTUosMENBQW1CQSxHQUExQkEsVUFBMkJBLFFBQWdCQTtZQUN6Q0ssSUFBSUEsQ0FBQ0EsZ0JBQWdCQSxHQUFHQSxRQUFRQSxDQUFDQTtRQUNuQ0EsQ0FBQ0E7UUFqQ2FMLG9CQUFPQSxHQUFHQSxDQUFDQSxtQkFBbUJBLENBQUNBLENBQUNBO1FBa0NoREEsbUJBQUNBO0lBQURBLENBcENBVCxBQW9DQ1MsSUFBQVQ7SUFwQ1lBLG1CQUFZQSxHQUFaQSxZQW9DWkEsQ0FBQUE7SUFFREEsY0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsY0FBY0EsRUFBRUEsWUFBWUEsQ0FBQ0EsQ0FBQ0E7QUFFaERBLENBQUNBLEVBakZNLE1BQU0sS0FBTixNQUFNLFFBaUZaIiwiZmlsZSI6ImNvbXBpbGVkLmpzIiwic291cmNlc0NvbnRlbnQiOltudWxsLCIvLy8gQ29weXJpZ2h0IDIwMTQtMjAxNSBSZWQgSGF0LCBJbmMuIGFuZC9vciBpdHMgYWZmaWxpYXRlc1xuLy8vIGFuZCBvdGhlciBjb250cmlidXRvcnMgYXMgaW5kaWNhdGVkIGJ5IHRoZSBAYXV0aG9yIHRhZ3MuXG4vLy9cbi8vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vL1xuLy8vICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLy9cbi8vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL2luY2x1ZGVzLnRzXCIvPlxubW9kdWxlIFNpZGViYXIge1xuXG4gIGV4cG9ydCB2YXIgcGx1Z2luTmFtZSA9IFwic2lkZWJhclwiO1xuXG4gIGV4cG9ydCB2YXIgbG9nOkxvZ2dpbmcuTG9nZ2VyID0gTG9nZ2VyLmdldChwbHVnaW5OYW1lKTtcblxuICBleHBvcnQgdmFyIHRlbXBsYXRlUGF0aCA9IFwicGx1Z2lucy9zaWRlYmFyL2h0bWwvc2lkZWJhci5odG1sXCI7XG5cbn1cbiIsIi8vLyBDb3B5cmlnaHQgMjAxNC0yMDE1IFJlZCBIYXQsIEluYy4gYW5kL29yIGl0cyBhZmZpbGlhdGVzXG4vLy8gYW5kIG90aGVyIGNvbnRyaWJ1dG9ycyBhcyBpbmRpY2F0ZWQgYnkgdGhlIEBhdXRob3IgdGFncy5cbi8vL1xuLy8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8vXG4vLy8gICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vL1xuLy8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vaW5jbHVkZXMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwic2lkZWJhckdsb2JhbHMudHNcIi8+XG5tb2R1bGUgU2lkZWJhciB7XG5cbiAgZXhwb3J0IHZhciBfbW9kdWxlID0gYW5ndWxhci5tb2R1bGUocGx1Z2luTmFtZSwgW10pO1xuXG4gIF9tb2R1bGUuZGlyZWN0aXZlKCdoYXdrdWxhclNpZGViYXInLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBTaWRlYmFyLlNpZGViYXJEaXJlY3RpdmUoKTtcbiAgfSk7XG5cbiAgaGF3dGlvUGx1Z2luTG9hZGVyLmFkZE1vZHVsZShwbHVnaW5OYW1lKTtcbn1cbiIsIi8vLyBDb3B5cmlnaHQgMjAxNC0yMDE1IFJlZCBIYXQsIEluYy4gYW5kL29yIGl0cyBhZmZpbGlhdGVzXG4vLy8gYW5kIG90aGVyIGNvbnRyaWJ1dG9ycyBhcyBpbmRpY2F0ZWQgYnkgdGhlIEBhdXRob3IgdGFncy5cbi8vL1xuLy8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8vXG4vLy8gICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vL1xuLy8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwic2lkZWJhclBsdWdpbi50c1wiLz5cbm1vZHVsZSBTaWRlYmFyIHtcblxuICB2YXIgbG9nOkxvZ2dpbmcuTG9nZ2VyID0gTG9nZ2VyLmdldChcIlNpZGViYXJcIik7XG5cbiAgZXhwb3J0IGNsYXNzIFNpZGViYXJEaXJlY3RpdmUge1xuXG4gICAgcHVibGljIHJlc3RyaWN0ID0gJ0UnO1xuICAgIHB1YmxpYyB0cmFuc2NsdWRlID0gZmFsc2U7XG4gICAgcHVibGljIHJlcGxhY2UgPSBmYWxzZTtcblxuICAgIHB1YmxpYyB0ZW1wbGF0ZVVybCA9IHRlbXBsYXRlUGF0aDtcbiAgfVxuXG4gIGV4cG9ydCB2YXIgU2lkZWJhckNvbnRyb2xsZXIgPSBfbW9kdWxlLmNvbnRyb2xsZXIoXCJTaWRlYmFyLlNpZGViYXJDb250cm9sbGVyXCIsXG4gICAgWyckc2NvcGUnLCAnJHJvb3RTY29wZScsICckbG9jYXRpb24nICwoJHNjb3BlLCAkcm9vdFNjb3BlLCAkbG9jYXRpb24pID0+IHtcblxuICAgICRzY29wZS5nZXRDbGFzcyA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICByZXR1cm4gJGxvY2F0aW9uLnBhdGgoKS5pbmRleE9mKHBhdGgpID09PSAwID8gJ2FjdGl2ZScgOiAnJztcbiAgICB9O1xuICB9XSk7XG59XG4iLCIvLy8gQ29weXJpZ2h0IDIwMTQtMjAxNSBSZWQgSGF0LCBJbmMuIGFuZC9vciBpdHMgYWZmaWxpYXRlc1xuLy8vIGFuZCBvdGhlciBjb250cmlidXRvcnMgYXMgaW5kaWNhdGVkIGJ5IHRoZSBAYXV0aG9yIHRhZ3MuXG4vLy9cbi8vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vL1xuLy8vICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLy9cbi8vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL2luY2x1ZGVzLnRzXCIvPlxubW9kdWxlIFRvcGJhciB7XG5cbiAgZXhwb3J0IHZhciBwbHVnaW5OYW1lID0gXCJ0b3BiYXJcIjtcblxuICBleHBvcnQgdmFyIGxvZzpMb2dnaW5nLkxvZ2dlciA9IExvZ2dlci5nZXQocGx1Z2luTmFtZSk7XG5cbiAgZXhwb3J0IHZhciB0ZW1wbGF0ZVBhdGggPSBcInBsdWdpbnMvdG9wYmFyL2h0bWwvdG9wYmFyLmh0bWxcIjtcblxuICBleHBvcnQgdmFyIGdsb2JhbFRlbmFudElkID0gXCJ0ZXN0XCI7XG5cbn1cbiIsIi8vLyBDb3B5cmlnaHQgMjAxNC0yMDE1IFJlZCBIYXQsIEluYy4gYW5kL29yIGl0cyBhZmZpbGlhdGVzXG4vLy8gYW5kIG90aGVyIGNvbnRyaWJ1dG9ycyBhcyBpbmRpY2F0ZWQgYnkgdGhlIEBhdXRob3IgdGFncy5cbi8vL1xuLy8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8vXG4vLy8gICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vL1xuLy8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vaW5jbHVkZXMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwidG9wYmFyR2xvYmFscy50c1wiLz5cbm1vZHVsZSBUb3BiYXIge1xuXG4gIGV4cG9ydCB2YXIgX21vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKHBsdWdpbk5hbWUsIFsnbmdSZXNvdXJjZScsICdoYXdrdWxhci5zZXJ2aWNlcyddKTtcblxuICBfbW9kdWxlLmRpcmVjdGl2ZSgnaGF3a3VsYXJUb3BiYXInLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBUb3BiYXIuVG9wYmFyRGlyZWN0aXZlKCk7XG4gIH0pO1xuXG4gIGhhd3Rpb1BsdWdpbkxvYWRlci5hZGRNb2R1bGUocGx1Z2luTmFtZSk7XG59XG4iLCIvLy8gQ29weXJpZ2h0IDIwMTQtMjAxNSBSZWQgSGF0LCBJbmMuIGFuZC9vciBpdHMgYWZmaWxpYXRlc1xuLy8vIGFuZCBvdGhlciBjb250cmlidXRvcnMgYXMgaW5kaWNhdGVkIGJ5IHRoZSBAYXV0aG9yIHRhZ3MuXG4vLy9cbi8vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vL1xuLy8vICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLy9cbi8vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cInRvcGJhclBsdWdpbi50c1wiLz5cbm1vZHVsZSBUb3BiYXIge1xuXG4gIHZhciBsb2c6TG9nZ2luZy5Mb2dnZXIgPSBMb2dnZXIuZ2V0KFwiVG9wYmFyXCIpO1xuXG4gIGV4cG9ydCBjbGFzcyBUb3BiYXJEaXJlY3RpdmUge1xuXG4gICAgcHVibGljIHJlc3RyaWN0ID0gJ0UnO1xuICAgIHB1YmxpYyB0cmFuc2NsdWRlID0gZmFsc2U7XG4gICAgcHVibGljIHJlcGxhY2UgPSBmYWxzZTtcblxuICAgIHB1YmxpYyB0ZW1wbGF0ZVVybCA9IHRlbXBsYXRlUGF0aDtcbiAgfVxuXG4gIGV4cG9ydCB2YXIgVG9wYmFyQ29udHJvbGxlciA9IF9tb2R1bGUuY29udHJvbGxlcihcIlRvcGJhci5Ub3BiYXJDb250cm9sbGVyXCIsXG4gICAgWyckc2NvcGUnLCAnJHJvb3RTY29wZScsICckbG9jYXRpb24nLCAnRGF0YVJlc291cmNlJywgJ0RhdGFSYW5nZScsICdIYXdrdWxhckludmVudG9yeScsICgkc2NvcGUsICRyb290U2NvcGUsICRsb2NhdGlvbiwgRGF0YVJlc291cmNlLCBEYXRhUmFuZ2UsIEhhd2t1bGFySW52ZW50b3J5KSA9PiB7XG5cbiAgICAkc2NvcGUucmFuZ2UgPSAnd2Vlayc7XG5cbiAgICAkc2NvcGUuZ2V0RGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgJHNjb3BlLnJhbmdlRGF0ZXMgPSBEYXRhUmFuZ2UuZ2V0Rm9ybWF0dGVkVGltZVJhbmdlKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5zZXRSYW5nZSA9IGZ1bmN0aW9uKHJhbmdlKSB7XG4gICAgICBEYXRhUmFuZ2Uuc2V0Q3VzdG9tUmFuZ2UocmFuZ2UpO1xuICAgICAgJHNjb3BlLmdldERhdGUoKTtcbiAgICAgICRzY29wZS5yYW5nZSA9IE9iamVjdC5rZXlzKHJhbmdlKVswXTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLnJhbmdlTmFtZXMgPSB7XG4gICAgICAnaG91cic6ICdMYXN0IEhvdXInLFxuICAgICAgJ2hvdXJzJzogJ0xhc3QgMTIgSG91cnMnLFxuICAgICAgJ2RheSc6ICdMYXN0IERheScsXG4gICAgICAnd2Vlayc6ICdMYXN0IFdlZWsnLFxuICAgICAgJ21vbnRoJzogJ0xhc3QgTW9udGgnLFxuICAgICAgJ3llYXInOiAnTGFzdCBZZWFyJ1xuICAgIH07XG5cbiAgICAkc2NvcGUudXBkYXRlUmVzb3VyY2VzID0gZnVuY3Rpb24oKSB7XG4gICAgICBEYXRhUmVzb3VyY2UudXBkYXRlUmVzb3VyY2VzKCkudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICRzY29wZS5yZXNvdXJjZXMgPSBkYXRhO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5nZXRTZWxlY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc291cmNlOiBEYXRhUmVzb3VyY2UuZ2V0U2VsZWN0ZWRSZXNvdXJjZSgpLFxuICAgICAgICBzdGFydDogRGF0YVJhbmdlLmdldFN0YXJ0RGF0ZSgpLFxuICAgICAgICBlbmQ6IERhdGFSYW5nZS5nZXRFbmREYXRlKClcbiAgICAgIH07XG4gICAgfTtcblxuICAgICRzY29wZS5zZXRTZWxlY3Rpb24gPSBmdW5jdGlvbihyZXNvdXJjZUlkKSB7XG4gICAgICBEYXRhUmVzb3VyY2Uuc2V0U2VsZWN0ZWRSZXNvdXJjZShyZXNvdXJjZUlkKTtcbiAgICB9O1xuXG4gICAgLy8vIEluaXRpYWxpemVcbiAgICAkc2NvcGUudXBkYXRlUmVzb3VyY2VzKCk7XG4gICAgJHNjb3BlLmdldFNlbGVjdGlvbigpO1xuICAgICRzY29wZS5nZXREYXRlKCk7XG5cbiAgfV0pO1xufVxuIiwiLy8vIENvcHlyaWdodCAyMDE0LTIwMTUgUmVkIEhhdCwgSW5jLiBhbmQvb3IgaXRzIGFmZmlsaWF0ZXNcbi8vLyBhbmQgb3RoZXIgY29udHJpYnV0b3JzIGFzIGluZGljYXRlZCBieSB0aGUgQGF1dGhvciB0YWdzLlxuLy8vXG4vLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLy9cbi8vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8vXG4vLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9pbmNsdWRlcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0b3BiYXJHbG9iYWxzLnRzXCIvPlxubW9kdWxlIFRvcGJhciB7XG5cbiAgZXhwb3J0IGNsYXNzIERhdGFSYW5nZSB7XG5cbiAgICBzdGFydFRpbWVzdGFtcDogbnVtYmVyO1xuICAgIGVuZFRpbWVzdGFtcDogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAvLy8gZGVmYXVsdHMgdG8gbGFzdCA3IGRheXNcbiAgICAgIHRoaXMuZW5kVGltZXN0YW1wID0gbW9tZW50KCkudmFsdWVPZigpO1xuICAgICAgdGhpcy5zdGFydFRpbWVzdGFtcCA9IG1vbWVudCh0aGlzLmVuZFRpbWVzdGFtcCkuc3VidHJhY3Qoe2RheXM6IDd9KS52YWx1ZU9mKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHNldEN1c3RvbVJhbmdlKHJhbmdlVmFsdWU6IE9iamVjdCwgY3VzdG9tRW5kVGltZXN0YW1wOiBudW1iZXIpIHtcbiAgICAgIHRoaXMuZW5kVGltZXN0YW1wID0gY3VzdG9tRW5kVGltZXN0YW1wIHx8IG1vbWVudCgpLnZhbHVlT2YoKTtcbiAgICAgIHRoaXMuc3RhcnRUaW1lc3RhbXAgPSBtb21lbnQodGhpcy5lbmRUaW1lc3RhbXApLnN1YnRyYWN0KHJhbmdlVmFsdWUpLnZhbHVlT2YoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0U3RhcnREYXRlKCk6RGF0ZSB7XG4gICAgICByZXR1cm4gbmV3IERhdGUodGhpcy5zdGFydFRpbWVzdGFtcCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldEVuZERhdGUoKTpEYXRlIHtcbiAgICAgIHJldHVybiBuZXcgRGF0ZSh0aGlzLmVuZFRpbWVzdGFtcCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldEZvcm1hdHRlZFRpbWVSYW5nZSgpOnN0cmluZyB7XG4gICAgICB2YXIgZGlmZiA9IHRoaXMuZW5kVGltZXN0YW1wIC0gdGhpcy5zdGFydFRpbWVzdGFtcDtcbiAgICAgIHZhciBtb21TdGFydCA9IG1vbWVudCh0aGlzLnN0YXJ0VGltZXN0YW1wKTtcbiAgICAgIHZhciBtb21FbmQgPSBtb21lbnQodGhpcy5lbmRUaW1lc3RhbXApO1xuXG4gICAgICBpZiAoZGlmZiA8IDI0ICogNjAgKiA2MCAqIDEwMDApIHtcbiAgICAgICAgcmV0dXJuIG1vbVN0YXJ0LmZvcm1hdCgnRCBNTU0gWVlZWScpICsgJyAnICsgbW9tU3RhcnQuZm9ybWF0KCdISDptbScpICsgJyAtICcgKyAobW9tU3RhcnQuZGF5KCkgIT09IG1vbUVuZC5kYXkoKSA/IG1vbUVuZC5mb3JtYXQoJ0QgTU1NIFlZWVkgJykgIDogJycpICsgbW9tRW5kLmZvcm1hdCgnSEg6bW0nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBtb21TdGFydC5mb3JtYXQoJ0QgTU1NIFlZWVknKSArICcgLSAnICsgbW9tRW5kLmZvcm1hdCgnRCBNTU0gWVlZWScpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIF9tb2R1bGUuc2VydmljZSgnRGF0YVJhbmdlJywgRGF0YVJhbmdlKTtcblxuICBleHBvcnQgY2xhc3MgRGF0YVJlc291cmNlIHtcblxuICAgIHB1YmxpYyBzdGF0aWMgJGluamVjdCA9IFsnSGF3a3VsYXJJbnZlbnRvcnknXTtcblxuICAgIGdsb2JhbFJlc291cmNlTGlzdDogYW55O1xuICAgIHNlbGVjdGVkUmVzb3VyY2U6IFN0cmluZztcblxuICAgIGhrSW52ZW50b3J5OiBhbnk7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIEhhd2t1bGFySW52ZW50b3J5OmFueSkge1xuICAgICAgdGhpcy5oa0ludmVudG9yeSA9IEhhd2t1bGFySW52ZW50b3J5O1xuICAgICAgdGhpcy51cGRhdGVSZXNvdXJjZXMoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlUmVzb3VyY2VzKCk6YW55IHtcbiAgICAgIHJldHVybiB0aGlzLmhrSW52ZW50b3J5LlJlc291cmNlLnF1ZXJ5KHt0ZW5hbnRJZDogZ2xvYmFsVGVuYW50SWR9KS4kcHJvbWlzZS5cbiAgICAgICAgdGhlbigocmVzb3VyY2VzKT0+IHtcbiAgICAgICAgICB0aGlzLmdsb2JhbFJlc291cmNlTGlzdCA9IHJlc291cmNlcztcbiAgICAgICAgICBpZiAoIXRoaXMuc2VsZWN0ZWRSZXNvdXJjZSkge1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFJlc291cmNlID0gcmVzb3VyY2VzW3Jlc291cmNlcy5sZW5ndGggLSAxXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc291cmNlcztcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFNlbGVjdGVkUmVzb3VyY2UoKTpTdHJpbmcge1xuICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWRSZXNvdXJjZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UmVzb3VyY2VzKCk6YW55IHtcbiAgICAgIHJldHVybiB0aGlzLmdsb2JhbFJlc291cmNlTGlzdDtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0U2VsZWN0ZWRSZXNvdXJjZShyZXNvdXJjZTogU3RyaW5nKTp2b2lkIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWRSZXNvdXJjZSA9IHJlc291cmNlO1xuICAgIH1cbiAgfVxuXG4gIF9tb2R1bGUuc2VydmljZSgnRGF0YVJlc291cmNlJywgRGF0YVJlc291cmNlKTtcblxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
angular.module("hawkular-ui-components-directives-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("plugins/sidebar/html/sidebar.html","<div class=\"col-sm-3 col-md-2 sidebar-pf sidebar-pf-left sidebar-pf-dark sidebar-pf-big-icons\">\n\n  <ul class=\"nav nav-pills nav-stacked nav-dark nav-big-icons\">\n    <li ng-class=\"getClass(\'/metrics/responseTime\')\"><a href=\"/metrics/responseTime\"><i class=\"fa fa-line-chart\"></i>Response Time</a></li>\n    <li ng-class=\"getClass(\'/metrics/upDowntime\')\"><a href=\"/metrics/upDowntime\"><i class=\"fa fa-arrow-up\"></i>Up / Downtime</a></li>\n    <li ng-class=\"getClass(\'/metrics/alerts\')\"><a href=\"/metrics/alerts\"><i class=\"fa fa-flag\"></i>Alerts</a></li>\n  </ul>\n</div>");
$templateCache.put("plugins/topbar/html/topbar.html","<ul class=\"nav navbar-nav navbar-primary navbar-selector navbar-dark row\">\n  <li class=\"dropdown context col-sm-3 col-md-2\">\n    <a href=\"#\" class=\"dropdown-toggle additional-info\" data-toggle=\"dropdown\" ng-hide=\"resources.length === 0\">\n      {{getSelection().resource.id}}\n      <span>{{getSelection().resource.parameters.url}}</span>\n      <b class=\"caret\"></b>\n    </a>\n    <a href=\"/metrics/addUrl\" class=\"additional-info\" ng-show=\"resources.length === 0\">\n      No Resources Available\n      <span>Add a Resource</span>\n    </a>\n    <ul class=\"dropdown-menu\">\n      <li ng-class=\"{\'active\': getSelection().resource.id == resource.id}\" ng-repeat=\"resource in resources\">\n        <a href=\"\" ng-click=\"setSelection(resource)\">{{resource.id}}</a>\n      </li>\n      <li class=\"divider\"></li>\n      <li>\n        <a href=\"/metrics/addUrl\">Add Application...</a>\n      </li>\n    </ul>\n  </li>\n\n  <li class=\"pull-right date-range dropdown\">\n    <i class=\"fa fa-calendar\"></i>\n    <div class=\"input\" data-toggle=\"dropdown\">\n      {{rangeNames[range]}} <span class=\"additional-info\">({{rangeDates}})</span>\n    </div>\n\n    <div class=\"dropdown-menu infotip bottom-right\">\n      <div class=\"arrow\"></div>\n      <div class=\"dropdown-menu-content\">\n        <span class=\"label\">Last</span>\n        <div class=\"btn-group\">\n          <button type=\"button\" class=\"btn btn-default\" ng-class=\"{\'active\': range === \'hour\'}\" ng-click=\"setRange({hour: 1})\">1h</button>\n          <button type=\"button\" class=\"btn btn-default\" ng-class=\"{\'active\': range === \'hours\'}\" ng-click=\"setRange({hours: 12})\">12h</button>\n          <button type=\"button\" class=\"btn btn-default\" ng-class=\"{\'active\': range === \'day\'}\" ng-click=\"setRange({day: 1})\">Day</button>\n          <button type=\"button\" class=\"btn btn-default\" ng-class=\"{\'active\': range === \'week\'}\" ng-click=\"setRange({week: 1})\">Week</button>\n          <button type=\"button\" class=\"btn btn-default\" ng-class=\"{\'active\': range === \'month\'}\" ng-click=\"setRange({month: 1})\">Month</button>\n          <button type=\"button\" class=\"btn btn-default\" ng-class=\"{\'active\': range === \'year\'}\" ng-click=\"setRange({year: 1})\">Year</button>\n        </div>\n      </div>\n    </div>\n  </li>\n</ul>");}]); hawtioPluginLoader.addModule("hawkular-ui-components-directives-templates");