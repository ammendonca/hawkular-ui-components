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


var HawkularMetrics;
(function (HawkularMetrics) {
    HawkularMetrics.pluginName = "hawkular-metrics";
    HawkularMetrics.log = Logger.get(HawkularMetrics.pluginName);
    HawkularMetrics.templatePath = "plugins/metrics/html";
    HawkularMetrics.globalTenantId = "test";
    HawkularMetrics.globalResourceId = "";
    HawkularMetrics.globalResourceUrl = "";
    HawkularMetrics.globalResourceList = [];
    HawkularMetrics.globalChartTimeRange;
    var ChartTimeRange = (function () {
        function ChartTimeRange(initialHoursDifference) {
            this.initialHoursDifference = initialHoursDifference;
            this.init();
        }
        ChartTimeRange.prototype.init = function () {
            this.endTimestamp = moment().valueOf();
            this.startTimestamp = moment().subtract('hour', this.initialHoursDifference).valueOf();
        };
        ChartTimeRange.prototype.getStartDate = function () {
            return new Date(this.startTimestamp);
        };
        ChartTimeRange.prototype.getEndDate = function () {
            return new Date(this.endTimestamp);
        };
        ChartTimeRange.prototype.getFormattedTimeRange = function () {
            return moment(this.startTimestamp).format('H:mm') + ' - ' + moment(this.endTimestamp).format('H:mm') + ' (' + moment(this.endTimestamp).from(moment(this.startTimestamp), true) + ')';
        };
        return ChartTimeRange;
    })();
    HawkularMetrics.ChartTimeRange = ChartTimeRange;
})(HawkularMetrics || (HawkularMetrics = {}));

var HawkularMetrics;
(function (HawkularMetrics) {
    HawkularMetrics._module = angular.module(HawkularMetrics.pluginName, ['ngResource', 'ui.select', 'hawkularCharts', 'hawkular.services']);
    var metricsTab;
    HawkularMetrics._module.config(['$httpProvider', '$locationProvider', '$routeProvider', 'HawtioNavBuilderProvider', function ($httpProvider, $locationProvider, $routeProvider, navBuilder) {
        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
        metricsTab = navBuilder.create().id(HawkularMetrics.pluginName).title(function () { return "Metrics"; }).href(function () { return "/metrics"; }).subPath("Add Url", "addUrl", navBuilder.join(HawkularMetrics.templatePath, 'add-url.html')).subPath("Overview", "overview", navBuilder.join(HawkularMetrics.templatePath, 'overview.html')).subPath("Metrics Response", "metricsResponse", navBuilder.join(HawkularMetrics.templatePath, 'metrics-response.html')).build();
        navBuilder.configureRouting($routeProvider, metricsTab);
        $locationProvider.html5Mode(true);
    }]);
    HawkularMetrics._module.run(['HawtioNav', function (HawtioNav) {
        HawtioNav.add(metricsTab);
        HawkularMetrics.log.debug("loaded Metrics Plugin");
    }]);
    HawkularMetrics._module.directive('ngEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.ngEnter);
                    });
                    event.preventDefault();
                }
            });
        };
    });
    hawtioPluginLoader.addModule(HawkularMetrics.pluginName);
})(HawkularMetrics || (HawkularMetrics = {}));

var HawkularMetrics;
(function (HawkularMetrics) {
    var AddUrlController = (function () {
        function AddUrlController($location, $scope, $rootScope, $log, HawkularInventory, resourceUrl) {
            this.$location = $location;
            this.$scope = $scope;
            this.$rootScope = $rootScope;
            this.$log = $log;
            this.HawkularInventory = HawkularInventory;
            this.resourceUrl = resourceUrl;
            this.httpUriPart = 'http://';
            $scope.vm = this;
            this.resourceUrl = this.httpUriPart;
        }
        AddUrlController.prototype.addUrl = function (url) {
            var _this = this;
            var resource = {
                type: 'URL',
                id: '',
                parameters: {
                    url: url
                }
            };
            this.$log.info("Adding new Resource Url to Hawkular-inventory: " + url);
            HawkularMetrics.globalChartTimeRange = new HawkularMetrics.ChartTimeRange(1);
            this.HawkularInventory.Resource.save({ tenantId: HawkularMetrics.globalTenantId }, resource).$promise.then(function (newResource) {
                HawkularMetrics.globalResourceId = newResource.id;
                HawkularMetrics.globalResourceUrl = resource.parameters.url;
                console.dir(newResource);
                _this.$log.info("New Resource ID: " + HawkularMetrics.globalResourceId + " created for url: " + HawkularMetrics.globalResourceUrl);
                var metrics = [{
                    name: HawkularMetrics.globalResourceId + '.status.duration',
                    unit: 'MILLI_SECOND',
                    description: 'Response Time in ms.'
                }, {
                    name: HawkularMetrics.globalResourceId + '.status.code',
                    unit: 'NONE',
                    description: 'Status Code'
                }];
                _this.HawkularInventory.Metric.save({
                    tenantId: HawkularMetrics.globalTenantId,
                    resourceId: newResource.id
                }, metrics).$promise.then(function (newMetrics) {
                    toastr.info("Your data is being collected. Please be patient (should be about another minute).");
                    _this.$location.url("/metrics/metricsResponse");
                });
            });
        };
        AddUrlController.$inject = ['$location', '$scope', '$rootScope', '$log', 'HawkularInventory'];
        return AddUrlController;
    })();
    HawkularMetrics.AddUrlController = AddUrlController;
    HawkularMetrics._module.controller('HawkularMetrics.AddUrlController', AddUrlController);
})(HawkularMetrics || (HawkularMetrics = {}));

