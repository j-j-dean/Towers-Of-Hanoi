
// Drag and drop progress settings
var drop = {
    NOT_IN_PROGRESS: 0,
    IN_PROGRESS: 1,
    COMPLETE: 2,
};

// Error message dialog container
var errorBox = {
    msgNum: 0,
    messages: ['Only place blocks on bigger blocks!',
               'Small block on Bigger block only!',
               'Oops!',
               'Oops again!'],
}

// Initialization and app properties
var hanoiApp = {
    POLE_LENGTH: 15, // length of pole in pixels
    TOWER_ONE: 1, 
    TOWER_TWO: 2, 
    TOWER_THREE: 3, 
    SECONDS_IN_MINUTE: 60,
    eTime: 0, // elapsed time
    defaultBlockColor: "blue",
    defaultBlockBorder: "1px solid black",
    defaultBaseColor: "brown",
    selectedBorderColor: "4px solid cyan",
    selectedTowerNum: 1,
    dropStatus: drop.NOT_IN_PROGRESS,
    currPosX: 0, // store cursor X value for touch screen drag and drop operations
    currPosY: 0, // store cursor Y value for touch screen drag and drop operations
}

// Function to update post heights on the towers
hanoiApp.UpdatePostHeights = function() {

    // Set the svg containers size to the size of the grid
    var extraPoleLength = hanoiApp.POLE_LENGTH;
    var postHeight = $('#all-towers').height()+extraPoleLength; // make the pole a little longer
    $('#tower1-post').height(postHeight);
    $('#tower2-post').height(postHeight);
    $('#tower3-post').height(postHeight);

    // Set the rectangles size to the svg's size
    $('#post1').height(postHeight);
    $('#post2').height(postHeight);
    $('#post3').height(postHeight);

    // Reset the location of the top of the poles in each tower
    var offsetTop = $('#all-towers').offset().top - extraPoleLength;
    $('#tower1-post').css('top', offsetTop.toString()+'px');
    $('#tower2-post').css('top', offsetTop.toString()+'px');
    $('#tower3-post').css('top', offsetTop.toString()+'px');
}

// Function to check if valid to move block from selected tower to the move to tower
hanoiApp.ValidBlockMove = function(moveFromTowerNum, moveToTowerNum) {

    topMoveFromBlock = hanoiApp.GetTopBlock(moveFromTowerNum);
    topMoveToBlock = hanoiApp.GetTopBlock(moveToTowerNum);

    // Not valid move if there are no blocks in the move from tower
    if (!topMoveFromBlock) {
        return false;
    }

    // only need to check validity of move if there are blocks in the tower being moved to
    if (topMoveToBlock) {
        // convert from and to block widths to floating point for comparison
        var numberPattern = /[0-9]+[.]*[0-9]+/;
        var moveFromSize = parseFloat(numberPattern.exec(topMoveFromBlock.css("width")));
        var moveToSize = parseFloat(numberPattern.exec(topMoveToBlock.css("width")));

        // Not valid if top block in move to tower is bigger than the block being moved
        if (moveFromSize > moveToSize) {
            return false;
        }
    }
    return true;
}

// Function to get the top block element for the input tower number
hanoiApp.GetTopBlock = function(towerNum) {
    var selectedBlock;
    var towerElement;
    var towerBaseName;

    // Set the tower element and base name based on the input tower number
    if (towerNum == hanoiApp.TOWER_ONE) {
        towerElement = $('#tower1');
        towerBaseName = "tower1-base";
    } else if (towerNum == hanoiApp.TOWER_TWO) {
        towerElement = $('#tower2');
        towerBaseName = "tower2-base";
    } else if (towerNum == hanoiApp.TOWER_THREE) {
        towerElement = $('#tower3');
        towerBaseName = "tower3-base";
    } else {
        return null;
    }

    // find the top block in the tower element by traversing it's children
    towerElement.children().each(function() {
        if ($(this).prop('display-block') && ($(this).prop('display-block') == true)) {
            selectedBlock = $(this);
            return false; /* the block is found, this will terminate the loop for each child */
        }
    });

    // if the block found is the base of the tower return null
    if (selectedBlock.attr("id") == towerBaseName) {
        return null;
    }

    return selectedBlock; // return the selected block element
}

