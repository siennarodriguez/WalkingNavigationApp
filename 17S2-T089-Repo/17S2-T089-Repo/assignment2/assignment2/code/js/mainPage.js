'use strict';

// Code for referencing the Main page of the app. 
var pathsListRef = document.getElementById("pathsList");

//The URL link to the web service that contains our desired paths

var webService = "https://eng1003.monash/api/campusnav/";

//This function is used to load paths into the navigate page

function viewPath(pathIndex)
{
    // Save the selected path index to local storage so it can be accessed
    // from the Navigate page.
    localStorage.setItem(APP_PREFIX + "-selectedPath", pathIndex);
    // ... and then load the Navigate page.

    location.href = 'navigate.html';
}

//This function stores the JSON data from the web service

//====================== Web Service Data =============================//
//Data to be used as an argument for the jsonpRequest.

var data = {
    campus: "clayton",
    callback: "routesResponse"
};

jsonpRequest(webService, data);

//======================= End Web Service ==========================//

//======================= C A L L B A C K ==============================//
//Paths into local storage
// Set the item to strings like that
function routesResponse(routes)
{
    //Check if local storage is available
    
    if(localStorage)
    {
        //Store the requested data into the local storage
        localStorage.setItem(APP_PREFIX + " CL PATHS",JSON.stringify(routes));
    }
    else
    {
        displayMessage("Local storage is not available",3000)
    }
    //Outputting a selection of paths to main page
    var listHTML = ""; //Code with the list of paths
    //Iterates over the stored paths and recovers necessary information that is then
    //displayed on the main page
    for (var i = 0; i < routes.length; i++)
    {
        //Produce a temporary path instance to compute necessary information that is to
        //be displayed
        var pathInformation = new Path(routes[i]);
        listHTML += "<li class=\"mdl-list__item mdl-list__item--two-line\" onclick=\"viewPath("+i+")\">";
        listHTML += "<span class=\"mdl-list__item-primary-content\">";
        listHTML += "<span>" + pathInformation.pathName + "</span><span class=\"mdl-list__item-sub-title\">Total Distance = " + pathInformation.totalDistance.toFixed(2) + '</br>' + "Total No. of Turns = " + pathInformation.numberOfTurns + "</span></span></li>";
        pathInformation++;
    }
    // Insert the list view elements into the paths list.
    pathsListRef.innerHTML = listHTML;
}