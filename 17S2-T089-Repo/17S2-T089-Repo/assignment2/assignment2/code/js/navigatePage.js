'use strict';
// Code for the Navigate page.

//Global variables
var userPosition, polyLine, historyOfUserLocation, circleOfAccuracy, map, averageSpeed,pathIndex = localStorage.getItem(APP_PREFIX + "-selectedPath");
var distanceRef = document.getElementById("distance");
var speedRef = document.getElementById("speed");
var directionsRef = document.getElementById("direction");
var timeRef = document.getElementById("time");
var imagesRef = document.getElementById("waypoint");
var courseRef = document.getElementById("course");
var headingRef = document.getElementById("heading");
var imageSRC =["images/left.svg","images/right.svg","images/slight_left.svg","images/slight_right.svg","images/straight.svg", "images/uturn.svg"];
var prompt = ["Turn left","Turn Right","Turn Slightly left","Turn Slightly Right","Go Straight","You're going the wrong way, U-turn"];
var index = 0;
//===============================LOCATION WATCHING=====================================//

//Initial GPS location

firstLocationDetection();

// firstlocation(position)
// Initialisation code which will keep constant watch on the users GPS location
// and as a result update the marker position and it's heading
function firstLocation(position) 
{
    //Produce a new userHistory class instance which stores the GPS location of the user and its accuracy.
    
    historyOfUserLocation = new UserHistory(position.coords.latitude, position.coords.longitude, position.coords.accuracy,position.coords.heading,new Date());
}

// firstLocationDetction()
// Options for GPS watching
// Gets the user's first GPS location. 
// firstLocation function will be called every time the page is refreshed.
function firstLocationDetection() 
{
    var positionOptions = {
        enableHighAccuracy: true,
        timeout: 60000,
        maximumAge: 0
    }
    navigator.geolocation.getCurrentPosition(firstLocation, errorHandler, positionOptions);
}

// initialiseLocationDetection()
// Options for GPS watching 
// Watch the user's GPS location. showCurrentLocation function will be called every time the user's location changes 
// (if it can be successfully determined). If the location can't be determined, then the errorHandler function will be called.
function initialiseLocationDetection() 
{
    
    var positionOptions = {
        enableHighAccuracy: true,
        timeout: 60000,
        maximumAge: 0
    }

    navigator.geolocation.watchPosition(showCurrentLocation, errorHandler, positionOptions);
}

//showCurrentLocation(position)
// considers both the GPS coordinates of the user and the accuracy
// and any code using the GPS coordinates that is triggered as part of the callback function
function showCurrentLocation(position)
{
    //Adds to the users locations
    historyOfUserLocation.setNewLocation([position.coords.latitude, position.coords.longitude, position.coords.accuracy]);
    
    //Updates the marker which shows the user and also the map. The map will always be centered around the user
    historyOfUserLocation.setTime(new Date());
    
    historyOfUserLocation.setHeading(position.coords.heading);
    
    headingRef.innerHTML = historyOfUserLocation.currentHeading + " degrees";
    
    map.setCenter(historyOfUserLocation.markerPosition);
    
    //Moves the marker to the latest GPS location
    userPosition.setPosition(historyOfUserLocation.markerPosition);
    
    //Rotates the marker such that it has a heading based on the current location and the previous location
    userPosition.setOptions({
        icon:
        {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            strokeColor : 'red',
            strokeWeight : 3,
            scale: 6,
            rotation: position.coords.heading //Computes the users heading using google.maps API
        }
    });
    
    if (historyOfUserLocation.accuracy < 5)
        {
            var color = 'green';
        }
    else{ var color = 'red';}
    
    circleOfAccuracy.setOptions({
        fillColor: color,
        radius: historyOfUserLocation.accuracy,
        center: historyOfUserLocation.markerPosition
    })

    updateTable();
    if (index == 0)
        {
            nextWaypoint();
        }
    else
        {
            nextWaypoint();
            stayingOnPath();
        }
}