// Check if the tower has been successfully moved
hanoiApp.CheckIfTowerMoveComplete = function(towerNum) {

    // make sure moving blocks to tower 2 or 3 (not 1)
    if (towerNum != hanoiApp.TOWER_ONE) {

        // if the top block has been added to tower 2 or tower 3 then all the blocks have been moved
        if (($("#tower2-block1").prop("display-block") == true) || 
                ($("#tower3-block1").prop("display-block") == true)) {
            return(true);
        } else {
            return(false);
        }
    }
    return(false);
}

// Display a winning message after the puzzle has been solved
hanoiApp.DisplayCompleteMsg = function() {

    // replace timer message with winning message and add a reset button
    var message = "Winning Time: ";
    if (hanoiApp.eTime < hanoiApp.SECONDS_IN_MINUTE) {
        message += hanoiApp.eTime + " seconds";
    } else {
        message += Math.trunc(hanoiApp.eTime/hanoiApp.SECONDS_IN_MINUTE) + 
                            " minutes, "+ (hanoiApp.eTime%hanoiApp.SECONDS_IN_MINUTE) + " seconds";
    }
    $('#timer-msg').text(message);

    var winning_msg = document.getElementById("timer-msg");
    var resetButton = document.createElement("button");
    resetButton.innerText = "Click to Reset";
    resetButton.classList.add("reset");
    winning_msg.appendChild(resetButton);

    // start over after the reset button is clicked
    resetButton.onclick = function() {
        location.reload();
    }
}

// Function to move the top block from the currently selected tower to the input tower number
hanoiApp.MoveBlockToTower = function(towerNum) {

    var selectedBlock;
    var moveToBlock;

    // Get the top block element from the selected tower
    selectedBlock = hanoiApp.GetTopBlock(hanoiApp.selectedTowerNum);

    // if the move to tower number is different than the currently selected tower number
    if (towerNum != hanoiApp.selectedTowerNum) {
        var towerElement;

        // Set the tower element and base name based on the input tower number
        if (towerNum == hanoiApp.TOWER_ONE) {
            towerElement = $('#tower1');
        } else if (towerNum == hanoiApp.TOWER_TWO) {
            towerElement = $('#tower2');
        } else if (towerNum == hanoiApp.TOWER_THREE) {
            towerElement = $('#tower3');
        } else {
            return; // invalid tower number
        }

        // find the element where the first displayable block exists in the move to
        // tower and set the moveToBlock element to the element before this element
        towerElement.children().each(function() {
            if ($(this).prop('display-block') && ($(this).prop('display-block') == true)) {
                return false; // the block is found, this will terminate the loop for each child
            } else {
                moveToBlock = $(this); // advances to next block
            }
        });

        // check to ensure the selected block is smaller than the top block in the move to tower
        if ((selectedBlock) && hanoiApp.ValidBlockMove(hanoiApp.selectedTowerNum, towerNum)) {

            // copy the selected block properties to the properties for the new block location
            moveToBlock.css("background-color", hanoiApp.defaultBlockColor);
            moveToBlock.css("border", hanoiApp.defaultBlockBorder);
            moveToBlock.css("width", selectedBlock.css("width"));
            moveToBlock.text(selectedBlock.text());
            moveToBlock.prop("display-block", true);

            // clear the selected blocks properties
            selectedBlock.css("background-color","");
            selectedBlock.css("border", "");
            selectedBlock.css("width", "100%");
            selectedBlock.text("");
            selectedBlock.prop("display-block", false);

            // if all blocks moved display completion message
            if (hanoiApp.CheckIfTowerMoveComplete(towerNum)) {
                hanoiApp.DisplayCompleteMsg();
            }

        } else {

            // make visible reminder messages for placing blocks
            $('#oops-msg').text(errorBox.messages[errorBox.msgNum]);
            $('#oops-msg').css("visibility","visible");
            setTimeout(function() {
                $('#oops-msg').css("visibility","hidden");
                errorBox.msgNum++;
                errorBox.msgNum %= errorBox.messages.length;
            },3000); // visible for 3 seconds
        }
    }
    return;
}

