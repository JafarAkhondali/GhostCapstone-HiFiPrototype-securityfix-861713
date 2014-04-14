// Ghost's Anatomy
// Leap Motion Script
// 

// Global keyTap and screenTap arrays
var keyTaps = [];
var KEYTAP_LIFETIME = .5;
var KEYTAP_START_SIZE = 15;

// Global keyTap and screenTap arrays
var screenTaps = [];
var SCREENTAP_LIFETIME = 1;
var SCREENTAP_START_SIZE = 30;

// Setting up Canvas

var canvas = document.getElementById('canvas');
var c = canvas.getContext('2d');

// Making sure we have the proper aspect ratio for our canvas
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Setup variables
var width = canvas.width;
var height = canvas.height;
var frame, lastFrame;
var numberFingers;

// LeapToScene
function leapToScene(leapPos) {
    var iBox = frame.interactionBox;

    // Left coordinate = Center X - Interaction Box Size / 2
    // Top coordinate = Center Y + Interaction Box Size / 2
    var left = iBox.center[0] - iBox.size[0] / 2;
    var top = iBox.center[1] + iBox.size[1] / 2;

    // X Poisition = Current
    var x = leapPos[0] - left;
    var y = leapPos[1] - top;

    x /= iBox.size[0];
    y /= iBox.size[1];

    x *= width;
    y *= height;

    return [x, -y];
}

// Mapping function for Rotation gesture
function map(value, inputMin, inputMax, outputMin, outputMax){
        outVal = ((value - inputMin) / (inputMax - inputMin) * (outputMax - outputMin) + outputMin);  
        if(outVal >  outputMax){
          outVal = outputMax;
        }
        if(outVal <  outputMin){
          outVal = outputMin;
        } 
        return outVal;
}

function onScreenTap(gesture) {

    var pos = leapToScene(gesture.position);

    var time = frame.timestamp;

    screenTaps.push([pos[0], pos[1], time]);

}

function updateScreenTaps() {

    for (var i = 0; i < screenTaps.length; i++) {

        var screenTap = screenTaps[i];
        var age = frame.timestamp - screenTaps[i][2];
        age /= 1000000;

        if (age >= SCREENTAP_LIFETIME) {
            screenTaps.splice(i, 1);
        }

    }

}

function drawScreenTaps() {

    for (var i = 0; i < screenTaps.length; i++) {

        var screenTap = screenTaps[i];

        var x = screenTap[0];
        var y = screenTap[1];

        var age = frame.timestamp - screenTap[2];
        age /= 1000000;

        var completion = age / SCREENTAP_LIFETIME;
        var timeLeft = 1 - completion;

        /*
        
        Drawing the static ring

        */
        c.strokeStyle = "#FFB300";
        c.lineWidth = 3;

        // Save the canvas context, so that we can restore it
        // and have it un affected
        c.save();

        // Translate the contex and rotate around the
        // center of the  square
        c.translate(x, y);

        //Starting x and y ( compared to the pivot point )
        var left = -SCREENTAP_START_SIZE / 2;
        var top = -SCREENTAP_START_SIZE / 2;
        var width = SCREENTAP_START_SIZE;
        var height = SCREENTAP_START_SIZE;

        // Draw the rectangle
        c.strokeRect(left, top, width, height);

        // Restore the context, so we don't draw everything rotated
        c.restore();


        // Drawing the non-static part

        var size = SCREENTAP_START_SIZE * timeLeft;
        var opacity = timeLeft;
        var rotation = timeLeft * Math.PI;

        c.fillStyle = "rgba( 255 , 179 , 0 , " + opacity + ")";

        c.save();

        c.translate(x, y);
        c.rotate(rotation);

        var left = -size / 2;
        var top = -size / 2;
        var width = size;
        var height = size;

        c.fillRect(left, top, width, height);

        c.restore();


    }

}

// Setting up the Leap Controller
var controller = new Leap.Controller({
    enableGestures: true
});

// Frame event
controller.on('frame', function (data) {
    lastFrame = frame;
    frame = data;
    numberFingers = frame.fingers.length;

    // Clears the window
    c.clearRect(0, 0, width, height);

    // Loops through each hand
    for (var i = 0; i < frame.hands.length; i++) {

        // Setting up the hand
        var hand = frame.hands[i]; // The current hand
        var handPos = leapToScene(hand.palmPosition); // Palm position
        var scaleFactor = hand.scaleFactor(lastFrame, frame);
        var translation = lastFrame.translation(frame);

        /* GESTURES */
        // ZOOM GESTURE - Pinch Motion
        if (numberFingers == 2 & scaleFactor < 1) { // Zoom out
            camera.position.z += (1 - scaleFactor) * 2;
            //camera.position.x += (1 - scaleFactor) * 2;
        } else if (numberFingers == 2 & scaleFactor > 1) { // Zoom in
            camera.position.z -= (scaleFactor - 1) * 2;
            //camera.position.x -= (scaleFactor - 1) * 2;
        }

        

        dae.rotation.x = map(translation[1], -4, 4, 0, 10);
        dae.rotation.y = map(translation[0], -4, 4, 0, 10);

        // Loops through each finger
        for (var j = 0; j < hand.fingers.length; j++) {
            var finger = hand.fingers[j]; // Current finger
            var fingerPos = leapToScene(finger.tipPosition); // Finger position

            // Drawing the finger
            c.strokeStyle = "#FF5A40";
            c.lineWidth = 6;
            c.beginPath();
            c.arc(fingerPos[0], fingerPos[1], 6, 0, Math.PI * 2);
            c.closePath();
            c.stroke();

        }
    }

    /* Gestures */
    for (var k = 0; k < frame.gestures.length; k++) {

        var gesture = frame.gestures[k];

        var type = gesture.type;

        switch (type) {

        case "screenTap":
            onScreenTap(gesture);
            break;


        }

    }

    updateScreenTaps();
    drawScreenTaps();


});

controller.connect();