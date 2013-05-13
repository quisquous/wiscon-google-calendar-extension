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

function scheduleToDates(str) {
    // Of the form:
    //   "Fri, 1:45-3:00pm"
    //   Sat, 11:30 am-12:45 pm
    //   Sun, 8:45 pm-Mon, 3:00 am
    // Separated by ndash

    var year = "2013";
    var month = "05";

    console.log("Str: " + str);
    var datestrs = str.split("–");  // ndash
    if (datestrs.length != 2)
        return;
    var startStr = datestrs[0];
    var endStr = datestrs[1];

    function strToDay(str) {
        var dayNameToNumber = {
            "Thu": "23",
            "Fri": "24",
            "Sat": "25",
            "Sun": "26",
            "Mon": "27",
        };

        for (var dateStr in dayNameToNumber) {
            if (str.indexOf(dateStr) != -1) {
                return dayNameToNumber[dateStr];
            }
        }
    }
    var startDay = strToDay(startStr);
    var endDay = strToDay(endStr);
    if (!startDay)
        return;
    if (!endDay)
        endDay = startDay;
    console.log("start day: " + startDay);
    console.log("end day: " + endDay);

    function stripOffDay(str) {
        var idx = str.indexOf(", ");
        if (idx == -1)
            return str;
        return str.substring(idx + 2);
    }
    startStr = stripOffDay(startStr);
    endStr = stripOffDay(endStr);

    // Offset from 12->24hour time.
    function strToOffset(str) {
        if (str.indexOf("am") != -1 || str.indexOf("AM") != -1)
            return 0;
        if (str.indexOf("pm") != -1 || str.indexOf("PM") != -1)
            return 12;
        return undefined;
    }
    var startOffset = strToOffset(startStr);
    var endOffset = strToOffset(endStr);
    if (endOffset === undefined)
        return;
    if (startOffset === undefined)
        startOffset = endOffset;
    console.log("start Offset: " + startOffset);
    console.log("end Offset: " + endOffset);

    function stripEverythingButTime(str) {
        return str.replace(/[^0-9:]/g, "");
    }
    startStr = stripEverythingButTime(startStr);
    endStr = stripEverythingButTime(endStr);
    console.log("start Str: " + startStr);
    console.log("end Str: " + endStr);

    var startHM = startStr.split(":");
    if (startHM.length != 2)
        return;
    startHM[0] += startOffset;

    var endHM = endStr.split(":");
    if (endHM.length != 2)
        return;
    endHM[0] += endOffset;

    var startDate = new Date(year, month, startDay, startHM[0], startHM[1]);
    var endDate = new Date(year, month, endDay, endHM[0], endHM[1]);
    if (endDate < startDate)
        return;

    function adjustToUTCFromCDT(date) {
        var seconds = date.getTime();
        var offset = 5 * 60 * 60;
        date.setTime(seconds + offset);
    }
    adjustToUTCFromCDT(startDate);
    adjustToUTCFromCDT(endDate);

    function localDateToString(date) {
        function padWithZero(str) {
            str = "" + str;
            if (str.length == 1)
                return "0" + str;
            return str;
        }

        // YYYYMMDDTHHMMSSZ
        var str = "" + date.getFullYear();
        str += padWithZero(date.getMonth() + 1);
        str += padWithZero(date.getDate());
        str += "T";
        str += padWithZero(date.getHours());
        str += padWithZero(date.getMinutes());
        str += "00Z";
        return str;
    }

    return localDateToString(startDate) + "/" + localDateToString(endDate);
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

var dates = scheduleToDates(schedule);
if (!dates)
    return;

var scheduleElement = elementAfter("Schedule");
scheduleElement.appendChild(createCalendarLink(title, loc, dates, description));