// Function to update the timer display
hanoiApp.UpdateTimer = function() {
    if (hanoiApp.eTime < hanoiApp.SECONDS_IN_MINUTE) {
        $('#time-elapsed').text(hanoiApp.eTime + " seconds");
    } else {
        $('#time-elapsed').text(Math.trunc(hanoiApp.eTime/hanoiApp.SECONDS_IN_MINUTE) +" minutes, "+ 
                                (hanoiApp.eTime%hanoiApp.SECONDS_IN_MINUTE) + " seconds");
    }
}

// Handler for the start of block drag operation
hanoiApp.DragStart = function(ev, blockElement, towerNum) {

    // Set selected tower number property and get the top block element on the tower
    var topBlock;
    hanoiApp.selectedTowerNum = towerNum;
    topBlock = hanoiApp.GetTopBlock(towerNum);

    // Verify the block selected to move is the top block on the tower
    if (topBlock && blockElement) {
        if (topBlock.css("width") != blockElement.css("width")) {  // unique width identifies blocks
            ev.preventDefault();
        } else {
            hanoiApp.dropStatus = drop.IN_PROGRESS;
            blockElement.css("border", hanoiApp.selectedBorderColor); // change block element's border

            // Set the objects offset position for later movement
            hanoiApp.startOffsetX = blockElement.offset().left;
            hanoiApp.startOffsetY = blockElement.offset().top;
        }
    }
}

// Handler for the end of the block drag operation
hanoiApp.DragEnd = function(blockElement) {

    if (hanoiApp.dropStatus == drop.IN_PROGRESS) {
        blockElement.css("border", hanoiApp.defaultBlockBorder); // no move, so reset block element's border
    } else {
        // if block moved to valid place then move it
        blockElement.css("border", ""); // block moved, clear block element's border
    }
    hanoiApp.dropStatus = drop.NOT_IN_PROGRESS;
}

// handler for moving a block using a touch screen
hanoiApp.TouchMove = function (ev, touchElement, towerNum) {

    // verify a valid touch operation is in progress
    if (hanoiApp.dropStatus == drop.IN_PROGRESS) {
        // store the X and Y location for the movement of the block
        hanoiApp.currPosX=ev.touches[0].clientX;
        hanoiApp.currPosY=ev.touches[0].clientY;

        // get current position on screen
        var screenPosX = hanoiApp.currPosX;
        var screenPosY = hanoiApp.currPosY;

        // set coordinates and move block object with cursor
        var translateX = screenPosX - hanoiApp.startOffsetX;
        var translateY = screenPosY - hanoiApp.startOffsetY;
        var translateString = "translate("+translateX.toString()+"px,"+translateY.toString()+"px)";
        touchElement.css("transform",translateString);
    } else {
        ev.preventDefault();
    }
}

// hander for the completion of a touch drag event
hanoiApp.TouchEnd = function(ev, blockElement, towerNum) {

    // verify a valid touch operation is in progress
    if (hanoiApp.dropStatus == drop.IN_PROGRESS) {

        var towerTopOffset=0;
        var towerLeftOffset=0;
        var towerWidth=0;
        var towerHeight=0;
        var dropTower=0;

        // check if the X and Y cursor position are within tower 1 boundaries
        towerTopOffset = $('#tower1').offset().top;
        towerLeftOffset = $('#tower1').offset().left;
        towerWidth = $('#tower1').width(); // width is the same for all towers
        towerHeight = $('#tower1').height(); // height is the same for all towers
        if ((hanoiApp.currPosX > towerLeftOffset) && (hanoiApp.currPosX < (towerLeftOffset+towerWidth)) &&
            (hanoiApp.currPosY > towerTopOffset) && (hanoiApp.currPosY < (towerTopOffset+towerHeight))) {
            dropTower = 1;
        } else {

            // check if the X and Y cursor position are within tower 2 boundaries
            towerTopOffset = $('#tower2').offset().top;
            towerLeftOffset = $('#tower2').offset().left;
            if ((hanoiApp.currPosX > towerLeftOffset) && (hanoiApp.currPosX < (towerLeftOffset+towerWidth)) &&
                (hanoiApp.currPosY > towerTopOffset) && (hanoiApp.currPosY < (towerTopOffset+towerHeight))) {
                dropTower = 2;
            } else {

                // check if the X and Y cursor position are within tower 3 boundaries
                towerTopOffset = $('#tower3').offset().top;
                towerLeftOffset = $('#tower3').offset().left;
                if ((hanoiApp.currPosX > towerLeftOffset) && (hanoiApp.currPosX < (towerLeftOffset+towerWidth)) &&
                    (hanoiApp.currPosY > towerTopOffset) && (hanoiApp.currPosY < (towerTopOffset+towerHeight))) {
                    dropTower = 3;
                }
            }
        }

        // return the current block element to it's original position
        blockElement.css("transform","translate(0,0)");
        if (dropTower != 0) {
            hanoiApp.dropStatus = drop.COMPLETE;
            hanoiApp.MoveBlockToTower(dropTower);
        }
    } else {
        ev.preventDefault();
    }
}

