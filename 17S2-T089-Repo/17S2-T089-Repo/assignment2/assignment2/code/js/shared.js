'use strict';
// Shared code needed by all pages of the app.

// Prefix to use for Local Storage.
var APP_PREFIX = "monash.eng1003.navigationApp", availablePaths = [];

//Set up a class that will log where the user has been going and will ultimately return the
//average speed it took to get to places

class UserHistory {
    constructor(lat, lng, accuracy,heading,timestamp)
    {
        this._positionHistory = [new google.maps.LatLng(lat,lng)];
        this._positionAccuracy = [accuracy];
        this._time = [timestamp];
        this._speed = [0];
        this._distanceTravelled = 0;
        this._heading = [heading];
    }
    
    //returns the second last GPS location
    get prevPosition() {
        return this._positionHistory[this._positionHistory.length-2]; 
    }
    
    //returns the accuracy of the GPS location
    get accuracy() {
        return this._positionAccuracy[this._positionAccuracy.length - 1]; 
    }
    
    //returns the latest GPS location
    get markerPosition() {
        return this._positionHistory[this._positionHistory.length-1]; 
    }
    
    //calculates the duration with which the user has been walking
    get timeTraveling() {
        //Using as distance stuff atm
        var time = this._time[this._time.length - 1] - this._time[0];
        return time/1000;
    }
    
    //returns the average speed based on the distance the user has travelled and the duration it took them to do so
    get averageSpeed()
    {
        var time = this._time[this._time.length - 1] - this._time[0];
        
        return this._distanceTravelled/(time/1000);
    }
    
    //Returns the users current speed
    get currentSpeed()
    {
        if (this._positionHistory.length > 5)
            {
                var distTemp = google.maps.geometry.spherical.computeLength([this._positionHistory[this._positionHistory.length - 6], this._positionHistory[this._positionHistory.length - 5], this._positionHistory[this._positionHistory.length - 4], this._positionHistory[this._positionHistory.length - 3], this._positionHistory[this._positionHistory.length - 2], this._positionHistory[this._positionHistory.length - 1]]);
                var tempTime = (this._time[this._time.length - 1] - this._time[this._time.length - 6])/1000;
                return (distTemp * 3.6 /tempTime);
            }
        else
        {return 0;}
    }
    //Returns the users current heading
    get currentHeading()
    {   
        //Checks if the heading has been successfully determined
        if (Number.isNaN(this._heading[this._heading.length - 1]) === false && this._heading[this._heading.length - 1] !== null)
        {
            return this._heading[this._heading.length - 1];
        }
        else
            {
                return "???"
            }
    }
    
    //Calculates the distance that the user has travelled
    get distance()
    {
        this._distanceTravelled += google.maps.geometry.spherical.computeDistanceBetween(this._positionHistory[this._positionHistory.length - 2],this._positionHistory[this._positionHistory.length - 1])
        return this._distanceTravelled;
    }

    //Pushes a new location to calculate the distance the user has travelled
    setNewLocation(location) {
        this._positionHistory.push(new google.maps.LatLng(location[0],location[1]));
        this._positionAccuracy.push(location[2]); //Adds the newest GPS location
    }
    
    //Adds a new timestamp each time the GPS location is successfully determined
    setTime(timestamp)
    {
        this._time.push(timestamp);
    }
    
    //Pushes a new heading after it is determined
    setHeading(position)
    {
        this._heading.push(position);
    }
}

//Accessing webservice function. Adapted from code written by Michael Wybrow. Access from https://eng1003.monash/playground/snippets/#week07

function jsonpRequest(url, data) {
    // Build URL parameters from data object.
    var params = "";
    // For each key in data object...
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            if (params.length == 0) {
                // First parameter starts with '?'
                params += "?";
            } else {
                // Subsequent parameter separated by '&'
                params += "&";
            }

            var encodedKey = encodeURIComponent(key);
            var encodedValue = encodeURIComponent(data[key]);

            params += encodedKey + "=" + encodedValue;
        }
    }
    
    //Dynamically adding the script tag to the html file
    var script = document.createElement('script');
    script.src = url + params;
    document.body.appendChild(script);
}

//Class for paths

class Path {
    constructor(pathObject) {
        this._locations = [];
        this._stops = pathObject.locations;
        this._title = pathObject.title;
    }

    get pathName() {
        return this._title; //returns the selected paths title
    }

    get locations() {
        var locations = [];
        for (var i = 0; i < this._stops.length;i++)
            {
                locations.push(new google.maps.LatLng(this._stops[i].lat, this._stops[i].lng))
            }
        return locations; //returns the coordinates of the path. **change so it returns LatLng instances. Done
    }
    //How many waypoints there are to navigate with
    get numberOfTurns() {
        return this._stops.length;
    }
    
    get totalDistance() {
        //Total distance of the path is calculated

        for (var i = 0; i < this._stops.length; i++) {
            this._locations.push(new google.maps.LatLng(this._stops[i].lat, this._stops[i].lng));
        }
        var distance = google.maps.geometry.spherical.computeLength(this._locations);
        return distance;
    }

    get firstLocation() {
        return this._stops[0]; //Returns the starting position
    }
    
    get lastPosition() {
        return this._stops[this._stops.length-1]; //returns the end point
    }
}

// Array of saved Path objects.


if (localStorage) {
    var paths = JSON.parse(localStorage.getItem(APP_PREFIX + " CL PATHS"));
}

//If there is nothing in local storage, it will call the webservice and load the
//objects into the array while making class instances.
else {
    var data = {
        campus: clayton
    };
    var paths = jsonpRequest(webService, data);
}

for (var i = 0; i < paths.length; i++) {
    //var path = new Path(paths[i]);

    availablePaths.push(new Path(paths[i]));
}