function trim(str) {
    if (str === undefined)
        return str;
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

function elementAfter(text) {
    var ths = document.getElementsByTagName("th")
    for (var i = 0; i < ths.length; ++i) {
        var th = ths[i];
        if (th.innerHTML.indexOf(text) == -1)
            continue;
        if (th.nextSibling)
            return th.nextSibling.nextSibling;
        return;
    }
}

function textAfter(text) {
    var content = elementAfter(text);
    if (!content)
        return "";
    if (content.children.length == 0) {
        return trim(content.innerHTML);
    }
    var str = "";
    for (var c = 0; c < content.children.length; ++c) {
        if (str.length > 0) {
            str += ", ";
        }
        str += trim(content.children[c].innerHTML);
    }
    return str;
}

function getTitle() {
    var title = document.getElementsByClassName("appPlainTitle")[0];
    return trim(title.innerHTML);
}

var title = getTitle();
var loc = textAfter("Location");
var schedule = textAfter("Schedule");
var description = textAfter("Description");
var panelists = textAfter("Panelists");

console.log(title);
console.log(loc);
console.log(schedule);
console.log(description);
console.log(panelists);
