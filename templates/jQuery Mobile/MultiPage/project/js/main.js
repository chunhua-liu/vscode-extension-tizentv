var backEventListener = null;

var unregister = function() {
    if ( backEventListener !== null ) {
        document.removeEventListener( 'tizenhwkey', backEventListener );
        backEventListener = null;
        window.tizen.application.getCurrentApplication().exit();
    }
}

//Initialize function
var init = function () {
    // register once
    if ( backEventListener !== null ) {
        return;
    }
    
    // TODO:: Do your initialization job
    console.log("init() called");
    
    var backEvent = function(e) {
        if ( e.keyName == "back" ) {
            try {
                if ( $.mobile.urlHistory.activeIndex <= 0 ) {
                    // if first page, terminate app
                    unregister();
                } else {
                    // move previous page
                    $.mobile.urlHistory.activeIndex -= 1;
                    $.mobile.urlHistory.clearForward();
                    window.history.back();
                }
            } catch( ex ) {
                unregister();
            }
        }
    }
    
    // add eventListener for tizenhwkey (Back Button)
    document.addEventListener( 'tizenhwkey', backEvent );
    backEventListener = backEvent;
};

$(document).bind( 'pageinit', init );
$(document).unload( unregister );



function setFocusVisible(index1,state){
	var list = $.mobile.activePage.find(":jqmData(role = 'button')");
	$item = list[index1];
	if (state) {
		$item.focus();
	}
	else {
		$item.blur();
	}
}

var index = 0;

function handelPageOne(e) {
	switch(e.keyCode){
		case TvKeyCode.KEY_LEFT:
		case TvKeyCode.KEY_UP:
			if(index != 0 && index >0){
				index--;
			}
			setFocusVisible(index+1,false);
			setFocusVisible(index,true);
			break;
		case TvKeyCode.KEY_RIGHT:
		case TvKeyCode.KEY_DOWN:
			if(index != 1 && index < 2){
				index++;
				setFocusVisible(index-1,false);
				setFocusVisible(index,true);
			}
			break;
		case TvKeyCode.KEY_ENTER:
				if(index == 0){
					console.log("enter one");
					$.mobile.changePage("#two");
				}
				else if(index == 1){
					console.log("enter cpu");
					$.mobile.changePage("#popup",{ transition: "pop",role: "dialog" });
				}
			break;
		default:
			break;
	}
}

function handlePageTwo(e) {
	switch(e.keyCode){
		case TvKeyCode.KEY_LEFT:
		case TvKeyCode.KEY_UP:
			setFocusVisible(0, true);
			break;
		case TvKeyCode.KEY_RIGHT:
		case TvKeyCode.KEY_DOWN:
			setFocusVisible(0, true);
			break;
		case TvKeyCode.KEY_ENTER:
			console.log("enter two");
			$.mobile.changePage("#one");
			break;
		default:
			break;
	}
}

function bindKeyToPage1(){
	console.log("pag1");
	index = 0;
	setFocusVisible(index,true);
	document.body.removeEventListener("keydown",handlePageTwo,false);
	document.body.addEventListener("keydown",handelPageOne ,false);
}

function bindKeyToPage2(){
	console.log("page2");
	index = 0;
	setFocusVisible(index, true);
	document.body.removeEventListener("keydown",handelPageOne,false);
	document.body.addEventListener("keydown",handlePageTwo ,false);
} 

$(document).on("pageshow", "#one", bindKeyToPage1);
$(document).on("pageshow", "#two", bindKeyToPage2);
$(document).on("pageshow", "#popup", bindKeyToPage2);