// errorHandler()
// handles location errors where GPS is disabled
function errorHandler(error) 
{
    var errorMessage = "";
    
    if (error.code == 1) 
    {
        errorMessage("Location access denied by user.");
    } else if (error.code == 2) 
    {
        errorMessage = "Location unavailable.";
    } else if (error.code == 3) 
    {
        errorMessage = "Location access timed out";
    } else 
    {
        errorMessage = "Unknown error getting location.";
    }
    displayMessage(errorMessage);
}

//===================== P A G E N A V I G A T I O N ===========================//
if (pathIndex !== null) 
    {
        // If a path index was specified, show name in header bar title.
        var pathNames = [];

        //Writes to the webpage the name of the path as a header title
        for (var i = 0; i < availablePaths.length; i++) 
            {
                pathNames.push(availablePaths[i].pathName);
            }
        document.getElementById("headerBarTitle").textContent = pathNames[pathIndex];
    }

//initmap()
// Put a map in when you get to the page of your choosing
function initMap() 
{
    //Sets a new open and centers it the 
    map = new google.maps.Map(document.getElementById('map'), {
        center: availablePaths[pathIndex].firstLocation,
        zoom: 19
    });

    var markerStart = new google.maps.Marker({
        position: availablePaths[pathIndex].firstLocation,
        map: map,
        label: "A"        
    });

    userPosition = new google.maps.Marker({
        position: availablePaths[pathIndex].firstLocation,
        map: map,
        flat: true,
        icon:
        {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            strokeColor : 'red',
            strokeWeight : 3,
            scale: 6,
            rotation: 0
        }
    });

    polyLine = new google.maps.Polyline({
        strokeColor: '#F25F21',
        strokeOpacity: 1.0,
        strokeWeight: 3,
        map: map
    })
    polyLine.setPath(availablePaths[pathIndex].locations);
    
    circleOfAccuracy = new google.maps.Circle({
        strokeColor: 'black',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillOpacity: 0.35,
        map: map,
        })  
}

// stayingOnPath()
// considers the current location and the target waypoint and correctly determines the 
// relative direction from current location to target waypoint. This is displayed on the screen grphically, 
// or textually with appropriate units (e.g., degrees)
// Images display which turn the user should take right turn

function stayingOnPath()
{
    if (index === 0)
        {
            var pathHeading = google.maps.geometry.spherical.computeHeading(historyOfUserLocation.markerPosition,availablePaths[pathIndex].locations[index]);
        }
    else
        {
            var pathHeading = google.maps.geometry.spherical.computeHeading(availablePaths[pathIndex].locations[index - 1],availablePaths[pathIndex].locations[index]);
        }
    if (pathHeading < 0)
        {
            pathHeading += 360
        }
    var direction = pathHeading - historyOfUserLocation.heading;
    
    var turn;
    
    if(direction >= 0 && direction <= 10 || direction < 0 && direction >= -10)
        {
            //go straight
            turn = 4;
            imagesRef.src = imageSRC[turn];
            courseRef.innerHTML = "Keep straight";
            return;
        }
    else if (direction > 10 && direction <= 30)
        {
            //turn slightly right
            turn = 3;
        }
    else if (direction< -10 && direction >= -30)
        {
            //turn slightly left
            turn= 2;
        }
    else if ( direction > 30 && direction <= 90)
        {
            //turn right
            turn = 1;
        }
    else if (direction< -30 && direction >= -90)
        {
            //turn left
            turn = 0;
        }
    else if (direction > 90 && direction <= 120)
        {
            //turn hard right
            turn = 1;
        }
    else if (direction< -90 && direction >= -120)
        {
            //turn hard left
            turn = 0;
        }
    else if (direction< -120 && direction >= -180 || direction > 120 && direction <= 180)
        {
            //U turn
            turn= 5;
        }
    if (turn == undefined)
        {
            turn = 4
        }
        imagesRef.src = imageSRC[turn];
        courseRef.innerHTML = prompt[turn];
}

// nextWaypoint()
// keeps track of the current waypoint being navigated towards and starts with the first 
// and updates to the next waypoint as the user reaches one.
// This takes into account the user's GPS accuracy and recognises when the user 
// has completed the route and notifies them 

