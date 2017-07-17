var selfTimer;
var timeStarted = false;

//Initialize function
var init = function () {
    // TODO:: Do your initialization job
    console.log("init() called");

    //$('#mybutton').focus();
    document.getElementById("mybutton").focus();
    
    document.addEventListener('visibilitychange', function() {
        if(document.hidden){
            // Something you want to do when hide or exit.
        } else {
            // Something you want to do when resume.
        }
    });
 
    // add eventListener for keydown
    document.addEventListener('keydown', function(e) {
        console.log("Key code : " + e.keyCode);
        var focusedItem = document.activeElement.id;
        console.log("focusedItem : " + focusedItem);

        //getCurrentElement();
    	switch(e.keyCode){
    	case 37: //LEFT arrow
            if(focusedItem == "about_us"){
                document.getElementById("about_us").blur();
                document.getElementById("home").focus();
            }else if(focusedItem == "contact_us"){
                document.getElementById("contact_us").blur();
                document.getElementById("about_us").focus();
            }else if(focusedItem == "home"){
                document.getElementById("home").blur();
                document.getElementById("contact_us").focus();
            }
            document.getElementById('divbutton0').innerHTML="";
    		break;
    	case 39: //RIGHT arrow
            if(focusedItem == "home"){
                document.getElementById("home").blur();
                document.getElementById("about_us").focus();
            }else if(focusedItem == "about_us"){
                document.getElementById("about_us").blur();
                document.getElementById("contact_us").focus();
            }else if(focusedItem == "contact_us"){
                document.getElementById("contact_us").blur();
                document.getElementById("home").focus();
            }
            document.getElementById('divbutton0').innerHTML="";
    		break;
        case 38: //UP arrow
    	case 40: //DOWN arrow
            if(focusedItem == "home" || focusedItem == "about_us" || focusedItem == "contact_us"){
                document.getElementById(focusedItem).blur();
                document.getElementById("mybutton").focus();
            } else if (focusedItem == "mybutton")
            {
                document.getElementById("mybutton").blur();
                document.getElementById("home").focus();
            }
            document.getElementById('divbutton0').innerHTML="";
    		break;
    	case 13: // Enter button
            if (focusedItem == "mybutton")
            {
                if (!timeStarted)
                {
                    document.getElementById("mybutton").innerHTML="Stop Clock";
                    timeStarted = true;
                    startTime();
                }
                else{
                    document.getElementById("mybutton").innerHTML="Start Clock";
                    timeStarted = false;
                }
            } else {
                document.getElementById('divbutton0').innerHTML="Please develop the page";
            }
    		break;
    	case 10009: // RETURN button
        case 10182: // Exit button
            tizen.application.getCurrentApplication().exit();
    		break;
    	default:
    		console.log("Key code : " + e.keyCode);
    		break;
    	}
    });
};
// window.onload can work without <body onload="">
window.onload = init;

function startTime() {

    if (timeStarted)
    {
        var today = new Date();
        var h = today.getHours();
        var m = today.getMinutes();
        var s = today.getSeconds();
        m = checkTime(m);
        s = checkTime(s);
        document.getElementById('divbutton2').innerHTML="Current time: " + h + ":" + m + ":" + s;
        selfTimer = setTimeout(startTime, 1000);
    }
    else
    {
        if(selfTimer)
        {
        	clearTimeout(selfTimer);
        }
        document.getElementById('divbutton2').innerHTML=" ";
    }

}

function checkTime(i) {
    if (i < 10) {
        i="0" + i;
    }
    return i;
}