var HawkularMetrics;
(function (HawkularMetrics) {
    var sharedMetricId;
    var MetricsViewController = (function () {
        function MetricsViewController($scope, $rootScope, $interval, $log, HawkularMetric, HawkularInventory, startTimeStamp, endTimeStamp, dateRange) {
            var _this = this;
            this.$scope = $scope;
            this.$rootScope = $rootScope;
            this.$interval = $interval;
            this.$log = $log;
            this.HawkularMetric = HawkularMetric;
            this.HawkularInventory = HawkularInventory;
            this.startTimeStamp = startTimeStamp;
            this.endTimeStamp = endTimeStamp;
            this.dateRange = dateRange;
            this.bucketedDataPoints = [];
            this.contextDataPoints = [];
            this.isResponseTab = true;
            this.resourceList = [];
            $scope.vm = this;
            this.startTimeStamp = moment().subtract(1, 'hours').toDate();
            this.endTimeStamp = new Date();
            this.dateRange = moment(this.startTimeStamp).format('H:mm') + ' - ' + moment(this.endTimeStamp).format('H:mm') + ' (' + moment(this.endTimeStamp).from(moment(this.startTimeStamp), true) + ')';
            $scope.$on('RefreshChart', function (event) {
                $scope.vm.refreshChartDataNow(_this.getMetricId());
            });
            $scope.$watch('vm.selectedResource', function (resource) {
                if (angular.isUndefined(resource)) {
                    HawkularMetrics.globalResourceList = _this.HawkularInventory.Resource.query({ tenantId: HawkularMetrics.globalTenantId }).$promise.then(function (resources) {
                        _this.resourceList = resources;
                        _this.selectedResource = resources[resources.length - 1];
                        $scope.vm.refreshChartDataNow(_this.getMetricId());
                    });
                }
                else {
                    HawkularMetrics.globalResourceId = resource.id;
                    $scope.vm.refreshChartDataNow(_this.getMetricId());
                }
            });
            $scope.vm.onCreate();
        }
        MetricsViewController.prototype.onCreate = function () {
            this.autoRefresh(60);
            this.setupResourceList();
            this.resourceList = HawkularMetrics.globalResourceList;
            this.selectedResource = this.resourceList[this.resourceList.length - 1];
            this.refreshChartDataNow(this.getMetricId());
        };
        MetricsViewController.prototype.setupResourceList = function () {
            HawkularMetrics.globalResourceList = this.HawkularInventory.Resource.query({ tenantId: HawkularMetrics.globalTenantId });
            this.resourceList = HawkularMetrics.globalResourceList;
        };
        MetricsViewController.prototype.cancelAutoRefresh = function () {
            this.$interval.cancel(this.autoRefreshPromise);
            toastr.info('Canceling Auto Refresh');
        };
        MetricsViewController.prototype.autoRefresh = function (intervalInSeconds) {
            var _this = this;
            this.refreshHistoricalChartDataForTimestamp(this.getMetricId());
            this.autoRefreshPromise = this.$interval(function () {
                _this.endTimeStamp = new Date();
                _this.refreshHistoricalChartDataForTimestamp(_this.getMetricId());
            }, intervalInSeconds * 1000);
            this.$scope.$on('$destroy', function () {
                _this.$interval.cancel(_this.autoRefreshPromise);
            });
        };
        MetricsViewController.prototype.noDataFoundForId = function (id) {
            this.$log.warn('No Data found for id: ' + id);
        };
        MetricsViewController.calculatePreviousTimeRange = function (startDate, endDate) {
            var previousTimeRange = [];
            var intervalInMillis = endDate.getTime() - startDate.getTime();
            previousTimeRange.push(new Date(startDate.getTime() - intervalInMillis));
            previousTimeRange.push(startDate);
            return previousTimeRange;
        };
        MetricsViewController.prototype.showPreviousTimeRange = function () {
            var previousTimeRange = MetricsViewController.calculatePreviousTimeRange(this.startTimeStamp, this.endTimeStamp);
            this.startTimeStamp = previousTimeRange[0];
            this.endTimeStamp = previousTimeRange[1];
            this.refreshHistoricalChartData(this.getMetricId(), this.startTimeStamp, this.endTimeStamp);
        };
        MetricsViewController.calculateNextTimeRange = function (startDate, endDate) {
            var nextTimeRange = [];
            var intervalInMillis = endDate.getTime() - startDate.getTime();
            nextTimeRange.push(endDate);
            nextTimeRange.push(new Date(endDate.getTime() + intervalInMillis));
            return nextTimeRange;
        };
        MetricsViewController.prototype.showNextTimeRange = function () {
            var nextTimeRange = MetricsViewController.calculateNextTimeRange(this.startTimeStamp, this.endTimeStamp);
            this.startTimeStamp = nextTimeRange[0];
            this.endTimeStamp = nextTimeRange[1];
            this.refreshHistoricalChartData(this.getMetricId(), this.startTimeStamp, this.endTimeStamp);
        };
        MetricsViewController.prototype.hasNext = function () {
            var nextTimeRange = MetricsViewController.calculateNextTimeRange(this.startTimeStamp, this.endTimeStamp);
            return nextTimeRange[1].getTime() < new Date().getTime();
        };
        MetricsViewController.prototype.refreshChartDataNow = function (metricId, startTime) {
            var adjStartTimeStamp = moment().subtract('hours', 1).toDate();
            this.endTimeStamp = new Date();
            this.refreshHistoricalChartData(metricId, angular.isUndefined(startTime) ? adjStartTimeStamp : startTime, this.endTimeStamp);
        };
        MetricsViewController.prototype.refreshHistoricalChartData = function (metricId, startDate, endDate) {
            this.refreshHistoricalChartDataForTimestamp(metricId, startDate.getTime(), endDate.getTime());
        };
        MetricsViewController.prototype.getMetricId = function () {
            var metricId = this.isResponseTab ? this.getResourceDurationMetricId() : this.getResourceCodeMetricId();
            sharedMetricId = metricId;
            return metricId;
        };
        MetricsViewController.prototype.getResourceDurationMetricId = function () {
            return HawkularMetrics.globalResourceId + '.status.duration';
        };
        MetricsViewController.prototype.getResourceCodeMetricId = function () {
            return HawkularMetrics.globalResourceId + '.status.code';
        };
        MetricsViewController.prototype.refreshHistoricalChartDataForTimestamp = function (metricId, startTime, endTime) {
            var _this = this;
            if (angular.isUndefined(endTime)) {
                endTime = this.endTimeStamp.getTime();
            }
            if (angular.isUndefined(startTime)) {
                startTime = this.startTimeStamp.getTime();
            }
            this.HawkularMetric.NumericMetricData.queryMetrics({
                tenantId: HawkularMetrics.globalTenantId,
                numericId: metricId,
                start: startTime,
                end: endTime,
                buckets: 60
            }).$promise.then(function (response) {
                _this.bucketedDataPoints = _this.formatBucketedChartOutput(response);
                console.dir(_this.bucketedDataPoints);
                if (_this.bucketedDataPoints.length !== 0) {
                    _this.chartData = {
                        id: metricId,
                        startTimeStamp: _this.startTimeStamp,
                        endTimeStamp: _this.endTimeStamp,
                        dataPoints: _this.bucketedDataPoints,
                        contextDataPoints: _this.contextDataPoints,
                        annotationDataPoints: []
                    };
                }
                else {
                    _this.noDataFoundForId(_this.getMetricId());
                }
            }, function (error) {
                toastr.error('Error Loading Chart Data: ' + error);
            });
        };
        MetricsViewController.prototype.formatBucketedChartOutput = function (response) {
            return _.map(response.data, function (point) {
                return {
                    timestamp: point.timestamp,
                    date: new Date(point.timestamp),
                    value: !angular.isNumber(point.value) ? 0 : point.value,
                    avg: (point.empty) ? 0 : point.avg,
                    min: !angular.isNumber(point.min) ? 0 : point.min,
                    max: !angular.isNumber(point.max) ? 0 : point.max,
                    empty: point.empty
                };
            });
        };
        MetricsViewController.$inject = ['$scope', '$rootScope', '$interval', '$log', 'HawkularMetric', 'HawkularInventory'];
        return MetricsViewController;
    })();
    HawkularMetrics.MetricsViewController = MetricsViewController;
    HawkularMetrics._module.controller('MetricsViewController', MetricsViewController);
    var QuickAlertController = (function () {
        function QuickAlertController($scope, HawkularAlert) {
            this.$scope = $scope;
            this.HawkularAlert = HawkularAlert;
            this.$scope.showQuickAlert = false;
            this.$scope.quickTrigger = {
                operator: 'LT',
                threshold: 0
            };
            this.allNotifiers();
            console.log('Notifiers: ' + this.$scope.notifiers);
        }
        QuickAlertController.prototype.toggleQuickAlert = function () {
            this.$scope.showQuickAlert = !this.$scope.showQuickAlert;
        };
        QuickAlertController.prototype.allNotifiers = function () {
            var _this = this;
            this.$scope.notifiers = [];
            this.HawkularAlert.Notifier.query(function (result) {
                _this.$scope.notifiers = result;
            }, function (error) {
                if (error.data.errorMsg) {
                    toastr.error(error.data.errorMsg);
                }
                else {
                    toastr.error('Error loading Alerts Notifiers: ' + error);
                }
            });
        };
        QuickAlertController.prototype.saveQuickAlert = function () {
            var _this = this;
            if (sharedMetricId !== '.status.duration' && sharedMetricId !== '.status.code') {
                var newTrigger = {};
                newTrigger.id = sharedMetricId + 'ResponseTime' + '-' + this.$scope.quickTrigger.operator + '-' + this.$scope.quickTrigger.threshold;
                newTrigger.name = newTrigger.id;
                newTrigger.description = 'Created on ' + new Date();
                newTrigger.match = 'ALL';
                newTrigger.enabled = true;
                newTrigger.notifiers = this.$scope.quickTrigger.notifiers;
                var newDampening = {
                    triggerId: newTrigger.id,
                    type: 'RELAXED_COUNT',
                    evalTrueSetting: 1,
                    evalTotalSetting: 1,
                    evalTimeSetting: 0
                };
                this.HawkularAlert.Trigger.save(newTrigger, function (trigger) {
                    newDampening.triggerId = trigger.id;
                    _this.HawkularAlert.Dampening.save(newDampening, function (dampening) {
                        var newThresholdCondition = {
                            triggerId: newDampening.triggerId,
                            dataId: sharedMetricId,
                            conditionSetSize: 1,
                            conditionSetIndex: 1,
                            operator: _this.$scope.quickTrigger.operator,
                            threshold: _this.$scope.quickTrigger.threshold
                        };
                        _this.HawkularAlert['ThresholdCondition'].save(newThresholdCondition, function () {
                            _this.HawkularAlert.Alert.reload(function (errorReload) {
                                if (errorReload.data.errorMsg) {
                                    toastr.error(errorReload.data.errorMsg);
                                }
                                else {
                                    toastr.error('Error reloading alerts' + errorReload);
                                }
                            });
                            _this.toggleQuickAlert();
                        }, function (errorCondition) {
                            if (errorCondition.data.errorMsg) {
                                toastr.error(errorCondition.data.errorMsg);
                            }
                            else {
                                toastr.error('Error loading Saving Trigger Condition' + errorCondition);
                            }
                        });
                    }, function (errorDampening) {
                        if (errorDampening.data.errorMsg) {
                            toastr.error(errorDampening.data.errorMsg);
                        }
                        else {
                            toastr.error('Error loading Saving Trigger Dampening ' + errorDampening);
                        }
                    });
                }, function (error) {
                    if (error.data.errorMsg) {
                        toastr.error(error.data.errorMsg);
                    }
                    else {
                        toastr.error('Error loading Saving Trigger ' + error);
                    }
                });
            }
            else {
                toastr.warning('No metric selected');
            }
        };
        QuickAlertController.$inject = ['$scope', 'HawkularAlert'];
        return QuickAlertController;
    })();
    HawkularMetrics.QuickAlertController = QuickAlertController;
    HawkularMetrics._module.controller('QuickAlertController', QuickAlertController);
})(HawkularMetrics || (HawkularMetrics = {}));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLmpzIiwiL2hvbWUvdnJvY2thaS93b3Jrc3BhY2UvaGF3a3VsYXItdWktY29tcG9uZW50cy9tZXRyaWNzL3RzL21ldHJpY3NHbG9iYWxzLnRzIiwiL2hvbWUvdnJvY2thaS93b3Jrc3BhY2UvaGF3a3VsYXItdWktY29tcG9uZW50cy9tZXRyaWNzL3RzL21ldHJpY3NQbHVnaW4udHMiLCIvaG9tZS92cm9ja2FpL3dvcmtzcGFjZS9oYXdrdWxhci11aS1jb21wb25lbnRzL21ldHJpY3MvdHMvYWRkVXJsUGFnZS50cyIsIi9ob21lL3Zyb2NrYWkvd29ya3NwYWNlL2hhd2t1bGFyLXVpLWNvbXBvbmVudHMvbWV0cmljcy90cy9tZXRyaWNzUmVzcG9uc2VQYWdlLnRzIl0sIm5hbWVzIjpbIkhhd2t1bGFyTWV0cmljcyIsIkhhd2t1bGFyTWV0cmljcy5DaGFydFRpbWVSYW5nZSIsIkhhd2t1bGFyTWV0cmljcy5DaGFydFRpbWVSYW5nZS5jb25zdHJ1Y3RvciIsIkhhd2t1bGFyTWV0cmljcy5DaGFydFRpbWVSYW5nZS5pbml0IiwiSGF3a3VsYXJNZXRyaWNzLkNoYXJ0VGltZVJhbmdlLmdldFN0YXJ0RGF0ZSIsIkhhd2t1bGFyTWV0cmljcy5DaGFydFRpbWVSYW5nZS5nZXRFbmREYXRlIiwiSGF3a3VsYXJNZXRyaWNzLkNoYXJ0VGltZVJhbmdlLmdldEZvcm1hdHRlZFRpbWVSYW5nZSIsIkhhd2t1bGFyTWV0cmljcy5BZGRVcmxDb250cm9sbGVyIiwiSGF3a3VsYXJNZXRyaWNzLkFkZFVybENvbnRyb2xsZXIuY29uc3RydWN0b3IiLCJIYXdrdWxhck1ldHJpY3MuQWRkVXJsQ29udHJvbGxlci5hZGRVcmwiLCJIYXdrdWxhck1ldHJpY3MuTWV0cmljc1ZpZXdDb250cm9sbGVyIiwiSGF3a3VsYXJNZXRyaWNzLk1ldHJpY3NWaWV3Q29udHJvbGxlci5jb25zdHJ1Y3RvciIsIkhhd2t1bGFyTWV0cmljcy5NZXRyaWNzVmlld0NvbnRyb2xsZXIub25DcmVhdGUiLCJIYXdrdWxhck1ldHJpY3MuTWV0cmljc1ZpZXdDb250cm9sbGVyLnNldHVwUmVzb3VyY2VMaXN0IiwiSGF3a3VsYXJNZXRyaWNzLk1ldHJpY3NWaWV3Q29udHJvbGxlci5jYW5jZWxBdXRvUmVmcmVzaCIsIkhhd2t1bGFyTWV0cmljcy5NZXRyaWNzVmlld0NvbnRyb2xsZXIuYXV0b1JlZnJlc2giLCJIYXdrdWxhck1ldHJpY3MuTWV0cmljc1ZpZXdDb250cm9sbGVyLm5vRGF0YUZvdW5kRm9ySWQiLCJIYXdrdWxhck1ldHJpY3MuTWV0cmljc1ZpZXdDb250cm9sbGVyLmNhbGN1bGF0ZVByZXZpb3VzVGltZVJhbmdlIiwiSGF3a3VsYXJNZXRyaWNzLk1ldHJpY3NWaWV3Q29udHJvbGxlci5zaG93UHJldmlvdXNUaW1lUmFuZ2UiLCJIYXdrdWxhck1ldHJpY3MuTWV0cmljc1ZpZXdDb250cm9sbGVyLmNhbGN1bGF0ZU5leHRUaW1lUmFuZ2UiLCJIYXdrdWxhck1ldHJpY3MuTWV0cmljc1ZpZXdDb250cm9sbGVyLnNob3dOZXh0VGltZVJhbmdlIiwiSGF3a3VsYXJNZXRyaWNzLk1ldHJpY3NWaWV3Q29udHJvbGxlci5oYXNOZXh0IiwiSGF3a3VsYXJNZXRyaWNzLk1ldHJpY3NWaWV3Q29udHJvbGxlci5yZWZyZXNoQ2hhcnREYXRhTm93IiwiSGF3a3VsYXJNZXRyaWNzLk1ldHJpY3NWaWV3Q29udHJvbGxlci5yZWZyZXNoSGlzdG9yaWNhbENoYXJ0RGF0YSIsIkhhd2t1bGFyTWV0cmljcy5NZXRyaWNzVmlld0NvbnRyb2xsZXIuZ2V0TWV0cmljSWQiLCJIYXdrdWxhck1ldHJpY3MuTWV0cmljc1ZpZXdDb250cm9sbGVyLmdldFJlc291cmNlRHVyYXRpb25NZXRyaWNJZCIsIkhhd2t1bGFyTWV0cmljcy5NZXRyaWNzVmlld0NvbnRyb2xsZXIuZ2V0UmVzb3VyY2VDb2RlTWV0cmljSWQiLCJIYXdrdWxhck1ldHJpY3MuTWV0cmljc1ZpZXdDb250cm9sbGVyLnJlZnJlc2hIaXN0b3JpY2FsQ2hhcnREYXRhRm9yVGltZXN0YW1wIiwiSGF3a3VsYXJNZXRyaWNzLk1ldHJpY3NWaWV3Q29udHJvbGxlci5mb3JtYXRCdWNrZXRlZENoYXJ0T3V0cHV0Il0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FDZ0JBLElBQU8sZUFBZSxDQXVEckI7QUF2REQsV0FBTyxlQUFlLEVBQUMsQ0FBQztJQUdUQSwwQkFBVUEsR0FBR0Esa0JBQWtCQSxDQUFDQTtJQUVoQ0EsbUJBQUdBLEdBQWtCQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSwwQkFBVUEsQ0FBQ0EsQ0FBQ0E7SUFFNUNBLDRCQUFZQSxHQUFHQSxzQkFBc0JBLENBQUNBO0lBTXRDQSw4QkFBY0EsR0FBR0EsTUFBTUEsQ0FBQ0E7SUFFeEJBLGdDQUFnQkEsR0FBR0EsRUFBRUEsQ0FBQ0E7SUFDdEJBLGlDQUFpQkEsR0FBR0EsRUFBRUEsQ0FBQ0E7SUFFdkJBLGtDQUFrQkEsR0FBR0EsRUFBRUEsQ0FBQ0E7SUFFeEJBLG9DQUFtQ0EsQ0FBQ0E7SUFFL0NBLElBQWFBLGNBQWNBO1FBSXZCQyxTQUpTQSxjQUFjQSxDQUlIQSxzQkFBNkJBO1lBQTdCQywyQkFBc0JBLEdBQXRCQSxzQkFBc0JBLENBQU9BO1lBRTdDQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtRQUNoQkEsQ0FBQ0E7UUFFREQsNkJBQUlBLEdBQUpBO1lBQ0lFLElBQUlBLENBQUNBLFlBQVlBLEdBQUdBLE1BQU1BLEVBQUVBLENBQUNBLE9BQU9BLEVBQUVBLENBQUNBO1lBQ3ZDQSxJQUFJQSxDQUFDQSxjQUFjQSxHQUFHQSxNQUFNQSxFQUFFQSxDQUFDQSxRQUFRQSxDQUFDQSxNQUFNQSxFQUFFQSxJQUFJQSxDQUFDQSxzQkFBc0JBLENBQUNBLENBQUNBLE9BQU9BLEVBQUVBLENBQUNBO1FBQzNGQSxDQUFDQTtRQUVERixxQ0FBWUEsR0FBWkE7WUFDSUcsTUFBTUEsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsY0FBY0EsQ0FBQ0EsQ0FBQ0E7UUFDekNBLENBQUNBO1FBRURI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Q0EsR0FBR0EsS0FBS0EsQ0FBQ0EsR0FBR0E7b0JBQ2pEQSxLQUFLQSxFQUFFQSxLQUFLQSxDQUFDQSxLQUFLQTtpQkFDckJBLENBQUNBO1lBQ05BLENBQUNBLENBQUNBLENBQUNBO1FBQ1BBLENBQUNBO1FBek5jbEIsNkJBQU9BLEdBQUdBLENBQUNBLFFBQVFBLEVBQUVBLFlBQVlBLEVBQUVBLFdBQVdBLEVBQUVBLE1BQU1BLEVBQUVBLGdCQUFnQkEsRUFBRUEsbUJBQW1CQSxDQUFDQSxDQUFDQTtRQTJObEhBLDRCQUFDQTtJQUFEQSxDQTdOQVYsQUE2TkNVLElBQUFWO0lBN05ZQSxxQ0FBcUJBLEdBQXJCQSxxQkE2TlpBLENBQUFBO0lBRURBLHVCQUFPQSxDQUFDQSxVQUFVQSxDQUFDQSx1QkFBdUJBLEVBQUVBLHFCQUFxQkEsQ0FBQ0EsQ0FBQ0E7QUFFdkVBLENBQUNBLEVBM1BNLGVBQWUsS0FBZixlQUFlLFFBMlByQiIsImZpbGUiOiJjb21waWxlZC5qcyIsInNvdXJjZXNDb250ZW50IjpbbnVsbCwiLy8vIENvcHlyaWdodCAyMDE0LTIwMTUgUmVkIEhhdCwgSW5jLiBhbmQvb3IgaXRzIGFmZmlsaWF0ZXNcbi8vLyBhbmQgb3RoZXIgY29udHJpYnV0b3JzIGFzIGluZGljYXRlZCBieSB0aGUgQGF1dGhvciB0YWdzLlxuLy8vXG4vLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLy9cbi8vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8vXG4vLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9pbmNsdWRlcy50c1wiLz5cblxubW9kdWxlIEhhd2t1bGFyTWV0cmljcyB7XG5cbiAgICAvLy8gc29tZSBjb25maWcgdmFyc1xuICAgIGV4cG9ydCB2YXIgcGx1Z2luTmFtZSA9IFwiaGF3a3VsYXItbWV0cmljc1wiO1xuXG4gICAgZXhwb3J0IHZhciBsb2c6TG9nZ2luZy5Mb2dnZXIgPSBMb2dnZXIuZ2V0KHBsdWdpbk5hbWUpO1xuXG4gICAgZXhwb3J0IHZhciB0ZW1wbGF0ZVBhdGggPSBcInBsdWdpbnMvbWV0cmljcy9odG1sXCI7XG5cblxuICAgIC8vLyBUaGVzZSBhcmUgcGx1Z2luIGdsb2JhbHMgdXNlZCBhY3Jvc3Mgc2V2ZXJhbCBzY3JlZW5zICh0aGluayBzZXNzaW9uIHZhcnMgZnJvbSBzZXJ2ZXIgc2lkZSBwcm9ncmFtbWluZylcblxuICAgIC8vLyBAdG9kbzogdGhpcyB3aWxsIGdvIGF3YXkgb25jZSB3ZSBoYXZlIEtleUNsb2FrIGludGVncmF0aW9uXG4gICAgZXhwb3J0IHZhciBnbG9iYWxUZW5hbnRJZCA9IFwidGVzdFwiO1xuXG4gICAgZXhwb3J0IHZhciBnbG9iYWxSZXNvdXJjZUlkID0gXCJcIjtcbiAgICBleHBvcnQgdmFyIGdsb2JhbFJlc291cmNlVXJsID0gXCJcIjtcblxuICAgIGV4cG9ydCB2YXIgZ2xvYmFsUmVzb3VyY2VMaXN0ID0gW107XG5cbiAgICBleHBvcnQgdmFyIGdsb2JhbENoYXJ0VGltZVJhbmdlOkNoYXJ0VGltZVJhbmdlO1xuXG4gICAgZXhwb3J0IGNsYXNzIENoYXJ0VGltZVJhbmdlIHtcbiAgICAgICAgc3RhcnRUaW1lc3RhbXA6bnVtYmVyO1xuICAgICAgICBlbmRUaW1lc3RhbXA6bnVtYmVyO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgaW5pdGlhbEhvdXJzRGlmZmVyZW5jZTpudW1iZXIpIHtcbiAgICAgICAgICAgIC8vLyBqdXN0IHNldCBhIGRlZmF1bHQgaWYgbm8gY3RvcnMgZ2l2ZW5cbiAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5pdCgpIHtcbiAgICAgICAgICAgIHRoaXMuZW5kVGltZXN0YW1wID0gbW9tZW50KCkudmFsdWVPZigpO1xuICAgICAgICAgICAgdGhpcy5zdGFydFRpbWVzdGFtcCA9IG1vbWVudCgpLnN1YnRyYWN0KCdob3VyJywgdGhpcy5pbml0aWFsSG91cnNEaWZmZXJlbmNlKS52YWx1ZU9mKCk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXRTdGFydERhdGUoKTpEYXRlIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZSh0aGlzLnN0YXJ0VGltZXN0YW1wKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdldEVuZERhdGUoKTpEYXRlIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZSh0aGlzLmVuZFRpbWVzdGFtcCk7XG4gICAgICAgIH1cblxuICAgICAgICBnZXRGb3JtYXR0ZWRUaW1lUmFuZ2UoKTpzdHJpbmcge1xuICAgICAgICAgICAgLy8vQHRvZG86IGlmIGxlc3MgPCAyNCBociBzaG93IHRpbWVzIG90aGVyd2lzZSBkYXRlc1xuICAgICAgICAgICAgLy8vcmV0dXJuIG1vbWVudCh0aGlzLnN0YXJ0VGltZXN0YW1wKS5mb3JtYXQoJ01NTSBkbycpICsgJyAtICcgKyBtb21lbnQodGhpcy5lbmRUaW1lc3RhbXApLmZvcm1hdCgnTU1NIGRvJylcbiAgICAgICAgICAgIC8vLyBpZiB3aXRoaW4gNyBkYXlzXG4gICAgICAgICAgICAvL3JldHVybiBtb21lbnQodGhpcy5zdGFydFRpbWVzdGFtcCkuZm9ybWF0KCdkZGQsIGhBJykgKyAnIC0gJyArIG1vbWVudCh0aGlzLmVuZFRpbWVzdGFtcCkuZm9ybWF0KCdkZGQsIGhBJyk7XG4gICAgICAgICAgICAvLyBpZiB3aXRoaW4gMjQgaG91cnNcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQodGhpcy5zdGFydFRpbWVzdGFtcCkuZm9ybWF0KCdIOm1tJykgKyAnIC0gJyArIG1vbWVudCh0aGlzLmVuZFRpbWVzdGFtcCkuZm9ybWF0KCdIOm1tJylcbiAgICAgICAgICAgICAgICArICcgKCcgKyBtb21lbnQodGhpcy5lbmRUaW1lc3RhbXApLmZyb20obW9tZW50KHRoaXMuc3RhcnRUaW1lc3RhbXApLCB0cnVlKSArICcpJztcbiAgICAgICAgfVxuICAgIH1cblxufVxuIiwiLy8vIENvcHlyaWdodCAyMDE0LTIwMTUgUmVkIEhhdCwgSW5jLiBhbmQvb3IgaXRzIGFmZmlsaWF0ZXNcbi8vLyBhbmQgb3RoZXIgY29udHJpYnV0b3JzIGFzIGluZGljYXRlZCBieSB0aGUgQGF1dGhvciB0YWdzLlxuLy8vXG4vLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLy9cbi8vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8vXG4vLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9pbmNsdWRlcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJtZXRyaWNzR2xvYmFscy50c1wiLz5cblxubW9kdWxlIEhhd2t1bGFyTWV0cmljcyB7XG5cbiAgICBleHBvcnQgdmFyIF9tb2R1bGUgPSBhbmd1bGFyLm1vZHVsZShIYXdrdWxhck1ldHJpY3MucGx1Z2luTmFtZSwgWyduZ1Jlc291cmNlJywnaGF3a3VsYXJDaGFydHMnLCAnaGF3a3VsYXIuc2VydmljZXMnXSk7XG5cbiAgICB2YXIgbWV0cmljc1RhYjphbnk7XG5cbiAgICBfbW9kdWxlLmNvbmZpZyhbJyRodHRwUHJvdmlkZXInLCckbG9jYXRpb25Qcm92aWRlcicsICckcm91dGVQcm92aWRlcicsICdIYXd0aW9OYXZCdWlsZGVyUHJvdmlkZXInLCAoJGh0dHBQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICRyb3V0ZVByb3ZpZGVyOm5nLnJvdXRlLklSb3V0ZVByb3ZpZGVyLCBuYXZCdWlsZGVyOkhhd3Rpb01haW5OYXYuQnVpbGRlckZhY3RvcnkpID0+IHtcblxuICAgICAgICAvLy8gZW5hYmxlIENPUlNcbiAgICAgICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy51c2VYRG9tYWluID0gdHJ1ZTtcbiAgICAgICAgZGVsZXRlICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ1gtUmVxdWVzdGVkLVdpdGgnXTtcblxuICAgICAgICBtZXRyaWNzVGFiID0gbmF2QnVpbGRlci5jcmVhdGUoKVxuICAgICAgICAgICAgLmlkKEhhd2t1bGFyTWV0cmljcy5wbHVnaW5OYW1lKVxuICAgICAgICAgICAgLnRpdGxlKCgpID0+IFwiTWV0cmljc1wiKVxuICAgICAgICAgICAgLmhyZWYoKCkgPT4gXCIvbWV0cmljc1wiKVxuICAgICAgICAgICAgLnN1YlBhdGgoXCJBZGQgVXJsXCIsIFwiYWRkVXJsXCIsIG5hdkJ1aWxkZXIuam9pbihIYXdrdWxhck1ldHJpY3MudGVtcGxhdGVQYXRoLCAnYWRkLXVybC5odG1sJykpXG4gICAgICAgICAgICAvLy5zdWJQYXRoKFwiTWV0cmljcyBTZWxlY3Rpb25cIiwgXCJtZXRyaWNzU2VsZWN0aW9uXCIsIG5hdkJ1aWxkZXIuam9pbihIYXdrdWxhck1ldHJpY3MudGVtcGxhdGVQYXRoLCAnbWV0cmljcy1zZWxlY3Rpb24uaHRtbCcpKVxuICAgICAgICAgICAgLnN1YlBhdGgoXCJPdmVydmlld1wiLCBcIm92ZXJ2aWV3XCIsIG5hdkJ1aWxkZXIuam9pbihIYXdrdWxhck1ldHJpY3MudGVtcGxhdGVQYXRoLCAnb3ZlcnZpZXcuaHRtbCcpKVxuICAgICAgICAgICAgLnN1YlBhdGgoXCJNZXRyaWNzIFJlc3BvbnNlXCIsIFwibWV0cmljc1Jlc3BvbnNlXCIsIG5hdkJ1aWxkZXIuam9pbihIYXdrdWxhck1ldHJpY3MudGVtcGxhdGVQYXRoLCAnbWV0cmljcy1yZXNwb25zZS5odG1sJykpXG4gICAgICAgICAgICAuYnVpbGQoKTtcblxuICAgICAgICBuYXZCdWlsZGVyLmNvbmZpZ3VyZVJvdXRpbmcoJHJvdXRlUHJvdmlkZXIsIG1ldHJpY3NUYWIpO1xuXG4gICAgICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICB9XSk7XG5cbiAgICBfbW9kdWxlLnJ1bihbJ0hhd3Rpb05hdicsIChIYXd0aW9OYXY6SGF3dGlvTWFpbk5hdi5SZWdpc3RyeSkgPT4ge1xuICAgICAgICBIYXd0aW9OYXYuYWRkKG1ldHJpY3NUYWIpO1xuICAgICAgICBsb2cuZGVidWcoXCJsb2FkZWQgTWV0cmljcyBQbHVnaW5cIik7XG4gICAgfV0pO1xuXG4gICAgX21vZHVsZS5kaXJlY3RpdmUoJ25nRW50ZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICBlbGVtZW50LmJpbmQoXCJrZXlkb3duIGtleXByZXNzXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIGlmKGV2ZW50LndoaWNoID09PSAxMykge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoZnVuY3Rpb24gKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS4kZXZhbChhdHRycy5uZ0VudGVyKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9KTtcblxuXG4gICAgaGF3dGlvUGx1Z2luTG9hZGVyLmFkZE1vZHVsZShIYXdrdWxhck1ldHJpY3MucGx1Z2luTmFtZSk7XG59XG4iLCIvLy8gQ29weXJpZ2h0IDIwMTQtMjAxNSBSZWQgSGF0LCBJbmMuIGFuZC9vciBpdHMgYWZmaWxpYXRlc1xuLy8vIGFuZCBvdGhlciBjb250cmlidXRvcnMgYXMgaW5kaWNhdGVkIGJ5IHRoZSBAYXV0aG9yIHRhZ3MuXG4vLy9cbi8vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vL1xuLy8vICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLy9cbi8vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIm1ldHJpY3NQbHVnaW4udHNcIi8+XG5cbm1vZHVsZSBIYXdrdWxhck1ldHJpY3Mge1xuXG5cbiAgICBleHBvcnQgY2xhc3MgQWRkVXJsQ29udHJvbGxlciB7XG4gICAgICAgIC8vLyB0aGlzIGlzIGZvciBtaW5pZmljYXRpb24gcHVycG9zZXNcbiAgICAgICAgcHVibGljIHN0YXRpYyAkaW5qZWN0ID0gWyckbG9jYXRpb24nLCAnJHNjb3BlJywgJyRyb290U2NvcGUnLCAnJGxvZycsICdIYXdrdWxhckludmVudG9yeSddO1xuXG4gICAgICAgIHByaXZhdGUgaHR0cFVyaVBhcnQgPSAnaHR0cDovLyc7XG5cbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSAkbG9jYXRpb246bmcuSUxvY2F0aW9uU2VydmljZSxcbiAgICAgICAgICAgICAgICAgICAgcHJpdmF0ZSAkc2NvcGU6YW55LFxuICAgICAgICAgICAgICAgICAgICBwcml2YXRlICRyb290U2NvcGU6bmcuSVJvb3RTY29wZVNlcnZpY2UsXG4gICAgICAgICAgICAgICAgICAgIHByaXZhdGUgJGxvZzpuZy5JTG9nU2VydmljZSxcbiAgICAgICAgICAgICAgICAgICAgcHJpdmF0ZSBIYXdrdWxhckludmVudG9yeTphbnksXG4gICAgICAgICAgICAgICAgICAgIHB1YmxpYyByZXNvdXJjZVVybDpzdHJpbmcpIHtcbiAgICAgICAgICAgICRzY29wZS52bSA9IHRoaXM7XG4gICAgICAgICAgICB0aGlzLnJlc291cmNlVXJsID0gdGhpcy5odHRwVXJpUGFydDtcblxuICAgICAgICB9XG5cbiAgICAgICAgYWRkVXJsKHVybDpzdHJpbmcpOnZvaWQge1xuICAgICAgICAgICAgdmFyIHJlc291cmNlID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdVUkwnLFxuICAgICAgICAgICAgICAgIGlkOiAnJyxcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogdXJsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy4kbG9nLmluZm8oXCJBZGRpbmcgbmV3IFJlc291cmNlIFVybCB0byBIYXdrdWxhci1pbnZlbnRvcnk6IFwiICsgdXJsKTtcblxuICAgICAgICAgICAgZ2xvYmFsQ2hhcnRUaW1lUmFuZ2UgPSBuZXcgQ2hhcnRUaW1lUmFuZ2UoMSk7XG5cbiAgICAgICAgICAgIC8vLyBBZGQgdGhlIFJlc291cmNlXG4gICAgICAgICAgICB0aGlzLkhhd2t1bGFySW52ZW50b3J5LlJlc291cmNlLnNhdmUoe3RlbmFudElkOiBnbG9iYWxUZW5hbnRJZH0sIHJlc291cmNlKS4kcHJvbWlzZVxuICAgICAgICAgICAgICAgIC50aGVuKChuZXdSZXNvdXJjZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyB3ZSBub3cgaGF2ZSBhIHJlc291cmNlSWQgZnJvbSB0aGlzIGNhbGxcbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsUmVzb3VyY2VJZCA9IG5ld1Jlc291cmNlLmlkO1xuICAgICAgICAgICAgICAgICAgICBnbG9iYWxSZXNvdXJjZVVybCA9IHJlc291cmNlLnBhcmFtZXRlcnMudXJsO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRpcihuZXdSZXNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGxvZy5pbmZvKFwiTmV3IFJlc291cmNlIElEOiBcIiArIGdsb2JhbFJlc291cmNlSWQgKyBcIiBjcmVhdGVkIGZvciB1cmw6IFwiICsgZ2xvYmFsUmVzb3VyY2VVcmwpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWV0cmljcyA9IFt7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBnbG9iYWxSZXNvdXJjZUlkICsgJy5zdGF0dXMuZHVyYXRpb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgdW5pdDogJ01JTExJX1NFQ09ORCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Jlc3BvbnNlIFRpbWUgaW4gbXMuJ1xuICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBnbG9iYWxSZXNvdXJjZUlkICsgJy5zdGF0dXMuY29kZScsXG4gICAgICAgICAgICAgICAgICAgICAgICB1bml0OiAnTk9ORScsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1N0YXR1cyBDb2RlJ1xuICAgICAgICAgICAgICAgICAgICB9XTtcblxuXG4gICAgICAgICAgICAgICAgICAgIC8vLyBAdG9kbzogdGhpcyB3aWxsIGJlY29tZSB0aGUgJ01ldHJpY3MgU2VsZWN0aW9uJyBzY3JlZW4gb25jZSB3ZSBnZXQgdGhhdFxuICAgICAgICAgICAgICAgICAgICAvLy8gRm9yIHJpZ2h0IG5vdyB3ZSB3aWxsIGp1c3QgUmVnaXN0ZXIgYSBjb3VwbGUgb2YgbWV0cmljcyBhdXRvbWF0aWNhbGx5XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuSGF3a3VsYXJJbnZlbnRvcnkuTWV0cmljLnNhdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVuYW50SWQ6IGdsb2JhbFRlbmFudElkLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VJZDogbmV3UmVzb3VyY2UuaWRcbiAgICAgICAgICAgICAgICAgICAgfSwgbWV0cmljcykuJHByb21pc2UudGhlbigobmV3TWV0cmljcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvYXN0ci5pbmZvKFwiWW91ciBkYXRhIGlzIGJlaW5nIGNvbGxlY3RlZC4gUGxlYXNlIGJlIHBhdGllbnQgKHNob3VsZCBiZSBhYm91dCBhbm90aGVyIG1pbnV0ZSkuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBIb3Agb24gb3ZlciB0byB0aGUgbWV0cmljc1ZpZXcgcGFnZSBmb3IgY2hhcnRpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLiRsb2NhdGlvbi51cmwoXCIvbWV0cmljcy9tZXRyaWNzUmVzcG9uc2VcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9tb2R1bGUuY29udHJvbGxlcignSGF3a3VsYXJNZXRyaWNzLkFkZFVybENvbnRyb2xsZXInLCBBZGRVcmxDb250cm9sbGVyKTtcblxufVxuIiwiLy8vIENvcHlyaWdodCAyMDE0LTIwMTUgUmVkIEhhdCwgSW5jLiBhbmQvb3IgaXRzIGFmZmlsaWF0ZXNcbi8vLyBhbmQgb3RoZXIgY29udHJpYnV0b3JzIGFzIGluZGljYXRlZCBieSB0aGUgQGF1dGhvciB0YWdzLlxuLy8vXG4vLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLy9cbi8vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8vXG4vLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJtZXRyaWNzUGx1Z2luLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL2luY2x1ZGVzLnRzXCIvPlxuXG5tb2R1bGUgSGF3a3VsYXJNZXRyaWNzIHtcblxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSUNvbnRleHRDaGFydERhdGFQb2ludCB7XG4gICAgICAgIHRpbWVzdGFtcDogbnVtYmVyO1xuICAgICAgICB2YWx1ZTogbnVtYmVyO1xuICAgICAgICBhdmc6IG51bWJlcjtcbiAgICAgICAgZW1wdHk6IGJvb2xlYW47XG4gICAgfVxuXG4gICAgZXhwb3J0IGludGVyZmFjZSBJQ2hhcnREYXRhUG9pbnQgZXh0ZW5kcyBJQ29udGV4dENoYXJ0RGF0YVBvaW50IHtcbiAgICAgICAgZGF0ZTogRGF0ZTtcbiAgICAgICAgbWluOiBudW1iZXI7XG4gICAgICAgIG1heDogbnVtYmVyO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogQG5nZG9jIGNvbnRyb2xsZXJcbiAgICAgKiBAbmFtZSBDaGFydENvbnRyb2xsZXJcbiAgICAgKiBAZGVzY3JpcHRpb24gVGhpcyBjb250cm9sbGVyIGlzIHJlc3BvbnNpYmxlIGZvciBoYW5kbGluZyBhY3Rpdml0eSByZWxhdGVkIHRvIHRoZSBDaGFydCB0YWIuXG4gICAgICogQHBhcmFtICRzY29wZVxuICAgICAqIEBwYXJhbSAkcm9vdFNjb3BlXG4gICAgICogQHBhcmFtICRpbnRlcnZhbFxuICAgICAqIEBwYXJhbSAkbG9nXG4gICAgICogQHBhcmFtIG1ldHJpY0RhdGFTZXJ2aWNlXG4gICAgICovXG4gICAgZXhwb3J0IGNsYXNzIE1ldHJpY3NWaWV3Q29udHJvbGxlciB7XG4gICAgICAgIC8vLyBmb3IgbWluaWZpY2F0aW9uIG9ubHlcbiAgICAgICAgcHVibGljIHN0YXRpYyAgJGluamVjdCA9IFsnJHNjb3BlJywgJyRyb290U2NvcGUnLCAnJGludGVydmFsJywgJyRsb2cnLCAnSGF3a3VsYXJNZXRyaWMnLCAnSGF3a3VsYXJJbnZlbnRvcnknXTtcblxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlICRzY29wZTphbnksXG4gICAgICAgICAgICAgICAgICAgIHByaXZhdGUgJHJvb3RTY29wZTpuZy5JUm9vdFNjb3BlU2VydmljZSxcbiAgICAgICAgICAgICAgICAgICAgcHJpdmF0ZSAkaW50ZXJ2YWw6bmcuSUludGVydmFsU2VydmljZSxcbiAgICAgICAgICAgICAgICAgICAgcHJpdmF0ZSAkbG9nOm5nLklMb2dTZXJ2aWNlLFxuICAgICAgICAgICAgICAgICAgICBwcml2YXRlIEhhd2t1bGFyTWV0cmljOmFueSxcbiAgICAgICAgICAgICAgICAgICAgcHJpdmF0ZSBIYXdrdWxhckludmVudG9yeTphbnksXG4gICAgICAgICAgICAgICAgICAgIHB1YmxpYyBzdGFydFRpbWVTdGFtcDpEYXRlLFxuICAgICAgICAgICAgICAgICAgICBwdWJsaWMgZW5kVGltZVN0YW1wOkRhdGUsXG4gICAgICAgICAgICAgICAgICAgIHB1YmxpYyBkYXRlUmFuZ2U6c3RyaW5nKSB7XG4gICAgICAgICAgICAkc2NvcGUudm0gPSB0aGlzO1xuXG4gICAgICAgICAgICB0aGlzLnN0YXJ0VGltZVN0YW1wID0gbW9tZW50KCkuc3VidHJhY3QoMSwgJ2hvdXJzJykudG9EYXRlKCk7XG4gICAgICAgICAgICB0aGlzLmVuZFRpbWVTdGFtcCA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICB0aGlzLmRhdGVSYW5nZSA9IG1vbWVudCh0aGlzLnN0YXJ0VGltZVN0YW1wKS5mb3JtYXQoJ0g6bW0nKSArICcgLSAnICsgbW9tZW50KHRoaXMuZW5kVGltZVN0YW1wKS5mb3JtYXQoJ0g6bW0nKVxuICAgICAgICAgICAgKyAnICgnICsgbW9tZW50KHRoaXMuZW5kVGltZVN0YW1wKS5mcm9tKG1vbWVudCh0aGlzLnN0YXJ0VGltZVN0YW1wKSwgdHJ1ZSkgKyAnKSc7XG5cbiAgICAgICAgICAgICRzY29wZS4kb24oJ1JlZnJlc2hDaGFydCcsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS52bS5yZWZyZXNoQ2hhcnREYXRhTm93KHRoaXMuZ2V0TWV0cmljSWQoKSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJHNjb3BlLiR3YXRjaCgndm0uc2VsZWN0ZWRSZXNvdXJjZScsIChyZXNvdXJjZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzVW5kZWZpbmVkKHJlc291cmNlKSkge1xuICAgICAgICAgICAgICAgICAgICAvLy8gY2FzZSB3aGVuIGNvbWluZyBmcm9tIGFkZFVybCBzY3JlZW5cbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsUmVzb3VyY2VMaXN0ID0gdGhpcy5IYXdrdWxhckludmVudG9yeS5SZXNvdXJjZS5xdWVyeSh7dGVuYW50SWQ6IGdsb2JhbFRlbmFudElkfSkuJHByb21pc2UuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGVuKChyZXNvdXJjZXMpPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNvdXJjZUxpc3QgPSByZXNvdXJjZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkUmVzb3VyY2UgPSByZXNvdXJjZXNbcmVzb3VyY2VzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnZtLnJlZnJlc2hDaGFydERhdGFOb3codGhpcy5nZXRNZXRyaWNJZCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLy8gbWFkZSBhIHNlbGVjdGlvbiBmcm9tIHVybCBzd2l0Y2hlclxuICAgICAgICAgICAgICAgICAgICBnbG9iYWxSZXNvdXJjZUlkID0gcmVzb3VyY2UuaWQ7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS52bS5yZWZyZXNoQ2hhcnREYXRhTm93KHRoaXMuZ2V0TWV0cmljSWQoKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJHNjb3BlLnZtLm9uQ3JlYXRlKCk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgYnVja2V0ZWREYXRhUG9pbnRzOklDaGFydERhdGFQb2ludFtdID0gW107XG4gICAgICAgIHByaXZhdGUgY29udGV4dERhdGFQb2ludHM6SUNoYXJ0RGF0YVBvaW50W10gPSBbXTtcbiAgICAgICAgcHJpdmF0ZSBjaGFydERhdGE6YW55O1xuICAgICAgICBwcml2YXRlIGlzUmVzcG9uc2VUYWIgPSB0cnVlO1xuICAgICAgICBwcml2YXRlIGF1dG9SZWZyZXNoUHJvbWlzZTpuZy5JUHJvbWlzZTxudW1iZXI+O1xuXG4gICAgICAgIC8vLyBleHBvc2UgdGhpcyB0byB0aGUgVmlld1xuICAgICAgICByZXNvdXJjZUxpc3QgPSBbXTtcbiAgICAgICAgc2VsZWN0ZWRSZXNvdXJjZTtcblxuXG4gICAgICAgIHByaXZhdGUgb25DcmVhdGUoKSB7XG4gICAgICAgICAgICAvLy8gc2V0dXAgYXV0b3JlZnJlc2ggZm9yIGV2ZXJ5IG1pbnV0ZVxuICAgICAgICAgICAgdGhpcy5hdXRvUmVmcmVzaCg2MCk7XG4gICAgICAgICAgICB0aGlzLnNldHVwUmVzb3VyY2VMaXN0KCk7XG4gICAgICAgICAgICB0aGlzLnJlc291cmNlTGlzdCA9IGdsb2JhbFJlc291cmNlTGlzdDtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRSZXNvdXJjZSA9IHRoaXMucmVzb3VyY2VMaXN0W3RoaXMucmVzb3VyY2VMaXN0Lmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoQ2hhcnREYXRhTm93KHRoaXMuZ2V0TWV0cmljSWQoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXR1cFJlc291cmNlTGlzdCgpIHtcbiAgICAgICAgICAgIGdsb2JhbFJlc291cmNlTGlzdCA9IHRoaXMuSGF3a3VsYXJJbnZlbnRvcnkuUmVzb3VyY2UucXVlcnkoe3RlbmFudElkOiBnbG9iYWxUZW5hbnRJZH0pO1xuICAgICAgICAgICAgdGhpcy5yZXNvdXJjZUxpc3QgPSBnbG9iYWxSZXNvdXJjZUxpc3Q7XG4gICAgICAgIH1cblxuICAgICAgICBjYW5jZWxBdXRvUmVmcmVzaCgpOnZvaWQge1xuICAgICAgICAgICAgdGhpcy4kaW50ZXJ2YWwuY2FuY2VsKHRoaXMuYXV0b1JlZnJlc2hQcm9taXNlKTtcbiAgICAgICAgICAgIHRvYXN0ci5pbmZvKCdDYW5jZWxpbmcgQXV0byBSZWZyZXNoJyk7XG4gICAgICAgIH1cblxuICAgICAgICBhdXRvUmVmcmVzaChpbnRlcnZhbEluU2Vjb25kczpudW1iZXIpOnZvaWQge1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoSGlzdG9yaWNhbENoYXJ0RGF0YUZvclRpbWVzdGFtcCh0aGlzLmdldE1ldHJpY0lkKCkpO1xuICAgICAgICAgICAgdGhpcy5hdXRvUmVmcmVzaFByb21pc2UgPSB0aGlzLiRpbnRlcnZhbCgoKSAgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZW5kVGltZVN0YW1wID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZnJlc2hIaXN0b3JpY2FsQ2hhcnREYXRhRm9yVGltZXN0YW1wKHRoaXMuZ2V0TWV0cmljSWQoKSk7XG4gICAgICAgICAgICB9LCBpbnRlcnZhbEluU2Vjb25kcyAqIDEwMDApO1xuXG4gICAgICAgICAgICB0aGlzLiRzY29wZS4kb24oJyRkZXN0cm95JywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuJGludGVydmFsLmNhbmNlbCh0aGlzLmF1dG9SZWZyZXNoUHJvbWlzZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgbm9EYXRhRm91bmRGb3JJZChpZDpzdHJpbmcpOnZvaWQge1xuICAgICAgICAgICAgdGhpcy4kbG9nLndhcm4oJ05vIERhdGEgZm91bmQgZm9yIGlkOiAnICsgaWQpO1xuICAgICAgICAgICAgLy8vdG9hc3RyLndhcm5pbmcoJ05vIERhdGEgZm91bmQgZm9yIGlkOiAnICsgaWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgY2FsY3VsYXRlUHJldmlvdXNUaW1lUmFuZ2Uoc3RhcnREYXRlOkRhdGUsIGVuZERhdGU6RGF0ZSk6YW55IHtcbiAgICAgICAgICAgIHZhciBwcmV2aW91c1RpbWVSYW5nZTpEYXRlW10gPSBbXTtcbiAgICAgICAgICAgIHZhciBpbnRlcnZhbEluTWlsbGlzID0gZW5kRGF0ZS5nZXRUaW1lKCkgLSBzdGFydERhdGUuZ2V0VGltZSgpO1xuXG4gICAgICAgICAgICBwcmV2aW91c1RpbWVSYW5nZS5wdXNoKG5ldyBEYXRlKHN0YXJ0RGF0ZS5nZXRUaW1lKCkgLSBpbnRlcnZhbEluTWlsbGlzKSk7XG4gICAgICAgICAgICBwcmV2aW91c1RpbWVSYW5nZS5wdXNoKHN0YXJ0RGF0ZSk7XG4gICAgICAgICAgICByZXR1cm4gcHJldmlvdXNUaW1lUmFuZ2U7XG4gICAgICAgIH1cblxuICAgICAgICBzaG93UHJldmlvdXNUaW1lUmFuZ2UoKTp2b2lkIHtcbiAgICAgICAgICAgIHZhciBwcmV2aW91c1RpbWVSYW5nZSA9IE1ldHJpY3NWaWV3Q29udHJvbGxlci5jYWxjdWxhdGVQcmV2aW91c1RpbWVSYW5nZSh0aGlzLnN0YXJ0VGltZVN0YW1wLCB0aGlzLmVuZFRpbWVTdGFtcCk7XG5cbiAgICAgICAgICAgIHRoaXMuc3RhcnRUaW1lU3RhbXAgPSBwcmV2aW91c1RpbWVSYW5nZVswXTtcbiAgICAgICAgICAgIHRoaXMuZW5kVGltZVN0YW1wID0gcHJldmlvdXNUaW1lUmFuZ2VbMV07XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hIaXN0b3JpY2FsQ2hhcnREYXRhKHRoaXMuZ2V0TWV0cmljSWQoKSwgdGhpcy5zdGFydFRpbWVTdGFtcCwgdGhpcy5lbmRUaW1lU3RhbXApO1xuXG4gICAgICAgIH1cblxuXG4gICAgICAgIHByaXZhdGUgc3RhdGljIGNhbGN1bGF0ZU5leHRUaW1lUmFuZ2Uoc3RhcnREYXRlOkRhdGUsIGVuZERhdGU6RGF0ZSk6YW55IHtcbiAgICAgICAgICAgIHZhciBuZXh0VGltZVJhbmdlID0gW107XG4gICAgICAgICAgICB2YXIgaW50ZXJ2YWxJbk1pbGxpcyA9IGVuZERhdGUuZ2V0VGltZSgpIC0gc3RhcnREYXRlLmdldFRpbWUoKTtcblxuICAgICAgICAgICAgbmV4dFRpbWVSYW5nZS5wdXNoKGVuZERhdGUpO1xuICAgICAgICAgICAgbmV4dFRpbWVSYW5nZS5wdXNoKG5ldyBEYXRlKGVuZERhdGUuZ2V0VGltZSgpICsgaW50ZXJ2YWxJbk1pbGxpcykpO1xuICAgICAgICAgICAgcmV0dXJuIG5leHRUaW1lUmFuZ2U7XG4gICAgICAgIH1cblxuXG4gICAgICAgIHNob3dOZXh0VGltZVJhbmdlKCk6dm9pZCB7XG4gICAgICAgICAgICB2YXIgbmV4dFRpbWVSYW5nZSA9IE1ldHJpY3NWaWV3Q29udHJvbGxlci5jYWxjdWxhdGVOZXh0VGltZVJhbmdlKHRoaXMuc3RhcnRUaW1lU3RhbXAsIHRoaXMuZW5kVGltZVN0YW1wKTtcblxuICAgICAgICAgICAgdGhpcy5zdGFydFRpbWVTdGFtcCA9IG5leHRUaW1lUmFuZ2VbMF07XG4gICAgICAgICAgICB0aGlzLmVuZFRpbWVTdGFtcCA9IG5leHRUaW1lUmFuZ2VbMV07XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hIaXN0b3JpY2FsQ2hhcnREYXRhKHRoaXMuZ2V0TWV0cmljSWQoKSwgdGhpcy5zdGFydFRpbWVTdGFtcCwgdGhpcy5lbmRUaW1lU3RhbXApO1xuXG4gICAgICAgIH1cblxuXG4gICAgICAgIGhhc05leHQoKTpib29sZWFuIHtcbiAgICAgICAgICAgIHZhciBuZXh0VGltZVJhbmdlID0gTWV0cmljc1ZpZXdDb250cm9sbGVyLmNhbGN1bGF0ZU5leHRUaW1lUmFuZ2UodGhpcy5zdGFydFRpbWVTdGFtcCwgdGhpcy5lbmRUaW1lU3RhbXApO1xuICAgICAgICAgICAgLy8gdW5zb3BoaXN0aWNhdGVkIHRlc3QgdG8gc2VlIGlmIHRoZXJlIGlzIGEgbmV4dDsgd2l0aG91dCBhY3R1YWxseSBxdWVyeWluZy5cblxuICAgICAgICAgICAgLy9AZml4bWU6IHBheSB0aGUgcHJpY2UsIGRvIHRoZSBxdWVyeSFcbiAgICAgICAgICAgIHJldHVybiBuZXh0VGltZVJhbmdlWzFdLmdldFRpbWUoKSA8IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICB9XG5cblxuICAgICAgICByZWZyZXNoQ2hhcnREYXRhTm93KG1ldHJpY0lkOnN0cmluZywgc3RhcnRUaW1lPzpEYXRlKTp2b2lkIHtcbiAgICAgICAgICAgIHZhciBhZGpTdGFydFRpbWVTdGFtcDpEYXRlID0gbW9tZW50KCkuc3VidHJhY3QoJ2hvdXJzJywgMSkudG9EYXRlKCk7IC8vZGVmYXVsdCB0aW1lIHBlcmlvZCBzZXQgdG8gMjQgaG91cnNcbiAgICAgICAgICAgIC8vdGhpcy4kcm9vdFNjb3BlLiRicm9hZGNhc3QoJ011bHRpQ2hhcnRPdmVybGF5RGF0YUNoYW5nZWQnKTtcbiAgICAgICAgICAgIHRoaXMuZW5kVGltZVN0YW1wID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaEhpc3RvcmljYWxDaGFydERhdGEobWV0cmljSWQsIGFuZ3VsYXIuaXNVbmRlZmluZWQoc3RhcnRUaW1lKSA/IGFkalN0YXJ0VGltZVN0YW1wIDogc3RhcnRUaW1lLCB0aGlzLmVuZFRpbWVTdGFtcCk7XG4gICAgICAgIH1cblxuICAgICAgICByZWZyZXNoSGlzdG9yaWNhbENoYXJ0RGF0YShtZXRyaWNJZDpzdHJpbmcsIHN0YXJ0RGF0ZTpEYXRlLCBlbmREYXRlOkRhdGUpOnZvaWQge1xuICAgICAgICAgICAgdGhpcy5yZWZyZXNoSGlzdG9yaWNhbENoYXJ0RGF0YUZvclRpbWVzdGFtcChtZXRyaWNJZCwgc3RhcnREYXRlLmdldFRpbWUoKSwgZW5kRGF0ZS5nZXRUaW1lKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0TWV0cmljSWQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pc1Jlc3BvbnNlVGFiID8gdGhpcy5nZXRSZXNvdXJjZUR1cmF0aW9uTWV0cmljSWQoKSA6IHRoaXMuZ2V0UmVzb3VyY2VDb2RlTWV0cmljSWQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgZ2V0UmVzb3VyY2VEdXJhdGlvbk1ldHJpY0lkKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdsb2JhbFJlc291cmNlSWQgKyAnLnN0YXR1cy5kdXJhdGlvbic7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGdldFJlc291cmNlQ29kZU1ldHJpY0lkKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdsb2JhbFJlc291cmNlSWQgKyAnLnN0YXR1cy5jb2RlJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJlZnJlc2hIaXN0b3JpY2FsQ2hhcnREYXRhRm9yVGltZXN0YW1wKG1ldHJpY0lkOnN0cmluZywgc3RhcnRUaW1lPzpudW1iZXIsIGVuZFRpbWU/Om51bWJlcik6dm9pZCB7XG4gICAgICAgICAgICAvLyBjYWxsaW5nIHJlZnJlc2hDaGFydERhdGEgd2l0aG91dCBwYXJhbXMgdXNlIHRoZSBtb2RlbCB2YWx1ZXNcbiAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzVW5kZWZpbmVkKGVuZFRpbWUpKSB7XG4gICAgICAgICAgICAgICAgZW5kVGltZSA9IHRoaXMuZW5kVGltZVN0YW1wLmdldFRpbWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhbmd1bGFyLmlzVW5kZWZpbmVkKHN0YXJ0VGltZSkpIHtcbiAgICAgICAgICAgICAgICBzdGFydFRpbWUgPSB0aGlzLnN0YXJ0VGltZVN0YW1wLmdldFRpbWUoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5IYXdrdWxhck1ldHJpYy5OdW1lcmljTWV0cmljRGF0YS5xdWVyeU1ldHJpY3Moe1xuICAgICAgICAgICAgICAgIHRlbmFudElkOiBnbG9iYWxUZW5hbnRJZCxcbiAgICAgICAgICAgICAgICBudW1lcmljSWQ6IG1ldHJpY0lkLFxuICAgICAgICAgICAgICAgIHN0YXJ0OiBzdGFydFRpbWUsXG4gICAgICAgICAgICAgICAgZW5kOiBlbmRUaW1lLFxuICAgICAgICAgICAgICAgIGJ1Y2tldHM6IDYwXG4gICAgICAgICAgICB9KS4kcHJvbWlzZVxuICAgICAgICAgICAgICAgIC50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyB3ZSB3YW50IHRvIGlzb2xhdGUgdGhlIHJlc3BvbnNlIGZyb20gdGhlIGRhdGEgd2UgYXJlIGZlZWRpbmcgdG8gdGhlIGNoYXJ0XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYnVja2V0ZWREYXRhUG9pbnRzID0gdGhpcy5mb3JtYXRCdWNrZXRlZENoYXJ0T3V0cHV0KHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kaXIodGhpcy5idWNrZXRlZERhdGFQb2ludHMpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmJ1Y2tldGVkRGF0YVBvaW50cy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgaXMgYmFzaWNhbGx5IHRoZSBEVE8gZm9yIHRoZSBjaGFydFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGFydERhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IG1ldHJpY0lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VGltZVN0YW1wOiB0aGlzLnN0YXJ0VGltZVN0YW1wLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFRpbWVTdGFtcDogdGhpcy5lbmRUaW1lU3RhbXAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVBvaW50czogdGhpcy5idWNrZXRlZERhdGFQb2ludHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dERhdGFQb2ludHM6IHRoaXMuY29udGV4dERhdGFQb2ludHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5ub3RhdGlvbkRhdGFQb2ludHM6IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5vRGF0YUZvdW5kRm9ySWQodGhpcy5nZXRNZXRyaWNJZCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfSwgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRvYXN0ci5lcnJvcignRXJyb3IgTG9hZGluZyBDaGFydCBEYXRhOiAnICsgZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGZvcm1hdEJ1Y2tldGVkQ2hhcnRPdXRwdXQocmVzcG9uc2UpOklDaGFydERhdGFQb2ludFtdIHtcbiAgICAgICAgICAgIC8vICBUaGUgc2NoZW1hIGlzIGRpZmZlcmVudCBmb3IgYnVja2V0ZWQgb3V0cHV0XG4gICAgICAgICAgICByZXR1cm4gXy5tYXAocmVzcG9uc2UuZGF0YSwgKHBvaW50OklDaGFydERhdGFQb2ludCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogcG9pbnQudGltZXN0YW1wLFxuICAgICAgICAgICAgICAgICAgICBkYXRlOiBuZXcgRGF0ZShwb2ludC50aW1lc3RhbXApLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogIWFuZ3VsYXIuaXNOdW1iZXIocG9pbnQudmFsdWUpID8gMCA6IHBvaW50LnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBhdmc6IChwb2ludC5lbXB0eSkgPyAwIDogcG9pbnQuYXZnLFxuICAgICAgICAgICAgICAgICAgICBtaW46ICFhbmd1bGFyLmlzTnVtYmVyKHBvaW50Lm1pbikgPyAwIDogcG9pbnQubWluLFxuICAgICAgICAgICAgICAgICAgICBtYXg6ICFhbmd1bGFyLmlzTnVtYmVyKHBvaW50Lm1heCkgPyAwIDogcG9pbnQubWF4LFxuICAgICAgICAgICAgICAgICAgICBlbXB0eTogcG9pbnQuZW1wdHlcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIF9tb2R1bGUuY29udHJvbGxlcignTWV0cmljc1ZpZXdDb250cm9sbGVyJywgTWV0cmljc1ZpZXdDb250cm9sbGVyKTtcblxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
angular.module("hawkular-ui-components-metrics-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("plugins/metrics/html/add-url.html","<div class=\"row\" ng-controller=\"HawkularMetrics.AddUrlController\" style=\"margin-left: 10px;\">\n\n    <h2>Collect metrics from a website that you want to monitor.</h2>\n\n    <form class=\"form-horizontal\" name=\"addUrlForm\" role=\"form\" novalidate>\n        <div class=\"form-group input\">\n            <div class=\"col-lg-6 col-sm-8 col-xs-12 align-center\">\n                <div class=\"input-group\">\n                    <input type=\"url\" class=\"form-control input-lg\" name=\"resourceUrl\" ng-model=\"vm.resourceUrl\"\n                           ng-model-options=\"{ updateOn: \'default blur\'}\"\n                           ng-enter=\"vm.addUrl(vm.resourceUrl)\"\n                           placeholder=\"Enter a website URL (e.g., http://mysite.com/home)\" required >\n                      <span class=\"error-message\"\n                            ng-show=\"addUrlForm.resourceUrl.$dirty && addUrlForm.resourceUrl.$error.required\">The URL you entered is not valid. Please enter a valid URL.</span>\n\n              <span class=\"input-group-btn\">\n                <button class=\"btn btn-primary btn-lg\" type=\"button\" ng-disabled=\"!addUrlForm.$valid\"\n                        ng-click=\"vm.addUrl(vm.resourceUrl)\">Get Metrics\n                </button>\n              </span>\n                </div>\n            </div>\n        </div>\n    </form>\n</div>\n");
$templateCache.put("plugins/metrics/html/metrics-response.html","<div ng-controller=\"MetricsViewController as vm\">\n\n    <div class=\"col-sm-9 col-md-10 content\">\n\n        <div class=\"well\">\n            <span class=\"col-md-3 col-sm-4\" style=\"margin:-10px 0 0 -20px;\">\n                <select class=\"form-control input-sm\" ng-model=\"vm.selectedResource\"\n                        ng-options=\"rs.parameters.url for rs in vm.resourceList\" style=\"width:100%;\"></select>\n            </span>\n            <span class=\"col-md-3 col-sm-2 pull-right\" style=\"margin:-10px;\">\n                <span class=\"input-group input-group-sm\" style=\"width:100%;\">\n                    <input type=\"text\" class=\"form-control input-sm\" value=\"{{vm.dateRange}}\" readonly>\n                </span>\n            </span>\n        </div>\n        <h1>Response Time</h1>\n\n        <p class=\"update-info pull-right\"><i class=\"fa fa-refresh\"></i>\n            <a ng-click=\"vm.refreshChartDataNow(vm.getMetricId())\">Last update 1 minutes ago</a>\n        </p>\n        <ul class=\"nav nav-tabs nav-tabs-pf\">\n            <li class=\"active\"><a href=\"#\">Response Time</a></li>\n            <li><a href=\"#\">Responsiveness</a></li>\n        </ul>\n        <div style=\"width:800px;\" ng-switch=\"vm.chartData.dataPoints.length > 1\">\n            <p class=\"label label-info\" ng-switch-when=\"false\" style=\"margin-bottom: 25px;\">We are collecting your\n                initial data. Please be patient(could be up to a minute)...</p>\n\n            <div id=\"stackedBarChart\" style=\"height:270px\" ng-switch-when=\"true\">\n                <!-- HINT: colors for the chart can be changed in the hawkular-charts.css -->\n                <hawkular-chart\n                        data=\"{{vm.chartData.dataPoints}}\"\n                        chart-type=\"line\"\n                        show-avg-line=\"false\"\n                        hide-high-low-values=\"true\"\n                        y-axis-units=\"Response time (ms)\"\n                        chart-title=\"Monitored Resource: {{vm.selectedResource.parameters.url}}\"\n                        chart-height=\"250\">\n                </hawkular-chart>\n            </div>\n            <!--\n            <div style=\"margin-top: 30px;\">\n                <button class=\"btn btn-sm\" ng-click=\"vm.showPreviousTimeRange()\" style=\"margin-left:90px;\"\n                        ng-show=\"vm.chartData.dataPoints.length > 2\">&lt;&lt; Prev.\n                </button>\n                <button class=\"btn btn-sm\" style=\"float:right;margin-right: 50px;\" ng-click=\"vm.showNextTimeRange()\"\n                        ng-show=\"vm.chartData.dataPoints.length > 2\" ng-disabled=\"!vm.hasNext();\">Next &gt;&gt;</button>\n            </div>\n            <br/>\n            -->\n        </div>\n\n    </div>\n\n    <div ng-controller=\"QuickAlertController as qac\" ng-show=\"vm.chartData.dataPoints.length > 1\">\n        <div ng-if=\"!showQuickAlert\" class=\"col-sm-9 col-md-10 content\">\n            <button class=\"btn btn-primary\" ng-click=\"qac.toggleQuickAlert()\">Add an Alert</button>\n        </div>\n        <div ng-if=\"showQuickAlert\" class=\"col-sm-9 col-md-10 content\">\n            <h1>Add an Alert</h1>\n\n            <form class=\"form-horizontal\" name=\"addQuickAlertForm\" role=\"form\">\n                <div class=\"form-group\">\n                    <label class=\"col-md-4 control-label\">\n                        Fire when metric is\n                    </label>\n\n                    <div class=\"col-md-6\">\n                        <label class=\"radio-inline\">\n                            <input type=\"radio\" ng-model=\"quickTrigger.operator\" class=\"radio\" value=\"LT\"> <\n                        </label>\n                        <label class=\"radio-inline\">\n                            <input type=\"radio\" ng-model=\"quickTrigger.operator\" class=\"radio\" value=\"GT\"> >\n                        </label>\n                        <label class=\"radio-inline\">\n                            <input type=\"radio\" ng-model=\"quickTrigger.operator\" class=\"radio\" value=\"LTE\"> <=\n                        </label>\n                        <label class=\"radio-inline\">\n                            <input type=\"radio\" ng-model=\"quickTrigger.operator\" class=\"radio\" value=\"GTE\"> >=\n                        </label>\n                    </div>\n                </div>\n                <div class=\"form-group\">\n                    <label class=\"col-md-4 control-label\" for=\"threshold\">\n                        Of threshold\n                    </label>\n\n                    <div class=\"col-md-6\">\n                        <input type=\"number\" id=\"threshold\" ng-model=\"quickTrigger.threshold\" class=\"form-control\"\n                               ng-minlength=\"1\" required>\n                    </div>\n                </div>\n                <div class=\"form-group\">\n                    <label class=\"col-md-4 control-label\" for=\"notifiers\">\n                        Notify to:\n                    </label>\n\n                    <div class=\"col-md-6\">\n                        <ui-select id=\"notifiers\" multiple ng-model=\"quickTrigger.notifiers\" theme=\"bootstrap\"\n                                   ng-disabled=\"disabled\" close-on-select=\"false\">\n                            <ui-select-match placeholder=\"Select notifier...\">{{$item}}</ui-select-match>\n                            <ui-select-choices repeat=\"notifier in notifiers | filter:$select.search\">\n                                {{ notifier }}\n                            </ui-select-choices>\n                        </ui-select>\n                    </div>\n                </div>\n                <div class=\"form-group\">\n                    <div class=\"col-md-offset-4 col-md-6\">\n                        <button class=\"btn btn-primary\" ng-click=\"qac.saveQuickAlert()\">Create Alert</button>\n                        <button type=\"button\" class=\"btn btn-default\" ng-click=\"qac.toggleQuickAlert()\">Cancel</button>\n                    </div>\n                </div>\n            </form>\n        </div>\n    </div>\n\n</div>\n\n\n");
$templateCache.put("plugins/metrics/html/overview.html","<div class=\"row\" ng-controller=\"HawkularMetrics.OverviewController as vm\">\n    <div class=\"col-md-12\">\n        <h1>TBD: Metrics Overview</h1>\n    </div>\n</div>\n");}]); hawtioPluginLoader.addModule("hawkular-ui-components-metrics-templates");