function nextWaypoint() 
{
    var distance = google.maps.geometry.spherical.computeDistanceBetween(historyOfUserLocation.markerPosition,availablePaths[pathIndex].locations[index]);
    
    var turns;
    distanceRef.innerHTML = distance.toFixed(2) + " m";
    //when distance is less than accuracy the waypoint has been reached 
    
    if (distance > historyOfUserLocation.accuracy && historyOfUserLocation.accuracy < 5 && index === 0) 
        { 
            directionsRef.innerHTML = "Reach first point";
            return;
        }
    
    else if (distance < historyOfUserLocation.accuracy && historyOfUserLocation.accuracy < 5) 
        { 
            
            directionsRef.innerHTML = "Go to next point";
            
            index++
            
            var latestPathHeading = google.maps.geometry.spherical.computeHeading(availablePaths[pathIndex].locations[index - 1],availablePaths[pathIndex].locations[index]);
            
            if (latestPathHeading < 0)
                {
                    latestPathHeading += 360;
                }
            if (index < 2)
                {
                    var lastPathHeading = latestPathHeading;
                }
            else 
                {
                    var lastPathHeading = google.maps.geometry.spherical.computeHeading(availablePaths[pathIndex].locations[index - 2],availablePaths[pathIndex].locations[index - 1]);
                    if (lastPathHeading < 0)
                        {
                            lastPathHeading += 360;
                        }
                }
            
            var whichWayToGo = latestPathHeading - lastPathHeading;
            
            if (whichWayToGo >= 0 && whichWayToGo <= 10 || whichWayToGo < 0 && whichWayToGo >= -10)
                {
                    turns = 4;
                }
            
            else if ( whichWayToGo > 10 && whichWayToGo <= 30)
                {
            //turn slightly right
                    turns = 3;
                }
            
            else if (whichWayToGo < -10 && whichWayToGo >= -30)
                {
            //turn slightly left
                    turns = 2;
                }
            
            else if (whichWayToGo >30 && whichWayToGo <= 120)
                {
            //turn right
                    turns = 1;
                }
            
            else if (whichWayToGo< -30 && whichWayToGo >= -90 || whichWayToGo <= 330 && whichWayToGo >= 270)
                {
            //turn left
                    turns = 0;
                }
            
            else if (whichWayToGo >90 && whichWayToGo <= 120)
                {
            //turn hard right
                    turns =1;
                }
            
            if (turns == undefined)
                {
                    turns = 4;
                }
 
            imagesRef.src = imageSRC[turns];
            
            directionsRef.innerHTML = prompt[turns];
            
            setTimeout(function(){directionsRef.innerHTML = ""},3000);
        }
    //user reaches last waypoint which is the last index in paths array 
    //Display toast message when user has reached its destination  
    else if (index === availablePaths[pathIndex].locations.length - 1) 
        { 
            directionsRef.innerHTML = "Last point reached";
        }
    
} 

// updateTable()
// dispays all of the necessary info to the page table
// The navigation page dispays all of the necessary info distance to waypoint, average speed, user heading
// staying on course, time to destination, directions
function updateTable()
{    
    speedRef.innerHTML = historyOfUserLocation.currentSpeed.toFixed(2) + " km/h";
    
    averageSpeed = historyOfUserLocation.distance/historyOfUserLocation.timeTraveling;
    
    var distance = google.maps.geometry.spherical.computeDistanceBetween(historyOfUserLocation.markerPosition,availablePaths[pathIndex].locations[index]);
    
    var estimateTimeToDestination
    // esterimated time remaining
    // considers the current average speed and remaining distance and this is used to estimate time remaining
    // its displayed for the user with appropriate units in minutes
    // updated each time the user's location changes, and this displays a sensible value when 
    // the users is starting their route and hardly moving
    if (Number.isNaN(averageSpeed) === false && averageSpeed !== 0)
        {
            estimateTimeToDestination = (distance/averageSpeed)/60;
            timeRef.innerHTML = estimateTimeToDestination.toFixed(1) + " min";
        }
    else
        {
            estimateTimeToDestination = distance/(1.39)/60;
            timeRef.innerHTML = estimateTimeToDestination.toFixed(1) + " min";
        }
}
initialiseLocationDetection();
