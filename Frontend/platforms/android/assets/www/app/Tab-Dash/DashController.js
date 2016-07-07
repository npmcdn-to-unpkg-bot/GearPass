(function() {
    'use strict';
    angular.module('starter')

    // HOME PAGE CONTROLLER
    .controller('DashController', function($scope, $ionicModal, $state, $cordovaGeolocation, $ionicLoading, $compile, $cordovaLaunchNavigator, $cordovaInAppBrowser) {
        var map = null;
        $scope.shops = [];
        initMap();
        var markerPos = [];

        function initMap() {
            var options = { timeout: 10000, enableHighAccuracy: true };
            $cordovaGeolocation.getCurrentPosition(options).then(function(position) {
                var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                var mapOptions = {
                    center: latLng,
                    zoom: 11,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                $scope.map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
                //Wait till map is laoded
                google.maps.event.addListenerOnce($scope.map, 'idle', function() {
                    loadMarkers();
                });
            }, function(error) {
                content.log("Could not ger location");
                loadMarkers();
            });
        }

        function loadMarkers() {
            Parse.GeoPoint.current({
                success: function(point) {
                    var LatLng = [];
                    var avgLoc = [];
                    var contentString = [];
                    var query = new Parse.Query(Parse.Object.extend("Shop"));
                    // query.setLimit(3);
                    query.each(function(shop) {
                        $scope.newObj = {};
                        $scope.newObj.Name = shop.get('ShopName');
                        $scope.newObj.Location = shop.get('Location');
                        $scope.newObj.Numb = shop.get('PhoneNumber');
                        $scope.newObj.Address = shop.get('Address');
                        $scope.newObj.Web = shop.get('WebAddress');
                        $scope.newObj.Hrs = shop.get('Hours');
                        $scope.newObj.Email = shop.get('EmailAddress');
                        $scope.newObj.Rating = shop.get('Rating');
                        var location = $scope.newObj.Location;
                        $scope.newObj.Marker = new google.maps.LatLng(location._latitude, location._longitude).toString();
                        $scope.shops.push($scope.newObj);

                        console.log($scope.newObj.Rating);

                        var avg = $scope.newObj.Rating;
                        var len = $scope.newObj.Rating.length;
                        var total = 0;
                        for (var i in avg){ total += avg[i] / len;}
                            console.log(total);
                        
                        for (var i = 0; i < $scope.shops.length; i++) {
                            var shop = $scope.shops[i];
                            var markerPos = new google.maps.LatLng($scope.shops[i].Location._latitude, $scope.shops[i].Location._longitude);
                            $scope.MarkerPos = markerPos;

                            console.log(shop.Rating);


                            shop.Rated = {
                                iconOn: 'ion-ios-star',
                                iconOff: 'ion-ios-star-outline',
                                iconOnColor: 'rgb(255, 215, 0)',
                                iconOffColor: 'rgb(224, 224, 224)',
                                rating: Number.parseInt(shop.Rating.toString()),
                                minRating: 0,
                                readOnly: true, // Set to true so user cannot edit rating
                                // callback: function(rating) { //Mandatory
                                // }
                            };
                            // $scope.ratingsCallback = function(rating) {
                            //     console.log('Selected rating is : ', rating);
                            // };
                            
                            var marker = new google.maps.Marker({
                                map: $scope.map,
                                animation: google.maps.Animation.DROP,
                                position: markerPos,
                            });

                            var infoWindowContent = '<div id="content">' +
                                '<div style="float:left; width:5%; padding-right:2cm"><img src="app/img/surf.png" width="60" height="40"/></div>' +
                                '<div style="float:right">' +
                                '<h5>' + shop.Name + '</h5>' +
                                '<div>' +
                                '<h6>' + shop.Numb + '</h6>' +
                                '<h6>' + shop.Address + '</h6>' +
                                '<ionic-ratings ratingsobj="{rating: ' + shop.Rated.rating + ', readOnly: ' + true + ' }" style="float: right"></ionic-ratings>' +
                                '</div>' +
                                '<div id="webLink" style="float:left">' +
                                '<p><a href="#" onclick="openBrowser(google.com);">' + shop.Web + '</a> ' +
                                '<button id="requestBtn" class="button button-calm" ng-click="openModal(\'' + shop.Name + '\',\'' + shop.Email + '\')">Request</button>' +
                                '<button id="requestBtn" class="button button-calm" ng-click="navigate(\'' + markerPos + '\')">Navigate</button>' +
                                '</div>';

                            var compiled = $compile(infoWindowContent)($scope);
                            console.log(infoWindowContent);
                            var infoWindow = new google.maps.InfoWindow({
                                content: compiled[0]
                            });

                            addInfoWindow(marker, compiled[0], shop);
                        }
                    });
                }
            })
        }

        //InfoWindow
        function addInfoWindow(marker, message, shop) {

            var infoWindow = new google.maps.InfoWindow({
                content: message
            });

            $scope.selected = shop;
            console.log($scope.selected);

            $scope.$apply();
            //Binde selected shop to infoWindow
            google.maps.event.addListener(marker, 'click', function() {
                infoWindow.open($scope.map, this);
                $scope.selected = shop;
                console.log($scope.selected.Rated.rating);
                $scope.$apply();
            });

            google.maps.event.addListener($scope.map, 'click', function() {
                infoWindow.close($scope.map, this);
            });
        }

        //Star Ratings
        // $scope.ratingsObject = {
        //     iconOn: 'ion-ios-star',
        //     iconOff: 'ion-ios-star-outline',
        //     iconOnColor: 'rgb(200, 200, 100)',
        //     iconOffColor: 'rgb(200, 100, 100)',
        //     rating: 4,
        //     minRating: 0,
        //     readOnly: true,
        //     callback: function(rating) {
        //         $scope.ratingsCallback(rating);
        //     }
        // };
        // $scope.ratingsCallback = function(rating) {
        //     console.log('Selected rating is : ', rating);
        // };

        //Request Modal
        $ionicModal.fromTemplateUrl('templates/modalContent.html', {
            scope: $scope
        }).then(function(requestModal) {
            $scope.requestModal = requestModal;
        });

        $scope.openModal = function(name, email) {
            $scope.requestModal.show();
            $scope.request = { "name": name, "email": email };
        };

        $scope.closeModal = function() {
            $scope.requestModal.hide();
        };

        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
            $scope.modal.remove();
        });

        //create new partner function, only shows if user is not a partner
        $scope.Confirm = function() {

            var query = new Parse.Query('Shop');
            query.equalTo("ShopName", $scope.request.name);
            query.first({
                success: function(object) {
                    var shop = object;
                    console.log(shop);
                    var RequestSchema = Parse.Object.extend('Request');
                    var request = new RequestSchema();
                    request.set('User', Parse.User.current());
                    request.set('Shop', shop);
                    request.set('Quantity', $scope.request.quantity);
                    request.set('Gear', $scope.request.gear);
                    request.set('Message', $scope.request.message);
                    request.set('Completed', false);

                    request.save();

                    Parse.Cloud.run('requestMail', $scope.request, {
                        success: function(data) {
                            console.log(data);
                        },
                        error: function(err) {
                            console.log(err);
                        }
                    });

                    $scope.requestModal.hide();

                },
                error: function(err) {
                    console.log(err);
                }
            });
        }

        // Navigation
        $scope.navigate = function(destination) {
            $cordovaGeolocation.getCurrentPosition().then(function(start) {
                $cordovaLaunchNavigator.navigate(destination, {
                    start: [start.coords.latitude, start.coords.longitude],
                    enableDebug: true
                }).then(function() {
                    alert("Navigator Launched");
                }, function(err) {
                    alert(err);
                });
            });
        }

        $scope.openBrowser = function(url) {
            var options = {
                location: 'yes',
                clearcache: 'yes',
                toolbar: 'no'
            };
            $cordovaInAppBrowser.open(url, '_blank', options)

            .then(function(event) {
                // success
            })

            .catch(function(event) {
                // error
            });
        }

        // Calculate average location
        // console.log(avgLoc);
        // var latSum = 0;
        // var lngSum = 0;
        // console.log("this");
        // for (i in avgLoc){
        //     latSum += avgLoc[i].lat;
        //     lngSum += avgLoc[i].lng;
        // }
        // var latAvg = latSum / (avgLoc.length);
        // var lngAvg = lngSum / (avgLoc.length);
        // console.log("this");
        // console.log(latAvg);
        // map.setCenter(new google.maps.LatLng(latAvg, lngAvg));

    });
})();