// Add handlers for drag and drop operations between towers
hanoiApp.AddDragAndDropHandlers = function(towerElement, towerNum) {

    // Tower drag and drop handlers
    towerElement.children().on ({
        dragstart: function(ev) {
            hanoiApp.DragStart(ev, $(this), towerNum);
         },
        touchstart: function(ev) {
            hanoiApp.DragStart(ev, $(this), towerNum);
        },
        dragover: function(ev) {
            ev.preventDefault();
        },
        touchmove: function(ev) {
            hanoiApp.TouchMove(ev, $(this), towerNum);
            ev.preventDefault();
        },
        touchend: function(ev) {
            hanoiApp.TouchEnd(ev, $(this), towerNum);
        },
        dragend: function(ev) {
            hanoiApp.DragEnd($(this));
        },
        drop: function(ev) {
            ev.preventDefault();
            hanoiApp.dropStatus = drop.COMPLETE;
            hanoiApp.MoveBlockToTower(towerNum);
        },
    });
}

// initialize styles and properties for the three towers
hanoiApp.TowersInit = function() {
    $('#tower1').children().css("background-color", hanoiApp.defaultBlockColor);
    $('#tower1').children().css("border", hanoiApp.defaultBlockBorder);
    $('#tower1').children().prop('display-block',true);
    $('#tower2').children().prop('display-block',false);
    $('#tower3').children().prop('display-block',false);
    var blockNum=1;
    $('#tower1').children(".block").each(function() {
        $(this).text(blockNum.toString());
        blockNum++;
    });
    $('#tower2-base').prop('display-block',true);
    $('#tower3-base').prop('display-block',true);
    $('#tower1-base').css("background-color", hanoiApp.defaultBaseColor);
}

// Add handler to process user's request to skip the instructions
hanoiApp.skipInstructionsHandler = function() {
    $('#skip-button').on ({
        click: function() {
            // remove the instructions from the display
            $('#instructions').css("display","none");

            // display the towers
            $('#all-container').css("display","flex");

            // reset the timer to zero
            hanoiApp.eTime = 0;
            hanoiApp.UpdateTimer();

            // reset the tower post height settings
            hanoiApp.UpdatePostHeights();
        },
    });
}

// Function to perform after the window loads
window.onload = function () {

    // update post heights after window is loaded
    hanoiApp.UpdatePostHeights();

    // setup click handler for removing the instructions and displaying the towers
    hanoiApp.skipInstructionsHandler();

    // setup event listener to update post heights after window is resized
    window.addEventListener('resize', hanoiApp.UpdatePostHeights);

    // set the initial properties for the blocks in three towers
    hanoiApp.TowersInit();

    // setup drag and drop handlers for the three towers
    hanoiApp.AddDragAndDropHandlers($('#tower1'), hanoiApp.TOWER_ONE);
    hanoiApp.AddDragAndDropHandlers($('#tower2'), hanoiApp.TOWER_TWO);
    hanoiApp.AddDragAndDropHandlers($('#tower3'), hanoiApp.TOWER_THREE);

    // Set timer to display the elapsed time - once per second
    setInterval(function() {
        hanoiApp.eTime += 1; // add one second
        hanoiApp.UpdateTimer();
    },1000); // one second interval
}
