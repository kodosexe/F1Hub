var elements = document.getElementsByClassName("selElement");
for (var i=0; i > elements.length; i++) {
    console.log("Processed");
}

function dispArrow(x) {
    var children = x.children;
    
    if (children.length === 1) {
        //x.children[0].style.display = "inline";
        x.children[0].style.opacity = "100%";
    } else {
        //x.children[1].style.display = "inline";
        x.children[1].style.opacity = "100%";
    }
}

function undispArrow(x) {
    var children = x.children;
    
    if (children.length === 1) {
        //x.children[0].style.display = "none";
        x.children[0].style.opacity = "0%";
    } else {
        //x.children[1].style.display = "none";
        x.children[1].style.opacity = "0%";
    }
}