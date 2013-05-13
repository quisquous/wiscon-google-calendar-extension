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

function createCalendarLink(title, loc, dates, description) {
    var link = document.createElement("a");

    var url = 'http://www.google.com/calendar/event';
    link.href = encodeURI(url + '?ctext=' +
        title + '&action=TEMPLATE&details=' + description + '&location=' +
        loc + '&dates=' + dates);

    var img = document.createElement("img");
    img.src = "http://www.google.com/calendar/images/ext/gc_button1.gif";
    img.style.border = "0px";
    link.appendChild(img);

    return link;
}


var title = getTitle();
var loc = textAfter("Location");
var schedule = textAfter("Schedule");
var description = textAfter("Description");
if (!title || !loc || !schedule || !description)
    return;

description += "\n";
var panelists = textAfter("Panelists");
if (panelists.length > 0)
    description += "\nPanelists: " + panelists;

// TODO(enne): convert to "UTC/UTC" format.
var dates = "";

var scheduleElement = elementAfter("Schedule");
scheduleElement.appendChild(createCalendarLink(title, loc, dates, description));
